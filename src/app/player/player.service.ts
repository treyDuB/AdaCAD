import { Injectable} from '@angular/core';
import { EventEmitter } from 'events';
import utilInstance from '../core/model/util';
import { warps, wefts, flipDraft, initDraftWithParams } from '../core/model/drafts';
import { Draft } from '../core/model/datatypes';
import { BuildableOperation as GenericOp, OpInput, NumParam
} from '../mixer/model/operation';
import * as defs from '../mixer/model/op_definitions';
import { PlayerOp, playerOpFrom, forward, refresh, reverse
} from './model/playerop';
import { PlayerState, WeavingPick, copyState } from './model/state';
import { MappingsService } from './provider/mappings.service';
import { PedalsService, Pedal } from './provider/pedals.service';
import { SequencerService } from './provider/sequencer.service';
import { PlaybackService } from './provider/playback.service';

export interface DraftOperationClassification {
  category_id: number,
  category: string,
  dx: string,
  ops: Array<PlayerOp> 
 }

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
  draftClassificationS: Array<DraftOperationClassification> = [];
  draftClassificationT: Array<DraftOperationClassification> = [];

  constructor(
    public pedals: PedalsService,
    public mappings: MappingsService, 
    public seq: SequencerService,
    public playback: PlaybackService,   // has the Player state
    // private oss: OperationService
  ) {

    this.loom = { warps: 2640, draftTiling: true };

    // load the draft progress ops
    mappings.addOperation(forward);
    mappings.addOperation(refresh);
    mappings.addOperation(reverse);

    function addOp(op: GenericOp, params?: Array<number | string>) {
      let p_op = params ? playerOpFrom(op, params) : playerOpFrom(op);
      mappings.addOperation(p_op);
      return p_op;
    }

    // load ops from the main mixer
    const tabby = addOp(defs.tabby);
    const twill = addOp(defs.twill);
    const satin = addOp(defs.satin);
    const waffle = addOp(defs.waffle);
    const basket = addOp(defs.basket);
    const rib = addOp(defs.rib);
    const random = addOp(defs.random);
    const rotate = addOp(defs.rotate);
    const invert = addOp(defs.invert);
    const shiftx = addOp(defs.shiftx);
    const shifty = addOp(defs.shifty);
    const slope = addOp(defs.slope);
    const flipx = addOp(defs.flipx);
    const flipy = addOp(defs.flipy);
    const symm = addOp(defs.makesymmetric);
    const stretch = addOp(defs.stretch);
    const bindweft = addOp(defs.bindweftfloats);
    const bindwarp = addOp(defs.bindwarpfloats);

    const tile: PlayerOp = {
      name: defs.tile.name,
      classifier: 'pipe',
      perform: (init: PlayerState) => {
        let res = copyState(init);
        res.draft = defs.tile.perform([init.draft], [2, 2]);
        res.row = init.row % wefts(res.draft.drawdown);
        res.pedal = defs.tile.name;
        return Promise.resolve(res);
      }
    }
    mappings.addOperation(tile);

    const chaos: PlayerOp = {
      name: 'chaos',
      classifier: 'pipe',
      dx: 'tiles the input drafts, randomly selecting which draft to place at which position',
      params: <Array<NumParam>>[
        {
          name: 'warp-repeats',
          type: 'number',
          min: 1,
          max: 100,
          value: 2,
          dx: 'the number of times to repeat this time across the width'
        }, {
          name: 'weft-repeats',
          type: 'number',
          min: 1,
          max: 100,
          value: 2,
          dx: 'the number of times to repeat this time across the length'
        }
      ],
      perform: async (init: PlayerState) => {
        const res = copyState(init);
        const draft = res.draft;

        const total_warps = warps(draft.drawdown);
        // const total_warps = utilInstance.lcm(all_warps);
        const total_wefts = wefts(draft.drawdown);
        // const total_wefts = utilInstance.lcm(all_wefts);

        const warp_repeats = <number> chaos.params[0].value;
        const weft_repeats = <number> chaos.params[1].value;

        const draft_indexing: Array<Array<Draft>> = [];
        for(let i = 0; i < weft_repeats; i++){
          draft_indexing.push([]);
          for(let j = 0; j < warp_repeats; j++){
            const x_flip = (Math.random() < 0.5) ? false: true; 
            const y_flip = (Math.random() < 0.5) ? false: true; 
            draft_indexing[i].push(await flipDraft(draft, x_flip, y_flip));
          }
        }

        const width: number = warp_repeats*total_warps;
        const height: number = weft_repeats*total_wefts;
        const output: Draft = initDraftWithParams({warps: width, wefts: height});

        output.drawdown.forEach((row, i) => {
          let draft_index_row  = Math.floor(i / total_wefts);
          let within_draft_row = i % total_wefts;
          row.forEach((cell, j) => {
            let draft_index_col  = Math.floor(j / total_warps);
            let within_draft_col  = j % total_warps;

            const draft = draft_indexing[draft_index_row][draft_index_col];

            const w = warps(draft.drawdown);
            const h = wefts(draft.drawdown);
            cell.setHeddle(draft.drawdown[within_draft_row%w][within_draft_col%h].getHeddle()); 
          });
        });
      
        res.draft = output;
        res.row = init.row % wefts(res.draft.drawdown);
        res.pedal = chaos.name;
        return Promise.resolve(res);
      }
    }
    mappings.addOperation(chaos);

    this.draftClassificationS.push(
      { category_id: 0,
        category: 'structure',
        dx: "0-1 input, 1 output, algorithmically generates weave structures based on parameters",
        ops: [tabby, twill, satin, waffle, random]}
    );

    this.draftClassificationS.push(
      { category_id: 1,
        category: 'custom structure',
        dx: "custom structures loaded from the Mixer",
        ops: []
      }
    );

    this.draftClassificationT.push(
      { category_id: 2,
        category: 'transformation',
        dx: "1 input, 1 output, applies an operation to the input that transforms it in some way",
        ops: [invert, flipx, flipy, shiftx, shifty, rotate, slope, stretch, symm, tile, chaos, bindwarp, bindweft]}
    );

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
        mappings[0] = this.seq;
        mappings[1] = this.seq;
        this.seq.mapPedals(0, 1);
      } else if (n == 3) {
        mappings[2] = this.seq;
        this.seq.mapPedal(2, 'sel-back');
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
    let ops = this.draftClassificationS.filter((c) => c.category == "custom structure")[0].ops;
    console.log(ops);
    if (ops.length == 0) return false;
    return ops
      .map((el) => { return el.struct_id == d.id})
      .reduce((a, b) => { return a || b; });
  }

  setDraft(d: Draft) {
    if (!this.hasCustomStructure(d)) {
      console.log("a new structure!");
      let structOps = this.draftClassificationS.filter((c) => c.category == "custom structure")[0].ops;
      let op = this.structureOpFromDraft(d);
      structOps.push(op);
      this.mappings.addOperation(op);
    }
    this.state.draft = d;
    this.state.row = 0;
    // console.log("player has active draft");
    // console.log("draft is ", this.draft);
    console.log("draft set ", this.state);
  }

  /**
   * 
   * @param d the Draft to turn into a custom structure Operation
   */
  structureOpFromDraft(d: Draft) {
    let structOp: PlayerOp = {
      name: d.gen_name,
      struct_id: d.id,
      custom_check: 1,
      classifier: 'seed',
      perform: (init: PlayerState) => {
        let res = copyState(init);
        res.draft = d;
        res.row = init.row % wefts(d.drawdown);
        return Promise.resolve(res);
      }
    };
    return structOp;
  }

  // e is a string = op.name
  setPedalOp(e: any, p: Pedal) {
    console.log(e, p);
    if (this.mappings.pedalIsPaired(p.id)) {
      this.mappings.unmap(p.id);
    }
    this.mappings.pair(p.id, e);
    console.log("pedals map", this.mappings);
  }

  onPedal(id: number) {
    console.log('player service: pedal ', id);
    let mapped = this.mappings.getMap(id);
    // console.log(this.mappings);
    // console.log(this.seq);
    if (mapped) {
      console.log('mapping exists for pedal');
      mapped.perform(this.state, id)
      .then((state: PlayerState) => {
        this.state = state;
        // console.log(this.state);
        this.redraw.emit('redraw');
        if (this.state.weaving) {
          console.log("draft player: sending row");
          this.pedals.sendDraftRow(this.currentRow());
        }
      });
    }
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
