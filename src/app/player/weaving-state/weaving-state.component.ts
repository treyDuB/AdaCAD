import { Component, Input, Output, OnInit, EventEmitter} from '@angular/core';
import { PlayerService } from '../player.service';
import { MaterialsService } from '../../core/provider/materials.service';
import { Draft } from '../../core/model/datatypes';
import { wefts, warps, isUp, isSet } from '../../core/model/drafts';
import { PedalsService } from '../provider/pedals.service';
import { PlaybackService } from '../provider/playback.service';
import { MappingsService } from '../provider/mappings.service';

/**
 * @class
 * Component that displays the Playback of the weaver's session.
 */
@Component({
  selector: 'app-weaving-state',
  templateUrl: './weaving-state.component.html',
  styleUrls: ['./weaving-state.component.scss']
})
export class WeavingStateComponent implements OnInit {

  @Input()  default_cell: number;
  @Input('draft') active_draft: Draft;

  @Output() isWeaving = new EventEmitter<boolean>();

  draft_set: boolean = false;
  ownElement: HTMLElement;
  mixerElement: HTMLElement;
  draftCanvas: HTMLCanvasElement;
  cx: any;
  ink = 'neq'; //can be or, and, neq, not, splice

  constructor(
    public pls: PlayerService,
    public pds: PedalsService,
    public map: MappingsService,
    public pbs: PlaybackService
  ) { 
    this.default_cell = 10;
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.ownElement = document.getElementById('player-container');
    this.mixerElement = document.querySelector('.mat-drawer-container');
    console.log("init w/ element refs ", this.ownElement, this.mixerElement);
    this.draftCanvas = <HTMLCanvasElement> document.getElementById('active-draft-canvas');
    this.cx = this.draftCanvas.getContext("2d");

    this.pls.redraw.on('redraw', () => {
      // console.log("redrawing ", this.pls.state);
      this.drawPlayback();
      // this.resizeContainer();
    });

  }

  toggleWeaving() {
    this.pls.toggleWeaving();
    // console.log("toggle weaving ", this.pls.weaving);
    this.isWeaving.emit(this.pls.weaving);
  }

  test(){
    console.log(this.map);
    return this.map;
  }

  /**
   * COPIED FROM palette/subdraft
   * draw whetever is stored in the this.pls.draft object to the screen
   * @method
   * @returns void
   */
   drawPlayback(flipY: boolean = true) {
    const playback = this.pbs;
    const preview = playback.preview.drawdown;
    const history = playback.history.drawdown;

    if(this.draftCanvas === undefined) return;
    this.cx = this.draftCanvas.getContext("2d");
   
    if (playback.no_draft) {
      this.draftCanvas.width = 0;
      this.draftCanvas.height = 0;
    } else {
      this.draft_set = true;
      this.draftCanvas.width = (playback.max_width+2) * this.default_cell;
      this.draftCanvas.height = (playback.previewHeight + playback.historyHeight) * this.default_cell;

      for (let i = 0; i < wefts(preview); i++) {
        for (let j = 0; j < warps(preview); j++) {
          this.drawPreviewCell(this.default_cell, i, j, flipY);
        }
        if (i == 0) {
          this.drawProgressBar(this.default_cell, i, warps(this.pls.draft.drawdown), flipY);
        }
      }

      for (let i = 0; i < wefts(history); i++) {
        for (let j = 0; j < warps(history); j++) {
          this.drawHistoryCell(this.default_cell, i, j, flipY);
        }
      }
    }
  }

  /**
   * @method
   * @param cell_size size of one square in the draft
   * @param i x coord
   * @param j y coord
   * @param flipY whether or not to flip vertically
   */
  drawPreviewCell(cell_size: number, i: number, j: number, flipY: boolean = true){
    const preview = this.pbs.preview.drawdown;
    let is_up = isUp(preview, i,j);
    let is_set = isSet(preview, i, j);
    let color = "#ffffff"
    if (is_set) {
      if(this.ink === 'unset' && is_up){
        this.cx.fillStyle = "#999999"; 
      }else{
        if (is_up) {
          color = '#000000'; //usecolor ? this.ms.getColor(this.pls.draft.getWarpShuttleId(j)) : 
        }else if (i == 0) { // highlight current row in yellow
          color = '#ffff00'; //usecolor ? this.ms.getColor(this.pls.draft.getWeftShuttleId(i)) :
        } else {
          color = '#ffffff'; // usecolor ? this.ms.getColor(this.pls.draft.getWeftShuttleId(i)) : 
        }
        this.cx.fillStyle = color;
      }
    } else {
      this.cx.fillStyle =  '#0000000d';
    }
    let y = flipY ? wefts(preview)-1 - i : i;
    this.cx.fillRect((j+1)*cell_size, y*cell_size, cell_size, cell_size);
  }

  drawProgressBar(cell_size: number, i: number, width: number, flipY: boolean = true) {
    const playback = this.pbs;
    const preview = playback.preview.drawdown;

    this.cx.fillStyle =  '#ffff00';
    let y = flipY ? wefts(preview)-1 - i : i;
    this.cx.fillRect(0, y*cell_size, cell_size, cell_size);
    this.cx.fillRect((width+1)*cell_size, y*cell_size, cell_size, cell_size);
  }

  drawHistoryCell(cell_size: number, i: number, j: number, flipY: boolean = true) {
    const playback = this.pbs;
    const preview = playback.preview.drawdown;
    const history = playback.history.drawdown;

    let is_up = isUp(history, i, j);
    let is_set = isSet(history, i, j);
    let color = "#ffffff"
    if (is_set) {
      if(this.ink === 'unset' && is_up){
        this.cx.fillStyle = "#999999"; 
      } else {
        if (is_up) {
          color = '#999999'; //usecolor ? this.ms.getColor(this.pls.draft.getWarpShuttleId(j)) : 
        } else {
          color = '#ffffff'; // usecolor ? this.ms.getColor(this.pls.draft.getWeftShuttleId(i)) : 
        }
        this.cx.fillStyle = color;
      }
      let y = flipY ? wefts(preview) + i : wefts(history)-1-i;
      this.cx.fillRect((j+1)*cell_size, y*cell_size, cell_size, cell_size);
    } 
    // else {
    //   this.cx.fillStyle =  '#0000000d';
    // }
    
  }
}


