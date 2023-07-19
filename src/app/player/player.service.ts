import { Injectable} from '@angular/core';
import { EventEmitter } from 'events';
import utilInstance from '../core/model/util';
import { warps, wefts, flipDraft, initDraftWithParams, setHeddle } from '../core/model/drafts';
import { Draft, Operation, OperationClassification } from '../core/model/datatypes';
// import { OpTemplate as MenuOp, playerOpFrom, forward, refresh, reverse, SingleOpTemplate, CustomStructOp
// } from './model/playerop';
import { PlayerState, WeavingPick} from './model/state';
import { MappingsService } from './provider/mappings.service';
import { PedalsService, Pedal } from './provider/pedals.service';
// import { SequencerService } from './provider/sequencer.service';
import { PlaybackService } from './provider/playback.service';
// import { SequencerMapping } from './model/maptypes';
import { getCellValue } from '../core/model/cell';
import { OperationDescriptionsService } from '../core/provider/operation-descriptions.service';
import { OperationService } from '../core/provider/operation.service';

// export interface DraftOperationClassification {
//   category_id: number,
//   category: string,
//   dx: string,
//   ops: Array<MenuOp> 
//  }

interface LoomConfig {
  warps: number,
  draftTiling: boolean
}

/**
 * The Draft Player Service is in charge of updating the the global PlayerState and tracking where the weaver is in the draft.
 */
