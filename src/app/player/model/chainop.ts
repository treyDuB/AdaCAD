/** CHAIN OPS */

import { Performable, CompoundPerformable, SingleOp, PlayerOpClassifier, defaultPerform, CustomStructOp } from "./playerop";
import { PlayerState, copyState } from "./state";
import { ParamValue } from "../../mixer/model/operation";

/**
 * Op chain:
 * - 1 pedal, multiple operations in a chain (array)
 * - if pedal, perform() each Op in sequence
 * @param ops   array of Op ID numbers to execute in order
 */
export class ChainOp implements CompoundPerformable {
  id?: number;
  classifier: PlayerOpClassifier = 'chain';
  name: string = 'ch';
  params: Array<any> = [];
  u_name?: string;
  dx?: string;
  struct_id?: number;
  chain_check: number = 1;
  custom_check: number = -1;

  ops: Array<SingleOp | CustomStructOp> = [];

  constructor(p?: number) {
    if (p) { this.id = p; }
  }

  static fromSingleOp(o: SingleOp | CustomStructOp, id?: number) {
    let ch = new ChainOp(id);
    ch.addOp(o);
    return ch;
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

  addOp(op: SingleOp | CustomStructOp) {
    this.ops.push(op);
    this.name = this.name.concat("-"+op.name);
  }

  removeOp() {
    return this.ops.pop();
  }

  delOpAt(x: number) {
    return this.ops.splice(x, 1)[0];
  }

  insertOpAt(o: SingleOp, x: number) {
    let arr: Array<any>;
    if (x > -1) {
      if (x == 0) {
        this.ops.unshift(o);
      } else if (x < this.ops.length) {
        arr = this.ops.splice(x);
        console.log(arr);
        this.ops.push(o);
        this.ops = this.ops.concat(arr);
      } else {
        this.ops.push(o);
      }
    }
  }

}

// export function makeBlankChainOp(p?: number): ChainOp {
//   let res: ChainOp = {
//     classifier: 'chain',
//     name: 'ch',
//     ops: [],
//     chain_check: 1,
//     struct_id: -1,
//     perform: (init: PlayerState) => {return Promise.resolve(init);}
//   }

//   if (p) { res.id = p; }
  
//   return res;
// }

// export function makeChainOp(ops: Array<SingleOp>, p?: number): ChainOp {
//   let res = makeBlankChainOp(p);
//   for (let o of ops) {
//     res.name += "-" + o.name;
//   }

//   res.ops = ops;
//   res.perform = (init: PlayerState) => {
//     let newState = copyState(init);
//     newState.pedal = "ch";
//     let res = Promise.resolve(newState);
//     for (let o of ops) {
//       console.log("op in chain ", o);
//       // if (o.classifier == 'seed') {
//       //   let base_op = o.op as Op<Seed, DraftsOptional>;
//       //   d = base_op.perform(getDefaultParams(base_op));
//       // } else if (o.classifier == 'pipe') {
//       //   let base_op = o as Op<Pipe, AllRequired>;
//       //   d = base_op.perform(d, getDefaultParams(base_op));
//       // }
//       res = res.then((state) => o.perform(state)).then((state) => { 
//         state.pedal += "-" + o.name; 
//         console.log(state);
//         return state; });
//       // newState.pedal += "-" + o.name;
//     }
//     return res;
//   }

//   console.log('op chain: ', res);

//   return res;
// }