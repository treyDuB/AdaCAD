import { Component, Input, Output, OnInit} from '@angular/core';
import { DraftPlayerService } from '../provider/draftplayer.service';
// import { PedalsService } from '../../core/provider/pedals.service';
import { OperationService, Operation } from '../provider/operation.service';
import { MaterialsService } from '../../core/provider/materials.service';
// import { TreeService, DraftNode  } from '../provider/tree.service';
import { Draft } from '../../core/model/draft';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {

  @Input()  default_cell: number;
  @Input('draft') active_draft: Draft;
  // @Input() 
  // get draft_set(): boolean {
  //   return (this.pls.draft !== null);
  // };

  // get pls.draft(): Draft { return this._active_draft; }
  // set pls.draft(value: Draft) {
  //   this._active_draft = value;
  // }
  // private _active_draft: Draft = null;

  draft_set: boolean = false;
  draftCanvas: HTMLCanvasElement;
  cx: any;
  ink = 'neq'; //can be or, and, neq, not, splice

  constructor(
    public pls: DraftPlayerService,
    private ms: MaterialsService, 
    private oss: OperationService
  ) { 
    this.default_cell = 5;
  }

  ngOnInit(): void {
    // console.log("ng on init, pedals: ", this.pls.pedals);
    /** FOR TESTING ONLY: generate random draft and set it at start-up */
    const random = this.oss.getOp('random');
    random.perform([], [7, 7, 50]).then((result) => {
      this.pls.setDraft(result[0]);
      this.drawDraft();
    });
  }

  ngAfterViewInit() {
    console.log("ng after view init, pedals: ", this.pls.pedals);
    this.draftCanvas = <HTMLCanvasElement> document.getElementById('active-draft-canvas');
    this.cx = this.draftCanvas.getContext("2d");
    this.drawDraft(); //force call here because it likely didn't render previously. 
    // this.rescale();
    // this.updateViewport(this.bounds);
    this.pls.redraw.on('redraw', () => {
      console.log("redrawing ", this.pls.state);
      this.drawDraft();
    });

  }

  /**
   * COPIED FROM palette/subdraft
   * draw whetever is stored in the this.pls.draft object to the screen
   * @returns 
   */
   drawDraft() {

    if(this.draftCanvas === undefined) return;
    this.cx = this.draftCanvas.getContext("2d");
   
    if(this.pls.draft === null) {
      this.draftCanvas.width = 0;
      this.draftCanvas.height = 0;

    } else {
      this.draft_set = true;
      this.draftCanvas.width = this.pls.draft.warps * this.default_cell;
      this.draftCanvas.height = this.pls.draft.wefts * this.default_cell;

      for (let i = 0; i < this.pls.draft.wefts; i++) {
        for (let j = 0; j < this.pls.draft.warps; j++) {
          this.drawCell(this.default_cell, i, j, false);
        }
      }
    }
    // this.tree.setDraftClean(this.id);
    // return "complete";
  }

  drawCell(cell_size, i, j, usecolor){
    let is_up = this.pls.draft.isUp(i,j);
    let is_set = this.pls.draft.isSet(i, j);
    let color = "#ffffff"
    if(is_set){
      if(this.ink === 'unset' && is_up){
        this.cx.fillStyle = "#999999"; 
      }else{
        if(is_up){
          color = usecolor ? this.ms.getColor(this.pls.draft.getWarpShuttleId(j)) : '#000000';
        }else if (i == this.pls.state.row) {
          color = usecolor ? this.ms.getColor(this.pls.draft.getWeftShuttleId(i)) : '#ffff00';
        } else {
          color = usecolor ? this.ms.getColor(this.pls.draft.getWeftShuttleId(i)) : '#ffffff';
        }
        this.cx.fillStyle = color;
      }
    } else{
      this.cx.fillStyle =  '#0000000d';
    // this.cx.fillStyle =  '#ff0000';

    }
    this.cx.fillRect(j*cell_size, i*cell_size, cell_size, cell_size);
  }

}
