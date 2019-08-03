import { Shuttle } from './shuttle';
import { Shape } from './shape';

import * as _ from 'lodash';

/**
 * Definition of draft interface.
 * @interface
 */
export interface DraftInterface {
  pattern: Array<Array<boolean>>;
  shuttles: Array<Shuttle>;
  rowShuttleMapping: Array<number>;
  connections: Array<any>;
  labels: Array<any>;
  wefts: number;
  warps: number;
  selvedgeL: Array<boolean>;
  selvedgeR: Array<boolean>;

}

/**
 * Definition and implementation of draft object.
 * @class
 */
export class Draft implements DraftInterface {
  pattern: Array<Array<boolean>>;
  shuttles: Array<Shuttle>; // shuttles in use
  rowShuttleMapping: Array<number>;
  visibleRows: Array<number>;
  connections: Array<any>;
  shapes: Array<Shape>; // associated shapes
  labels: Array<any>;
  wefts: number;
  warps: number;
  epi: number;

  // selvedge containers, length should equal pattern height
  selvedgeL: Array<boolean>;
  selvedgeR: Array<boolean>;

  constructor(wefts, warps, epi) {
    let l = new Shuttle();
    l.setID(0);
    l.setVisible(true);
    l.setThickness(epi);
    this.wefts = wefts;
    this.warps = warps;
    this.epi = epi;
    this.shuttles = [l];
    this.rowShuttleMapping = [];
    this.visibleRows = [];

    for(var i = 0; i < wefts; i++) {
        this.rowShuttleMapping.push(0);
        this.visibleRows.push(i);
    }

    this.connections = [];
    this.labels = [];
    this.pattern = [];

    for(var i = 0; i < wefts; i++) {
      this.pattern.push([]);
      for (var j = 0; j < warps; j++)
        this.pattern[i].push(false);
    }
  }

  isUp(i:number, j:number) : boolean{
    var row = this.visibleRows[i];
    if ( row > -1 && row < this.pattern.length && j > -1 && j < this.pattern[0].length) {
      return this.pattern[row][j];
    } else {
      return false;
    }
  }

  setHeddle(i:number, j:number, bool:boolean) {
    var row = this.visibleRows[i];
    this.pattern[row][j] = bool;
  }

  rowToShuttle(row: number) {
    return this.rowShuttleMapping[row];
  }

  updateVisible() {
    var i = 0;
    var shuttles = [];
    var visible = [];
    for (i = 0; i < this.shuttles.length; i++) {
      shuttles.push(this.shuttles[i].visible);
    }

    for (i = 0; i< this.rowShuttleMapping.length; i++) {
      var show = shuttles[this.rowShuttleMapping[i]];

      if (show) {
        visible.push(i);
      }
    }

    this.visibleRows = visible;
  }

  addLabel(row: number, label: any) {

  }

  createConnection(shuttle: Shuttle, line: any) {

  }

  deleteConnection(lineId: number) {

  }

  updateSelection(selection: any, pattern: any, type: string) {
    console.log(selection, pattern, type);
    const sj = Math.min(selection.start.j, selection.end.j);
    const si = Math.min(selection.start.i, selection.end.i);

    const rows = pattern.length;
    const cols = pattern[0].length;

    var w,h;

    w = selection.width / 20;
    h = selection.height / 20;

    for (var i = 0; i < h; i++ ) {
      for (var j = 0; j < w; j++ ) {
        var row = this.visibleRows[i + si];
        var temp = pattern[i % rows][j % cols];
        var prev = this.pattern[row][j + sj];

        switch (type) {
          case 'invert':
            this.pattern[row][j + sj] = !temp;
            break;
          case 'mask':
            this.pattern[row][j + sj] = temp && prev;
            break;
          case 'mirrorX':
            temp = pattern[(h - i - 1) % rows][j % cols];
            this.pattern[row][j + sj] = temp;
            break;
          case 'mirrorY':
            temp = pattern[i % rows][(w - j - 1) % cols];
            this.pattern[row][j + sj] = temp;
            break;
          default:
            this.pattern[row][j + sj] = temp;
            break;
        }
      }
    }
  }

