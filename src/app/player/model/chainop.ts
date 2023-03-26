/** CHAIN OPS */

import { Performable, SingleOp, PlayerOpClassifier } from "./playerop";
import { PlayerState, copyState } from "./state";
import { ParamValue } from "../../mixer/model/operation";

/**
 * Op chain:
 * - 1 pedal, multiple operations in a chain (array)
 * - if pedal, perform() each Op in sequence
 * @param ops   array of Op ID numbers to execute in order
 */
export class ChainOp implements Performable {
  id?: number;
  classifier: PlayerOpClassifier = 'chain';
  name: string = 'ch';
  dx?: string;
  struct_id?: number
  chain_check?: number = 1;

  ops: Array<SingleOp> = [];

  constructor(p?: number) {
    if (p) { this.id = p; }
  }
  
  perform(init: PlayerState) : Promise<PlayerState> {
    let newState = copyState(init);
    newState.pedal = this.name;
    let res = Promise.resolve(newState);
    for (let o of this.ops) {
      res = res.then((state) => o.perform(state));
    }
    return res;
  }

  
}

export function makeBlankChainOp(p?: number): ChainOp {
  let res: ChainOp = {
    classifier: 'chain',
    name: 'ch',
    ops: [],
    chain_check: 1,
    struct_id: -1,
    perform: (init: PlayerState) => {return Promise.resolve(init);}
  }

  if (p) { res.id = p; }
  
  return res;
}

export function makeChainOp(ops: Array<SingleOp>, p?: number): ChainOp {
  let res = makeBlankChainOp(p);
  for (let o of ops) {
    res.name += "-" + o.name;
  }

  res.ops = ops;
  res.perform = (init: PlayerState) => {
    let newState = copyState(init);
    newState.pedal = "ch";
    let res = Promise.resolve(newState);
    for (let o of ops) {
      console.log("op in chain ", o);
      // if (o.classifier == 'seed') {
      //   let base_op = o.op as Op<Seed, DraftsOptional>;
      //   d = base_op.perform(getDefaultParams(base_op));
      // } else if (o.classifier == 'pipe') {
      //   let base_op = o as Op<Pipe, AllRequired>;
      //   d = base_op.perform(d, getDefaultParams(base_op));
      // }
      res = res.then((state) => o.perform(state)).then((state) => { 
        state.pedal += "-" + o.name; 
        console.log(state);
        return state; });
      // newState.pedal += "-" + o.name;
    }
    return res;
  }

  console.log('op chain: ', res);

  return res;
}