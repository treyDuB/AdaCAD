import { Injectable } from '@angular/core';
import { PlayerOp, ChainOp, makeChainOp } from '../model/playerop';
import { OpSequencer, makeOpSequencer } from '../model/sequencer';
import { PlayerService } from '../player.service';
import { PedalsService } from './pedals.service';

/** 
 * each chain op in the sequencer has an ID and 
 * its position in the sequencer 
 */
interface ChainIndex {
  id: number,
  pos: number, // position in ops array
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

  /** Add a single operation to the end of the sequencer. */
  addSingleOp(o: PlayerOp) {
    if (this.active) {
      o.chain_check = -1;
      this.addOp(o);
      /** if this is the first op loaded into the player, run the op so that updates the starting draft */
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
  addChainOp(o: PlayerOp) { 
    let ch = makeChainOp([o]);
    ch.id = this.chains.length;
    this.chains.push({id: ch.id, pos: this.addOp(ch)});
  }

  /** Add a single operation onto an existing chain op in the sequencer. */
  addToChain(ch_id: number, o: PlayerOp) {
    let ch = this.ops[this.chains[ch_id].pos] as ChainOp;
    this.ops[this.chains[ch_id].pos] = makeChainOp(ch.ops.concat([o]));
    console.log(this.ops);
  }

}