@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  loom: LoomConfig;
  redraw = new EventEmitter();
  draftClassificationS: Array<OperationClassification> = [];
  draftClassificationT: Array<OperationClassification> = [];
  constructor(
    public pedals: PedalsService,
    public mappings: MappingsService, 
    public seq: SequencerService,
    public playback: PlaybackService,   // has the Player state
    public op_service:OperationService,
    public op_desc_service: OperationDescriptionsService
    // private oss: OperationService
  ) {

    this.loom = { warps: 2640, draftTiling: true };




    // load the draft progress ops
    mappings.addMenuOperation(<Operation> forward);
    mappings.addMenuOperation(<Operation> refresh);
    mappings.addMenuOperation(<Operation> reverse);

    // function addOp(op: Operation, params?: Array<number | string>) {
    //   let p_op = params ? playerOpFrom(op, params) : playerOpFrom(op);
    //   mappings.addMenuOperation(p_op);
    //   return p_op;
    // }

    // load ops from the main mixer
    // const tabby = addOp(this.op_service.getOp('tabby'));
    // const twill = addOp(this.op_service.getOp('twill'));
    // const satin = addOp(this.op_service.getOp('satin'));
    // const waffle = addOp(defs.waffle);
    // const basket = addOp(defs.basket);
    // const rib = addOp(defs.rib);
    // const random = addOp(defs.random);
    // const rotate = addOp(defs.rotate);
    // const invert = addOp(defs.invert);
    // const shiftx = addOp(defs.shiftx);
    // const shifty = addOp(defs.shifty);
    // const slope = addOp(defs.slope);
    // const flipx = addOp(defs.flipx);
    // const flipy = addOp(defs.flipy);
    // const symm = addOp(defs.makesymmetric);
    // const stretch = addOp(defs.stretch);
    // const bindweft = addOp(defs.bindweftfloats);
    // const bindwarp = addOp(defs.bindwarpfloats);
    // const tile = addOp(defs.tile);


    // : SingleOpBase = {
    //   name: defs.tile.name,
    //   classifier: 'pipe',
    //   perform: (init: PlayerState) => {
    //     let res = copyState(init);
    //     res.draft = defs.tile.perform([init.draft], [2, 2]);
    //     res.row = init.row % wefts(res.draft.drawdown);
    //     res.pedal = defs.tile.name;
    //     return Promise.resolve(res);
    //   }
    // }
    // mappings.addMenuOperation(tile);

    this.draftClassificationS = this.op_desc_service.getOpClassifications();
   
    console.log(mappings.ops);

    // //test this
    // console.log(this.oss.getOp('germanify'));
    // const germanify = this.pedalOps.addOperation(playerOpFromTree(<PlayableTreeOp> this.oss.getOp('germanify')));
    
    console.log('pedal ops added');

    pedals.on('pedal-step', (id) => this.onPedal(id));

    pedals.on('pedal-added', (n) => {
      if (n == 1) {
        mappings.pair(0, 'forward');
      } else if (n == 2) {
        if (mappings.pedalIsMapped(0)) mappings.unmap(0);
        mappings.mapToSequencer(0, {role: 'prog', op_name: 'forward'});
        mappings.mapToSequencer(1, {role: 'sel', dir: true, seq: mappings});
        this.seq.mapPedals(0, 1);
      } else if (n == 3) {
        if (mappings.pedalIsMapped(0)) mappings.unmap(0);
        if (mappings.pedalIsMapped(1)) mappings.unmap(1);
        mappings.mapToSequencer(0, {role: 'prog', op_name: 'forward'});
        mappings.mapToSequencer(1, {role: 'sel', dir: false, seq: mappings});
        mappings.mapToSequencer(2, {role: 'sel', dir: true, seq: mappings});
        this.seq.mapPedal(1, 'sel-back');
        this.seq.mapPedal(2, 'sel-next');
      }
      console.log("pedals mapping", mappings);
    })
    
    this.redraw.emit('redraw');
  }

  get readyToWeave() {  // need either one pedal forward or one pedal reverse, in order to progress through draft
    return (this.pedals.readyToWeave && 
      (this.mappings.opIsMapped('forward') || this.mappings.opIsMapped('reverse') || this.seq.readyToWeave)
    );
  }

  get ops() { return this.mappings.ops; }
  get state() { return this.playback.state; }
  set state(s: PlayerState) { this.playback.setState(s); }

  /** get whether or not the loom is weaving */
  get weaving() {
    return this.pedals.active_draft.val as boolean;
  }
  get draft() {
    return this.state.draft;
  }

  hasCustomStructure(d: Draft): boolean {
        //COMMENTED FOR COMPILING BY LAURA

    // let ops = this.draftClassificationS.filter((c) => c.category == "custom structure")[0].ops;
    // console.log(ops);
    // if (ops.length == 0) return false;
    // return ops
    //   .map((el) => { return (<CustomStructOp> el).struct_id == d.id})
    //   .reduce((a, b) => { return a || b; });
    return false;
  }

  setDraft(d: Draft) {
    //COMMENTED FOR COMPILING BY LAURA
    // if (!this.hasCustomStructure(d)) {
    //   console.log("a new structure!");
    //   let structOps = this.draftClassificationS.filter((c) => c.category == "custom structure")[0].ops;
    //   let op = this.structureOpFromDraft(d);
    //   structOps.push(op);
    //   this.mappings.addMenuOperation(<MenuOp> op);
    // }
    // this.state.draft = d;
    // this.state.row = 0;
    // console.log("draft set ", this.state);
  }

  /**
   * 
   * @param d the Draft to turn into a custom structure Operation
   */
  // structureOpFromDraft(d: Draft) {
  //   let structOp: CustomStructOp = {
  //     id: d.id,
  //     name: d.gen_name,
  //     struct_id: d.id,
  //     params: [],
  //     custom_check: 1,
  //     classifier: 'struct',
  //     perform: (init: PlayerState) => {
  //       let res = copyState(init);
  //       res.draft = d;
  //       res.row = init.row % wefts(d.drawdown);
  //       return Promise.resolve(res);
  //     }
  //   };
  //   return structOp;
  // }

  // e = op.name
  setPedalOp(e: string, p: Pedal) {
    console.log(e, p);
    if (this.mappings.pedalIsPaired(p.id)) {
      this.mappings.unmap(p.id);
    }
    this.mappings.pair(p.id, e);
    console.log("pedals map", this.mappings);
  }

  onPedal(id: number) {
    console.log('player service: pedal ', id);
    let mapped = this.mappings.getMapByID(id);
    console.log(mapped);
    console.log(this.mappings);
    // console.log(this.seq);
    // if (mapped) {
    //   let performer;
    //   console.log('mapping exists for pedal');
    //   if ((<SequencerMapping> mapped).role) { performer = this.seq; }
    //   else performer = mapped;
    //   performer.perform(this.state, id)
    //   .then((state: PlayerState) => {
    //     this.state = state;
    //     // console.log(this.state);
    //     this.redraw.emit('redraw');
    //     if (this.state.weaving) {
    //       console.log("draft player: sending row");
    //       this.pedals.sendDraftRow(this.currentRow());
    //     }
    //   });
    // }
  }

  currentRow() {
    let {draft, row} = this.state;
    let draftRow = draft.drawdown[row % wefts(draft.drawdown)];
    let data = "";

    let targetLength = (this.loom.draftTiling ? this.loom.warps : draftRow.length);
    while (data.length < targetLength) {
      for (var i in draftRow) {
        if (draftRow[i].is_up) {
          data += '1';
        } else {
          data += '0';
        }
      }
    }
    let pick: WeavingPick = { pickNum: row, rowData: data };
    return pick;
  }

  toggleDraftTiling(e) {
    // console.log("toggle ", e);
    this.loom.draftTiling = e.checked;
    // console.log("draft tiling ", this.loom.draftTiling);
  }

  changeLoomWidth(e) {
    // console.log(e.target.value);
    this.loom.warps = e.target.value;
    // console.log("warps", this.loom.warps);
  }

  toggleWeaving() {
    // don't let user start weaving until AT LEAST:
    // - 1 pedal connected AND
    // - 1 pedal configured with operation "forward" or "reverse"
    this.state.weaving = !this.state.weaving;
    this.pedals.toggleWeaving();
    if (this.state.weaving) {
      // send the first row right away
      this.pedals.sendDraftRow(this.currentRow());
    }
  }
}