  insertRow(i: number, shuttleId: number) {
    var col = [];

    for (var j = 0; j < this.warps; j++) {
      col.push(false);
    }

    this.wefts += 1;

    this.rowShuttleMapping.splice(i,0,shuttleId);
    this.pattern.splice(i,0,col);
    this.updateVisible();

  }

  cloneRow(i: number, c: number, shuttleId: number) {
    var row = this.visibleRows[c];
    const col = _.clone(this.pattern[c]);

    console.log(i, c, shuttleId);

    this.wefts += 1;

    this.rowShuttleMapping.splice(i, 0, shuttleId);
    this.pattern.splice(i, 0, col);

    this.updateVisible();
  }

  deleteRow(i: number) {
    var row = this.visibleRows[i];
    this.wefts -= 1;
    this.rowShuttleMapping.splice(i, 1);
    this.pattern.splice(i, 1);

    this.updateVisible();
  }

  updateConnections(index: number, offset: number) {
    var i = 0;

    for (i = 0; i < this.connections.length; i++) {
      var c = this.connections[i];
      if (c.start.y > index) {
        c.start.y += offset;
      }
      if (c.end.y > index) {
        c.end.y += offset;
      }
    }
  }

  addShuttle(shuttle) {
    shuttle.setID(this.shuttles.length);
    shuttle.setVisible(true);
    if (!shuttle.thickness) {
      shuttle.setThickness(this.epi);
    }
    this.shuttles.push(shuttle);

    if (shuttle.image) {
      this.insertImage(shuttle);
    }

  }

  insertImage(shuttle) {
    var max = this.rowShuttleMapping.length;
    var data = shuttle.image;
    for (var i=data.length; i > 0; i--) {
      var idx = Math.min(max, i);
      this.rowShuttleMapping.splice(idx,0,shuttle.id);
      this.pattern.splice(idx,0,data[i - 1]);
    }
  }

  shuttleToShape(shuttle: Shuttle, shape: Shape) {
    // first iteration: don't care about insert dir
    shape.shuttles.push(shuttle);
    var first = true; 
    var s,e; // start, end

    for (var y=0; y < this.wefts; y++) {
      // for each row in the draft
      if (this.rowToShuttle(y) == shuttle.id) {
        // if this row belongs to the shuttle
        shuttle.rowsUsed.push(y);
        first = true; // begin scanning new row
        for (var x = 0; x < this.pattern[y].length; x++) { // going across the row
          if (this.isUp(y, x)) { // if there is a black square in this part of the row
            if (first) {
              // we found the start
              s = x;
              first = false;              
            }
            e = x; // keep updating end until the last up heddle in row
          }
        }
        // we've found the start and end x's, and y is row
        var rowBounds = [y, s, e];
        shape.bounds.push(rowBounds);
      }
    }
  }

  updateShuttleRows(shuttle: Shuttle) {
    for (var i=0; i < this.wefts; i++) {
      if (this.rowToShuttle(i) == shuttle.id) {
        shuttle.rowsUsed.push(i);
      }
    }
  }

  getColor(index) {
    var row = this.visibleRows[index];
    var id = this.rowShuttleMapping[row];
    var shuttle = this.shuttles[id];

    return shuttle.color;
  }

  clearSelvedge(){
    for (var i=0; i < this.wefts; i++) {
      this.selvedgeL[i] = false;
      this.selvedgeR[i] = false;
    }
  }

  // adds selvedge to the outside of the draft, adding two columns
  addSelvedge(){
    console.log("Adding selvedge. Draft width: " + this.warps);
    for (var i=0; i < this.wefts; i++) {
      this.pattern[i].unshift(this.selvedgeL[i]);
      this.pattern[i].push(this.selvedgeR[i]);
    }
    this.warps += 2;
    console.log("Added selvedge. Draft width: " + this.warps);
  }

  removeSelvedge(){
    for (var i=0; i < this.visibleRows.length; i++) {
      this.pattern[i].shift();
      this.pattern[i].pop();
    }
    this.warps -= 2;
  }

  // replaces first and last columns of the draft with selvedge
  replaceSelvedge(){
    for (var i=0; i < this.visibleRows.length; i++) {
      this.pattern[i].shift();
      this.pattern[i].pop();
      this.pattern[i].unshift(this.selvedgeL[i]);
      this.pattern[i].push(this.selvedgeR[i]);
    }
  }

}
