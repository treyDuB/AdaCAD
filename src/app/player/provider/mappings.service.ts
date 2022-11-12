import { Injectable } from '@angular/core';
import { Pedal, PedalsService } from './pedals.service';
import { PlayerService } from '../player.service';
import { PlayerOp as SingleOp,
  OpChain, OpPairing, OpSequencer,
  makeOpChain, makeOpPairing, makeOpSequencer,
  MappingShapes, MappingType, PedalAction
} from '../model/op_mappings';

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
    'roulette': [],
  }
}

/**
 * @class MappingsService (was PedalConfig class)
 * @desc OLD, UPDATE THIS ---> 
 * Represents a set of two-way bindings between a set of Pedals
 * and a set of (Player)Operations. A pedal can only be bound to one
 * Action (a single Op, a chain of Ops, or to control an OpSequencer)
 * @todo The second restriction may change, it might make sense for pedals to
 * get bound to a sequence of operations.
 */

@Injectable({
  providedIn: 'root'
})
export class MappingsService {
  // pedals: Array<Pedal>;
  ops: Array<SingleOp>;
  availPedals: Array<number>;
  map: PedalOpMap = [];  // pedal ID (number) <-> op (PedalAction)
  
  // where all of the actual OpPairing, OpChain, OpSequencer objects end up so they are only created once
  index: MappingIndex;

constructor(
  public pds: PedalsService,
  // public player: PlayerService
) { 
    this.ops = [];
    this.availPedals = pds.pedals.map((p) => p.id);

    this.map = [];
    this.index = newMapIndex();
  }

  get numMappings() {
    return Object.entries(this.map).length;
  }

  get sequencer(): OpSequencer {
    if (this.index["roulette"].length == 0) return undefined as OpSequencer;
    return this.index["roulette"][0] as OpSequencer;
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
    if (chain) { // chainable?
      o.chain = chain;
    };
  }

  // I don't know if I'm making this too complicated but I don't trust TypeScript/Javascript passing things by reference
  getMap(id: number) {
    let x = this.map[id];
    if (x) {
      return this.index[x.type][x.i];
    } else return undefined;
  }

  setMap(type: MappingType, p: number, m: PedalAction) {
    if (this.getMap[p]) this.unmap(p);
    
    const copyMap = ((src: number, dst: number) => {
      if (this.getMap(dst)) this.unmap(dst);
      this.map[dst] = this.map[src];
    }).bind(this);

    let ind = this.index[type].push(m) - 1;
    this.map[p] = { type: type, i: ind };
    if (type === 'roulette') { // p_conf had been mapped
      let r = m as OpSequencer;

      // set mappings for the other roulette pedals to the same
      copyMap(p, r.p_select_a);
      if (r.p_select_b) copyMap(r.p_select_b);
    }
  }
  
  
  unmap(id: number) {
    console.log(`unmapping pedal ${id}`);
    // let op = this.pairs[id];
    // this.unpairedOps.splice(op.id, 0, op);
    let m = this.map[id];
    let u = this.index[m.type].splice(m.i, 1);
    if (m.type == "roulette") {
      let roul = <OpSequencer> u[0];
      delete this.map[roul.p_select_a];
      if (roul.p_select_b) delete this.map[roul.p_select_b];
    }
    delete this.map[id];
  }

  pair(id: number, opName: string) {
    let o = this.ops[this.ops.findIndex((op) => op.name == opName)];
    // let thisOp = this.unpairedOps.splice(o, 1);
    this.setMap("pairing", id, makeOpPairing(id, o));
  }

  chain(id: number, opName: string) {
    let o = this.ops[this.ops.findIndex((op) => op.name == opName)];
    if (this.pedalIsChained(id)) {
      let curr_ops = (<OpChain> this.getMap(id)).ops;
      this.setMap("chain", id, makeOpChain(curr_ops.concat([o]), id));
    } else if (this.pedalIsPaired(id)) {
      let first_op = (<OpPairing> this.getMap(id)).op;
      this.setMap("chain", id, makeOpChain([first_op].concat([o]), id));
    } else {
      this.setMap("chain", id, makeOpChain([o], id));
    }
  }

  chainArray(id: number, ops: Array<string>) {
    let op_array = ops.map((name) => this.ops[this.ops.findIndex((op) => op.name == name)]);
    if (this.pedalIsChained(id)) { 
      // if pedal already has a chain, add ops to the chain
      let curr_ops = (<OpChain> this.getMap(id)).ops;
      this.setMap("chain", id, makeOpChain(curr_ops.concat(op_array), id));
    } else if (this.pedalIsPaired(id)) {
      // if pedal is paired, you can turn it into a chain
      let first_op = (<OpPairing> this.getMap(id)).op;
      this.setMap("chain", id, makeOpChain([first_op].concat(op_array), id));
    } else {
      // pedal doesn't have anything mapped, just add a new chain
      this.setMap("chain", id, makeOpChain(op_array, id));
    }
  }

  makeOpSequencer(conf: number = 0, sel_fwd: number = 1, sel_back?: number, start_ops?: Array<SingleOp | OpChain>) {
    this.setMap("roulette", conf, makeOpSequencer(conf, sel_fwd, sel_back, start_ops));
  }

  // will return true if an op is mapped to a pedal in any way
  opIsMapped(opName: string): boolean {
    let allMaps = this.index["roulette"].concat(this.index["chain"], this.index["pairing"]);
    if (allMaps.filter((m) => m.name.includes(opName)).length > 0) {
      return true;
    } else return false;
  }

  pedalIsMapped(id: number) {
    if (this.getMap(id)) return true;
    return false;
  }

  pedalIsChained(id: number) {
    if (this.pedalIsMapped(id) && this.map[id].type == 'chain') { return true; }
    else {return false; }
  }

  pedalIsPaired(id: number) {
    return (this.pedalIsMapped(id) && !this.pedalIsChained(id));
  }
}
