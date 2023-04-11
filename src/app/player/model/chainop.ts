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
