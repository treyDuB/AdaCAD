import { Injectable} from '@angular/core';
import { EventEmitter } from 'events';
import { wefts } from '../core/model/drafts';
import { Draft } from '../core/model/datatypes';
import { BaseOp, BuildableOperation as GenericOp, 
  TreeOperation as TreeOp,
  Seed, Pipe, DraftsOptional, AllRequired, getDefaultParams,
  SingleInlet, OpInput
} from '../mixer/model/operation';
import * as defs from '../mixer/model/op_definitions';
import { PlayerOp, playerOpFrom, 
  ChainOp, OpSequencer, PairedOp, PedalOpMapping,
  makePairedOp, makeChainOp, makeOpSequencer,
  forward, refresh, reverse
} from './model/op_mappings';
import { PlayerState, WeavingPick, copyState, initState } from './model/state';
import { MappingsService } from './provider/mappings.service';
import { PedalsService, PedalStatus, Pedal } from './provider/pedals.service';
import { SequencerService } from './provider/sequencer.service';
import { PlaybackService } from './provider/playback.service';
// import { OperationService } from '../mixer/provider/operation.service';

export interface DraftOperationClassification {
  category: string,
  dx: string,
  ops: Array<PlayerOp> 
 }

interface LoomConfig {
  warps: number,
  draftTiling: boolean
}

/**
 * @class PedalConfig
 * @desc OLD, UPDATE THIS ---> 
 * Represents a set of two-way bindings between a set of Pedals
 * and a set of (Player) Operations. A pedal can only be bound to one
 * Action (a single Op, a chain of Ops, or to control an OpRoulette)
 * @todo The second restriction may change, it might make sense for pedals to
 * get bound to a sequence of operations.
 */
class PedalConfig {
  // numPedals: number;
  pedals: Array<Pedal>;
  ops: Array<PlayerOp>;
  availPedals: Array<number>;
  mapping: PedalOpMapping;

  constructor(pedalArray: Array<Pedal>, loadConfig = false) {
    this.pedals = pedalArray;
    this.ops = []
    this.availPedals = pedalArray.map((p) => p.id);
    this.mapping = [];
  }

  get numPedals() {
    return this.pedals.length;
  }

  get numMappings() {
    return Object.entries(this.mapping).length;
  }

  addPedal(p: Pedal) {
    // this.pedals.push(p);
    this.availPedals.push(p.id);
  }

  remPedal() {
    // this.pedals.pop();
    this.availPedals.filter((id) => id != this.pedals.length);
  }

  addOperation(o: PlayerOp) {
    o.id = this.ops.length;
    this.ops.push(o);
    // this.unpairedOps.push(o);
    // console.log(this.ops);
  }

  pair(pedalId: number, opName: string) {
    let o = this.ops.findIndex((op) => op.name == opName);
    // let thisOp = this.unpairedOps.splice(o, 1);
    let thisOp = this.ops;
    this.mapping[pedalId] = makePairedOp(pedalId, thisOp[o]); 
  }

  chain(pedalId: number, opName: string) {
    let o = this.ops[this.ops.findIndex((op) => op.name == opName)];
    if (this.pedalIsChained(pedalId)) {
      let curr_ops = (<ChainOp> this.mapping[pedalId]).ops;
      this.mapping[pedalId] = makeChainOp(curr_ops.concat([o]), pedalId);
    } else if (this.pedalIsPaired(pedalId)) {
      let first_op = (<PairedOp> this.mapping[pedalId]).op;
      this.mapping[pedalId] = makeChainOp([first_op].concat([o]), pedalId);
    } else {
      this.mapping[pedalId] = makeChainOp([o], pedalId);
    }
  }

