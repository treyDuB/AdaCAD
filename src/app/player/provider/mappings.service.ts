import { Injectable } from '@angular/core';
import { Pedal, PedalsService } from './pedals.service';
import { PlayerService } from '../player.service';
import { SingleOp, SingleOpBase, PlayerOp, CustomStructOp,
newOpInstance } from '../model/playerop';
import { ChainOp } from '../model/chainop';
import { SequencerService } from './sequencer.service';
import { MenuOp, SimplePairing, makeSimplePairing, MappingShapes, PedalAction } from '../model/mapping';

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
  ops: Array<MenuOp> = [];
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

  // getMapOptions(p: number): Array<MenuOp> {
  //   return this.ops;
  // }

  // onAddPedal(p: Pedal) {
  //   this.availPedals.push(p.id);
  // }

  // onRemPedal() {
  //   // this.pedals.pop();
  //   this.availPedals.filter((id) => id != this.pedals.length);
  // }

  // register an operation from the Player to the options for mapping
  addMenuOperation(o: MenuOp) {
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
    delete this[id];
  }

  pair(id: number, opName: string) {
    console.log(this.ops);
    let o = this.createOpInstance(this.getOp(opName));
    console.log(o);
    // let thisOp = this.unpairedOps.splice(o, 1);
    this.setMap(id, makeSimplePairing(id, o));
  }

  chain(id: number, opName: string) {
    let o = this.createOpInstance(this.getOp(opName));
    if (this.pedalIsChained(id)) {
      (<ChainOp> this.getMap(id)).addOp(o);
    } else if (this.pedalIsPaired(id)) {
      const ch = ChainOp.fromSingleOp((<SimplePairing> this.getMap(id)).op);
      ch.addOp(o);
      this.setMap(id, ch);
    } else {
      this.setMap(id, ChainOp.fromSingleOp(o));
    }
  }

  // chainArray(id: number, ops: Array<string>) {
  //   let op_array = ops.map((name) => this.ops[this.ops.findIndex((op) => op.name == name)]);
  //   if (this.pedalIsChained(id)) { 
  //     // if pedal already has a chain, add ops to the chain
  //     let curr_ops = (<ChainOp> this.getMap(id)).ops;
  //     this.setMap(id, makeChainOp(curr_ops.concat(op_array), id));
  //   } else if (this.pedalIsPaired(id)) {
  //     // if pedal is paired, you can turn it into a chain
  //     let first_op = (<SimplePairing> this.getMap(id)).op;
  //     this.setMap(id, makeChainOp([first_op].concat(op_array), id));
  //   } else {
  //     // pedal doesn't have anything mapped, just add a new chain
  //     this.setMap(id, makeChainOp(op_array, id));
  //   }
  // }

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

  getOp(name: string): MenuOp {
    // console.log(name);
    let res = this.ops.filter((op) => op.name == name)[0];
    console.log(res);
    return res;
  }

  createOpInstance(op: MenuOp): SingleOp | CustomStructOp
  // createOpInstance(name: string): SingleOp | CustomStructOp 
  // createOpInstance(opOrName: MenuOp | string) 
  {
    console.log(op);
    if (op.struct_id > 0) {
      return <CustomStructOp> op;
    } else {
      const newInstance = newOpInstance(<SingleOpBase> op)
      this.op_instances.push(newInstance)
      return newInstance;
    }
  }

  getInstanceById(op_id: number) {
    const res = this.op_instances.filter((el) => (el.id == op_id));
    if (res.length == 0) {
      console.log("could not find op instance id ", op_id);
      return <SingleOp> undefined;
    } else {
      return res[0];
    }
  }

  updateInstanceParams(op_id: number, param_id: number, value: number | boolean) {
    const op = this.getInstanceById(op_id);
    op.params[param_id].value = value;
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
