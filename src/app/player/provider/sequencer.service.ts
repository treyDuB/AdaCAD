import { Injectable } from '@angular/core';
import { OpSequencer, PlayerOp, ChainOp, makeOpSequencer, makeChainOp } from '../model/op_mappings';

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

  // get pos() { return this.seq_array.pos; }
  // get ops() { return this.seq_array ? this.seq_array.ops : []; }
  // get current() { return this.seq_array.current; }
  get active() { return (this.readyToWeave ? true : false); }
  get pos() { return this._pos; }

  constructor() {
    super();
    // this.seq_array = new OpSequencer();
  }

  addPedals(fwd_pedal: number, select_pedal_a: number, select_pedal_b?: number) {
    this.mapPedal(fwd_pedal, 'fwd');
    this.mapPedal(select_pedal_a, 'sel-next');
    if (select_pedal_b) {
      this.mapPedal(select_pedal_b, 'sel-back');
    }
  }

  addSingleOp(o: PlayerOp) {
    if (this.active) {
      this.addOp(o);
      // console.log(o);
      // console.log(this.seq);
    } else {
      console.log('no sequencer to add to!');
    }
  }

  addChainOp(o: PlayerOp) { 
    let ch = makeChainOp([o]);
    ch.id = this.chains.length;
    this.chains.push({id: ch.id, pos: this.addOp(ch)});
  }

  addToChain(ch_id: number, o: PlayerOp) {
    let ch = this.ops[this.chains[ch_id].pos] as ChainOp;
    this.ops[this.chains[ch_id].pos] = makeChainOp(ch.ops.concat([o]));
    console.log(this.ops);
  }

  // removeOp() { this.seq_array.removeOp(); }
  // nextOp() { this.seq_array.nextOp(); }
  // prevOp() { this.seq_array.prevOp(); }
}
