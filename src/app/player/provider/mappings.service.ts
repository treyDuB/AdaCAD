import { Injectable } from '@angular/core';
import { Pedal, PedalsService } from './pedals.service';
import { PlayerService } from '../player.service';
import { SingleOpTemplate, OpTemplate as MenuOp, CustomStructOp,
newOpInstance, OpInstance } from '../model/playerop';
import { ChainOp } from '../model/chainop';
import { SequencerService } from './sequencer.service';
import { SimplePairing, makeSimplePairing, MappingShapes, PedalAction } from '../model/maptypes';

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
  op_instances: Array<OpInstance> = [];
  op_chains: Array<ChainOp> = [];
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

  createOpInstance(op: MenuOp): OpInstance
  {
    const newInstance = newOpInstance(<SingleOpTemplate> op)
    this.op_instances.push(newInstance)
    return newInstance;
  }

  getInstanceById(op_id: number) {
    const res = this.op_instances.filter((el) => (el.id == op_id));
    if (res.length == 0) {
      console.log("could not find op instance id ", op_id);
      return <OpInstance> undefined;
    } else {
      return res[0];
    }
  }

  updateInstanceParams(op_id: number, param_id: number, value: number | boolean) {
    const op = this.getInstanceById(op_id);
    op.params[param_id].value = value;
  }

  deleteInstance(op_id: number) {
    let rem = this.getInstanceById(op_id);
    console.log("deleted ", rem);
    this.op_instances = this.op_instances.filter((el) => el.id != op_id);
    return rem;
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
