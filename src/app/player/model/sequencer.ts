import { PedalEvent, PlayerOp, ChainOp, forward } from "./mappings";
import { PlayerState, copyState } from "./state";

/**
 * Sequencer:
 *  - 1 or 2 pedal "select" pedals ->
 *    multiple operations in a circular queue
 *  - 1 "progress" pedal (forward)
 *  - if select pedal, go to next/previous operation in Sequencer
 */
 export class OpSequencer implements PedalEvent {
  name: string;
  p_select_a: number = -1;
  p_select_b?: number = -1;
  p_prog: number = -1;
  _pos: number = -1;
  ops: Array<PlayerOp | ChainOp> = [];
  selecting: boolean = false;

  /** 
   * @constructor Provide an array of pedals to initialize the 
   * OpSequencer, specifying the select pedal(s) and confirm 
   * pedal. Optionally, provide an array of Ops to load onto the
   * Sequencer.
   */
  constructor(pedals?: Array<number>, ops?: Array<PlayerOp | ChainOp>) {
    this.name = "sequencer";
    if (pedals) {
      this.p_prog = pedals[0];
      this.p_select_a = pedals[1];
      if (pedals.length > 2) {
        this.p_select_b = pedals[2];
      }
    }

    if (ops) {
      this.ops = ops;
    }
  }

  /** @method isMapped whether any pedals are mapped to the sequencer */
  get isMapped() {
    return !(this.p_prog >= 0 && this.p_select_a >= 0 && this.p_select_b >= 0);
  }

  /** @method readyToWeave progress pedal and at least one select pedal mapped */
  get readyToWeave() {
    return (this.p_prog >= 0 && this.p_select_a >= 0);
  }

  get current(): PlayerOp | ChainOp | null {
    if (this._pos == -1) return null;
    return this.ops[this._pos];
  }

  mapPedal(id: number, role: 'fwd' | 'sel-next' | 'sel-back') {
    switch (role) {
      case 'fwd':
        this.p_prog = id;
        break;
      case 'sel-next':
        this.p_select_a = id;
        break;
      case 'sel-back':
        this.p_select_b = id;
    }
  }

  hasPedal(n: number): boolean {
    if (this.p_prog == n || this.p_select_a == n || this.p_select_b == n) return true;
    else return false;
  }

  nextOp() {
    if (this.ops.length > 0) {
      this._pos = (this._pos + 1) % this.ops.length;
      return this.current;
    }
  }

  prevOp() {
    if (this.ops.length > 0) {
      if (this._pos < 0) { this._pos = this.ops.length - 1; }
      else { this._pos = (this._pos - 1) % this.ops.length; }
      return this.current;
    }
  }

  addOp(o: PlayerOp | ChainOp) {
    this.ops.push(o);
    // if (this._pos < 0) this._pos = 0;
    return this.ops.length - 1;
  }

  removeOp() {
    this.ops.pop();
    if (this.ops.length == 0) this._pos = -1;
    if (this._pos == this.ops.length) this._pos--;
  }

  /** Deletes the operation at position x and returns the removed operation. */
  delOpAt(x: number) {
    let rem = this.ops.splice(x, 1);
    if (this.ops.length == 0) this._pos = -1;
    return rem;
  }

  insertOpAt(op: PlayerOp | ChainOp, x: number) {
    let arr;
    if (x > -1 && x < this.ops.length) {
      arr = this.ops.slice(0, x);
    } else { arr = this.ops; }
    arr.push(op);
    arr.concat(this.ops.slice(x));
    this.ops = arr;
  }

  /** Moves the operation at position `a` to position `b` in the sequencer order. */
  moveOpTo(a: number, b: number) {
    if (this.ops[a] && this.ops[b]) {
      let op = this.ops.splice(a, 1)[0];
      this.insertOpAt(op, b);
      if (this._pos == a) { this._pos = b; }
    }
  }

  /** Shifts the operation at position `x` to an adjacent position by swapping places with its neighbor. If `dir = true`, operation swaps with its right neighbor. If `dir = false`, operation swaps with its left neighbor. */
  shiftOp(x: number, dir: boolean) {
    let shift = dir? 1 : -1;
    this.moveOpTo(x, x+shift);
  }

  perform(init: PlayerState, n: number): Promise<PlayerState> {
    console.log('sequencer perform');
    let res = copyState(init);
    if (n == this.p_prog) {
      // console.log("forward in sequencer draft");
      // if prev step was one of the selects, this row gets sent
      res.weaving = true;
      // if (this.ops.length > 0) {
      //   // this.selecting = false; // unset because we've confirmed the selection
      //   return this.current.perform(res);
      // } else {
        return forward.perform(res);
      // }
    } else {
      res.weaving = false;
      if (this.ops.length > 0) {
        if (n == this.p_select_a) {
          this._pos = (this._pos + 1) % this.ops.length;
        } else if (n == this.p_select_b) {
          this._pos = (this._pos - 1) % this.ops.length;
        }
        console.log(this._pos);
        console.log(this.current);
        return this.current.perform(res);
      } else {
        return Promise.resolve(res); // we really can't do anything without any operations on the sequencer
      }
    }
  }
}

export function makeOpSequencer(conf: number = 0, sel_fwd: number = 1, sel_back?: number, start_ops?: Array<PlayerOp | ChainOp>) {
  let pedals = [conf, sel_fwd];
  if (sel_back) pedals.push(sel_back);
  if (start_ops) return new OpSequencer(pedals, start_ops);
  return new OpSequencer(pedals);
}