  chainToPedal(pedalId: number, ops: Array<string>) {
    let op_array = ops.map((name) => this.ops[this.ops.findIndex((op) => op.name == name)]);
    if (this.pedalIsChained(pedalId)) { 
      // if pedal already has a chain, add ops to the chain
      let curr_ops = (<ChainOp> this.mapping[pedalId]).ops;
      this.mapping[pedalId] = makeChainOp(curr_ops.concat(op_array), pedalId);
    } else if (this.pedalIsPaired(pedalId)) {
      // if pedal is paired, you can turn it into a chain
      let first_op = (<PairedOp> this.mapping[pedalId]).op;
      this.mapping[pedalId] = makeChainOp([first_op].concat(op_array), pedalId);
    } else {
      // pedal doesn't have anything mapped, just add a new chain
      this.mapping[pedalId] = makeChainOp(op_array, pedalId);
    }
  }

  // will return true if an op is mapped to a pedal in any way
  opIsMapped(opName: string): boolean {
    if (this.mapping.filter((m) => m.name.includes(opName)).length > 0) {
      return true;
    } else return false;
  }

  pedalIsMapped(id: number) {
    return (this.mapping[id]);
  }

  pedalIsChained(id: number) {
    if (this.pedalIsMapped(id) && this.mapping[id].name.startsWith('ch')) { return true; }
    else {return false; }
  }

  pedalIsPaired(id: number) {
    return (this.pedalIsMapped(id) && !this.pedalIsChained(id));
  }

  unpairPedal(id: number) {
    console.log(`unpairing pedal ${id}`);
    // let op = this.pairs[id];
    // this.unpairedOps.splice(op.id, 0, op);
    delete this.mapping[id];
  }

  // unpairOp(name: string) {
  //   let pid = this.opIsPaired(name);
  //   this.unpairPedal(pid);
  // }
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
  draftClassification: Array<DraftOperationClassification> 
  = [];

  constructor(
    public pedals: PedalsService,
    public mappings: MappingsService,   // TODO: move Player operations here
    public seq: SequencerService,
    public playback: PlaybackService,   // has the Player state
    // private oss: OperationService
  ) {
    // this.draft = null; 
    console.log("draft player constructor");
    // const startPattern = playerOpFrom(defs.tabby);
    // console.log(startPattern);
    // startPattern.perform(nullOpInput).then((result) => {
    //   console.log(result);
    //   this.setDraft(result[0]);
    // });


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

    this.draftClassification.push(
      {category: 'structure',
      dx: "0-1 input, 1 output, algorithmically generates weave structures based on parameters",
      ops: [tabby, twill, satin, waffle, random]}
    );

    this.draftClassification.push(
      { category: 'custom structure',
        dx: "custom structures loaded from the Mixer",
        ops: []
      }
    );

    this.draftClassification.push(
      {category: 'transformation',
      dx: "1 input, 1 output, applies an operation to the input that transforms it in some way",
      ops: [invert, flipx, flipy, shiftx, shifty, rotate, slope, stretch, symm, tile, bindwarp, bindweft]}
    );

    // //test this
    // console.log(this.oss.getOp('germanify'));
    // const germanify = this.pedalOps.addOperation(playerOpFromTree(<PlayableTreeOp> this.oss.getOp('germanify')));
    
    console.log('pedal ops added');

    pedals.on('pedal-step', (id) => this.onPedal(id));

    pedals.on('pedal-added', (n) => {
      if (n == 1) {
        mappings.pair(0, 'forward');
        console.log("pedals mapping", mappings);
      } else if (n == 2) {
        if (mappings.pedalIsMapped(0)) mappings.unmap(0);
        mappings[0] = this.seq;
        mappings[1] = this.seq;
        this.seq.addPedals(0, 1);
        console.log("pedals mapping", mappings);
      }
    })
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
    return this.pedals.active_draft.val;
  }
  get draft() {
    return this.state.draft;
  }

  hasCustomStructure(d: Draft): boolean {
    let ops = this.draftClassification.filter((c) => c.category == "custom structure")[0].ops;
    console.log(ops);
    if (ops.length == 0) return false;
    return ops
      .map((el) => { return el.struct_id == d.id})
      .reduce((a, b) => { return a || b; });
  }

  setDraft(d: Draft) {
    if (!this.hasCustomStructure(d)) {
      console.log("a new structure!");
      let structOps = this.draftClassification.filter((c) => c.category == "custom structure")[0].ops;
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
