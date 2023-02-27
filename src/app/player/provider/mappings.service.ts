import { Injectable } from '@angular/core';
import { Pedal, PedalsService } from './pedals.service';
import { PlayerService } from '../player.service';
import { PlayerOp as SingleOp, PedalOpMapping,
  ChainOp, PairedOp, OpSequencer,
  makeChainOp, makePairedOp, makeOpSequencer,
  MappingShapes, MappingType, PedalAction
} from '../model/op_mappings';
import { SequencerService } from './sequencer.service';

type PedalOpMap = {
  [key: number]: { type: MappingType, i: number }
}

type MappingIndex = {
  [m in keyof MappingShapes]: Array<PedalAction>;//Array<MappingShapes[m]>;
}

function newMapIndex(): MappingIndex {
  return {
    'pairing': [],
    'chain': [],
    'sequencer': [],
  }
}

/**
 * @class MappingsService (was PedalConfig class)
 * @desc A collection of key: value entries where keys (numbers)
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
  availPedals: Array<number>;
  // array: PedalOpMap = [];  // pedal ID (number) <-> op (PedalAction)
  
  // where all of the actual OpPairing, OpChain, OpSequencer objects end up so they are only created once
  index: MappingIndex;

  constructor(
  public pds: PedalsService,
  private seq: SequencerService,
) { 
    super();
    this.ops = [];
    // this.availPedals = pds.pedals.array((p) => p.id);

    // this.array = [];
    // this.index = newMapIndex();
  }

  get sequencer(): OpSequencer {
    let seq = this.filter((m) => m.name == "sequencer") as Array<OpSequencer>;
    if (seq.length > 0) return seq[0];
    else return undefined as OpSequencer;
  }

  getMapOptions(p: number): Array<SingleOp> {
    let res;
    // if (this.pedalIsPaired(p)) {
    //   console.log("filtering");
    //   console.log(this.getMap(p));
    //   res = this.ops.filter(op => {
    //   op.name != (this.getMap(p) as SingleOp).name;
    // });
    // } else { 
      res = this.ops; 
    // }
    // console.log(res);
    return res;
  }

  // onAddPedal(p: Pedal) {
  //   this.availPedals.push(p.id);
  // }

  // onRemPedal() {
  //   // this.pedals.pop();
  //   this.availPedals.filter((id) => id != this.pedals.length);
  // }

  // register an operation from the Player to the options for mapping
  addOperation(o: SingleOp, chain?: boolean) {
    o.id = this.ops.length;
    this.ops.push(o);
  }

  // I don't know if I'm making this too complicated but I don't trust TypeScript/Javascript passing things by reference
  getMap(id: number) {
    return this[id];
    // let x = this.array[id];
    // if (x) {
    //   return this.index[x.type][x.i];
    // } else return undefined;
  }

  setMap(p: number, m: PedalAction) {
    this[p] = m;
    // if (this.getMap[p]) this.unmap(p);
    
    // const copyMap = ((src: number, dst: number) => {
    //   if (this.getMap(dst)) this.unmap(dst);
    //   this.array[dst] = this.array[src];
    // }).bind(this);

    // let ind = this.index[type].push(m) - 1;
    // this.array[p] = { type: type, i: ind };
    // if (type === 'sequencer') { // p_conf had been mapped
    //   let r = m as OpSequencer;

    //   // set mappings for the other roulette pedals to the same
    //   copyMap(p, r.p_select_a);
    //   if (r.p_select_b) copyMap(r.p_select_b);
    // }
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
    else {return false; }
  }

  pedalInSequencer(id: number) {
    if (this[id].name.startsWith('sequencer')) { return true; }
    else { return false; }
  }

  pedalIsPaired(id: number) {
    return (this.pedalIsMapped(id) && !this.pedalIsChained(id) && !this.pedalInSequencer(id));
  }
}
