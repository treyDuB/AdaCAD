import { Injectable } from '@angular/core';
import { Pedal, PedalsService } from './pedals.service';
import { PlayerService } from '../player.service';
import { SingleOp, PlayerOp } from '../model/playerop';
import { ChainOp, makeChainOp } from '../model/chainop';
import { SequencerService } from './sequencer.service';
import { PairedOp, makePairedOp, MappingShapes, PedalAction } from '../model/mapping';

type MappingIndex = {
  [m in keyof MappingShapes]: Array<PedalAction>;//Array<MappingShapes[m]>;
}

function newMapIndex(): MappingIndex {
  return {
    'pairing': [],
    'chain': [],
    'sequencer': [],
    'param': [],
  }
}

/**
 * @class MappingsService (was PedalConfig class)
 * @desc Keeps track of:
 *  - All options for PlayerOps
 *  - A collection of key: value entries where keys (numbers)
 * correspond to pedal ID's, and values (PedalActions) correspond 
 * to a mapped SingleOp, ChainOp, or OpSequencer.
 * @todo I WILL ASSUME THAT IF MULTIPLE PEDALS ARE MAPPED TO THE SAME THING, THE KEYS WILL POINT TO THE SAME OBJECT
 */

@Injectable({
  providedIn: 'root'
})
export class MappingsService extends Array<PedalAction> {
  // pedals: Array<Pedal>;
  ops: Array<SingleOp> = [];
  op_instances: Array<SingleOp> = [];
  availPedals: Array<number>;
  
  // where all of the actual OpPairing, OpChain, OpSequencer objects end up so they are only created once
  index: MappingIndex;

  constructor(
    public pds: PedalsService,
    private seq: SequencerService,
  ) { 
      super();
      this.ops = [];
      this.op_instances = [];
    }

  getMapOptions(p: number): Array<SingleOp> {
    return this.ops;
  }

  // onAddPedal(p: Pedal) {
  //   this.availPedals.push(p.id);
  // }

  // onRemPedal() {
  //   // this.pedals.pop();
  //   this.availPedals.filter((id) => id != this.pedals.length);
  // }

  // register an operation from the Player to the options for mapping
  addOperation(o: PlayerOp) {
    o.id = this.ops.length;
    this.ops.push(o);
  }

  getMap(id: number) {
    return this[id];
  }

  setMap(p: number, m: PedalAction) {
    this[p] = m;
  }
  
  unmap(id: number) {
    console.log(`unmapping pedal ${id}`);
    // let op = this.pairs[id];
    // this.unpairedOps.splice(op.id, 0, op);
    // let m = this.array[id];
    // let u = this.index[m.type].splice(m.i, 1);
    // if (m.type == "sequencer") {
    //   let roul = <OpSequencer> u[0];
    //   delete this[roul.p_select_a];
    //   if (roul.p_select_b) delete this[roul.p_select_b];
    // }
    delete this[id];
  }

  pair(id: number, opName: string) {
    console.log(this.ops);
    let o = this.getOp(opName);
    console.log(o);
    // let thisOp = this.unpairedOps.splice(o, 1);
    this.setMap(id, makePairedOp(id, o));
  }

  chain(id: number, opName: string) {
    let o = this.ops[this.ops.findIndex((op) => op.name == opName)];
    if (this.pedalIsChained(id)) {
      let curr_ops = (<ChainOp> this.getMap(id)).ops;
      this.setMap(id, makeChainOp(curr_ops.concat([o]), id));
    } else if (this.pedalIsPaired(id)) {
      let first_op = (<PairedOp> this.getMap(id)).op;
      this.setMap(id, makeChainOp([first_op].concat([o]), id));
    } else {
      this.setMap(id, makeChainOp([o], id));
    }
  }

  chainArray(id: number, ops: Array<string>) {
    let op_array = ops.map((name) => this.ops[this.ops.findIndex((op) => op.name == name)]);
    if (this.pedalIsChained(id)) { 
      // if pedal already has a chain, add ops to the chain
      let curr_ops = (<ChainOp> this.getMap(id)).ops;
      this.setMap(id, makeChainOp(curr_ops.concat(op_array), id));
    } else if (this.pedalIsPaired(id)) {
      // if pedal is paired, you can turn it into a chain
      let first_op = (<PairedOp> this.getMap(id)).op;
      this.setMap(id, makeChainOp([first_op].concat(op_array), id));
    } else {
      // pedal doesn't have anything mapped, just add a new chain
      this.setMap(id, makeChainOp(op_array, id));
    }
  }

  // makeOpSequencer(conf: number = 0, sel_fwd: number = 1, sel_back?: number, start_ops?: Array<SingleOp | ChainOp>) {
  //   this.setMap("sequencer", conf, makeOpSequencer(conf, sel_fwd, sel_back, start_ops));
  // }

  // will return true if an op is mapped to a pedal in any way
  opIsMapped(opName: string): boolean {
    // let allMaps = this.index["roulette"].concat(this.index["chain"], this.index["pairing"]);
    if (this.filter((m) => m.name.includes(opName)).length > 0) {
      return true;
    } else return false;
  }

  getOp(name: string): SingleOp {
    console.log(name);
    let res = this.ops.filter((op) => op.name == name)[0];
    console.log(res);
    return res;
  }

  pedalIsMapped(id: number) {
    if (this.getMap(id)) return true;
    return false;
  }

  pedalIsChained(id: number) {
    if (this[id].name.startsWith('ch')) { return true; }
    else { return false; }
  }

  pedalInSequencer(id: number) {
    if (this[id].name.startsWith('sequencer')) { return true; }
    else { return false; }
  }

  pedalIsPaired(id: number) {
    return (this.pedalIsMapped(id) && !this.pedalIsChained(id) && !this.pedalInSequencer(id));
  }
}
