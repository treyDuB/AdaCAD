import { Injectable } from '@angular/core';
import { OpSequencer, SingleOp, ChainOp, makeOpSequencer, makeChainOp } from '../model/player_ops';

@Injectable({
  providedIn: 'root'
})
export class SequencerService {
  seq: OpSequencer;
  selecting: boolean = false;
  chains: Array<ChainOp> = [];

  get pos() { return this.seq.pos; }
  get ops() { return this.seq ? this.seq.ops : []; }
  get current() { return this.seq.current; }
  get active() { return (this.seq ? true : false); }

  constructor() { 
  }

  start(fwd_pedal: number, select_pedal_a: number, select_pedal_b?: number) {
    if (select_pedal_b) {
      this.seq = makeOpSequencer(fwd_pedal, select_pedal_a, select_pedal_b);
    } else { this.seq = makeOpSequencer(fwd_pedal, select_pedal_a); }
  }

  addSingleOp(o: SingleOp) {
    if (this.active) {
      this.seq.addOp(o);
      console.log(o);
      console.log(this.seq);
    } else {
      console.log('no sequencer to add to!');
    }
  }

  addChainOp(o: SingleOp) { 
    let ch = makeChainOp([o]);
    ch.id = this.chains.length;
    this.chains.push(<ChainOp> this.seq.addOp(ch));
  }

  addToChain(ch_id: number, o: SingleOp) {
    let ch = this.chains[ch_id];
    this.chains[ch_id] = makeChainOp(ch.ops.concat([o]));
  }

  removeOp() { this.seq.removeOp(); }
  nextOp() { this.seq.nextOp(); }
  prevOp() { this.seq.prevOp(); }
}
