import { Injectable } from '@angular/core';
import { 
  Performable, CompoundPerformable,
  SingleOp, forward, CustomStructOp
} from '../model/playerop';
import { ChainOp } from '../model/chainop';
import { PlayerState, copyState } from '../model/state';
// import { PlayerService } from '../player.service';
import { PedalsService } from './pedals.service';
import { min } from 'lodash';
import { MappingsService } from './mappings.service';
import { MenuOp } from '../model/mapping';

/** 
 * each chain op in the sequencer has an ID and 
 * its position in the sequencer 
 */
interface ChainIndex {
  id: number,
  pos: number, // position in ops array
}

export type SequencerOp = ChainOp | SingleOp | CustomStructOp;


/**
 * Sequencer:
 *  - 1 or 2 pedal "select" pedals ->
 *    multiple operations in a circular queue
 *  - 1 "progress" pedal (forward)
 *  - if select pedal, go to next/previous operation in Sequencer
 */
 export class OpSequencer implements CompoundPerformable {
  name: string;
  p_select_a: number = -1;
  p_select_b?: number = -1;
  p_prog: number = -1;
  _pos: number = -1;
  ops: Array<SequencerOp> = [];
  selecting: boolean = false;

  /** 
   * @constructor Provide an array of pedals to initialize the 
   * OpSequencer, specifying the select pedal(s) and confirm 
   * pedal. Optionally, provide an array of Ops to load onto the
   * Sequencer.
   */
  constructor(pedals?: Array<number>, ops?: Array<SequencerOp>) {
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
    return !(this.p_prog >= 0 && this.p_select_a >= 0 && (<number> this.p_select_b) >= 0);
  }

  /** @method readyToWeave progress pedal and at least one select pedal mapped */
  get readyToWeave() {
    return (this.p_prog >= 0 && this.p_select_a >= 0);
  }

  get current(): Performable | null {
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

  perform(init: PlayerState, n: number): Promise<PlayerState> {
    // console.log('sequencer perform');
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
        // console.log(this._pos);
        // console.log(this.current);
        return (<Performable> this.current).perform(res);
      } else {
        return Promise.resolve(res); // we really can't do anything without any operations on the sequencer
      }
    }
  }

  addOp(o: SequencerOp) {
    this.ops.push(o);
    // if (this._pos < 0) this._pos = 0;
    console.log(o);
    return this.ops.length - 1;
  }

  removeOp() {
    this.ops.pop();
    if (this.ops.length == 0) this._pos = -1;
    if (this._pos == this.ops.length) this._pos--;
  }

  /** Deletes the operation at position x and returns the removed operation. */
  delOpAt(x: number) {
    let rem = this.ops.splice(x, 1)[0];
    if (this.ops.length == 0) this._pos = -1;
    if (this._pos >= x) { this._pos--; }
    return rem;
  }

  insertOpAt(op: SequencerOp, x: number) {
    let arr: Array<any>;
    if (x > -1) {
      if (x == 0) {
        this.ops.unshift(op);
      } else if (x < this.ops.length) {
        arr = this.ops.splice(x);
        console.log(arr);
        this.ops.push(op);
        this.ops = this.ops.concat(arr);
      } else {
        this.ops.push(op);
      }
    }

    if (this._pos >= x) { this._pos++; }
  }
}

export function makeOpSequencer(conf: number = 0, sel_fwd: number = 1, sel_back?: number, start_ops?: Array<SequencerOp>) {
  let pedals = [conf, sel_fwd];
  if (sel_back) pedals.push(sel_back);
  if (start_ops) return new OpSequencer(pedals, start_ops);
  return new OpSequencer(pedals);
}

/** 
 * I separated the sequencer into a generic object class
 * AND an Angular service that extends the class. Hopefully
 * that isn't clunky, but it does let me separate methods
 * that are useful to call in the HTML, from the methods
 * that are less often called in HTML
 */
@Injectable({
  providedIn: 'root'
})
export class SequencerService extends OpSequencer {
  // seq_array: OpSequencer;
  selecting: boolean = false;
  chains: Array<ChainIndex> = []; // a number pointing to index in sequencer ops

  get active() { return (this.readyToWeave ? true : false); }
  get pos() { return this._pos; }

  constructor(
    public pedals: PedalsService,
    public map: MappingsService
  ) {
    super();
  }

  mapPedals(fwd_pedal: number, select_pedal_a: number, select_pedal_b?: number) {
    this.mapPedal(fwd_pedal, 'fwd');
    this.mapPedal(select_pedal_a, 'sel-next');
    if (select_pedal_b) {
      this.mapPedal(select_pedal_b, 'sel-back');
    }
  }

  nextOp() {
    if (this.ops.length > 0) {
      this._pos = (this._pos + 1) % this.ops.length;
      console.log(this.current);
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

  /** Moves the operation at position `a` to position `b` in the sequencer order. */
  moveOpTo(a: number, b: number) {
    if (this.ops[a] && this.ops[b] && a != b) {
      if (a > b) {
        this.insertOpAt(this.ops[a], b);
        this.delOpAt(a+1);
      } else {
        this.insertOpAt(this.ops[a], b+1);
        this.delOpAt(a);
      }
      if (this._pos == a) { this._pos = b; }
      if (this._pos == b) { this._pos++; }
    }
  }

  /** Shifts the operation at position `x` to an adjacent position by swapping places with its neighbor. If `dir = true`, operation swaps with its right neighbor. If `dir = false`, operation swaps with its left neighbor. */
  shiftOp(x: number, dir: boolean) {
    console.log("moving op");
    let shift = dir? 1 : -1;
    this.moveOpTo(x, x+shift);
  }

  /** Add a single operation to the end of the sequencer. */
  addSingleOp(o: SequencerOp) {
    if (this.active) {
      console.log(o);
      // this.map.getMap(0);
      // this.map.createOpInstance(o);
      // console.log(opInstance);
      // o.chain_check = -1;
      this.addOp(o);
      /** if this is the first op l
       * 3oaded into the player, run the op so that updates the starting draft */
      // if (this.ops.length == 1) {
      //   this.pedals.emit('pedal-step', this.p_select_a);
      // }
      // console.log(o);
      // console.log(this.seq);
    } else {
      console.log('no sequencer to add to!');
    }
  }

  /** Add a new chain operation to the sequencer. */
  addChainOp(o: SingleOp) { 
    let ch = ChainOp.fromSingleOp(o);
    ch.id = this.chains.length;
    this.chains.push({id: ch.id, pos: this.addOp(ch)});
  }

  /** Add a single operation onto an existing chain op in the sequencer. */
  addToChain(ch_id: number, o: SingleOp) {
    const ch = this.ops[this.chains[ch_id].pos] as ChainOp;
    ch.addOp(o);
    console.log(this.ops);
  }

}
