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
  shapes: Array<Shape>;

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
    this.shapes = [];

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

  addShuttle(shuttle: Shuttle) {
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

  insertImage(shuttle: Shuttle) {
    var max = this.rowShuttleMapping.length;
    var data = shuttle.image;
    for (var i=data.length; i > 0; i--) {
      var idx = Math.min(max, i);
      this.rowShuttleMapping.splice(idx,0,shuttle.id);
      this.pattern.splice(idx,0,data[i - 1]);
    }
  }

  addShape(newShape: Shape) {
    newShape.setID(this.shapes.length);
    this.shapes.push(newShape);
  }

  shuttleInShape(id: number, shape: Shape) {
    for (var i = 0; i < shape.shuttles.length; i++) {
      if (id == shape.shuttles[i].id) {
        return true;
      }
    }

    return false;
  }

  shuttleToShape(shuttle: Shuttle, shape: Shape) {
    // first iteration: don't care about insert dir
    var create = false;

    // adding a new shuttle
    if (!this.shuttleInShape(shuttle.id, shape)) {
      shape.shuttles.push(shuttle);
      create = true;
    } else { // updating shuttle, refresh all
      shape.bounds = [];
      shuttle.rowsUsed = [];
    }

    var first = true; 
    var s,e; // start, end

    for (var y=0; y < this.wefts; y++) {
      // for each row in the draft
      if (this.rowToShuttle(y) == shuttle.id) {
        // if this row belongs to the shuttle
        first = true; // begin scanning new row
        for (var x = 0; x < this.warps; x++) { // going across the row
          if (this.isUp(y, x)) { // if there is a black square in this part of the row
            if (first) {
              // we found the start
              s = x;
              first = false;              
            }
            e = x; // keep updating end until the last up heddle in row
          }
        }

        if (!first) { // if the row is not empty
          // we've found the start and end x's, and y is row
          var rowBounds = [y, s, e];
          shuttle.rowsUsed.push(y);
          shape.bounds.push(rowBounds);
        }
      }
    }

    //console.log(shape.printBounds());
    //console.log(shuttle.rowsUsed);
  }

  shapeToDraft(shape: Shape) {
    var row;
    var rowStart;
    var rowEnd;
    for (var i=0; i < shape.bounds.length; i++) {
      // for each row in Shape, parse start/end
      row = shape.bounds[i][0];
      rowStart = shape.bounds[i][1];
      rowEnd = shape.bounds[i][2];

      for (var j=0; j < this.warps; j++) {
        if (j < rowStart) {
          this.pattern[row][j] = false; // clear every square before start of row
        } else if (j == rowStart || j == rowEnd) {
          this.pattern[row][j] = true; // always mark start/end of row, leave everything in between alone
        } else if (j > rowEnd) {
          this.pattern[row][j] = false; // clear every square after end of row
        }
      }
    }
  }

  updateShuttleRows(shuttle: Shuttle) {
    shuttle.rowsUsed = []; // refresh
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
