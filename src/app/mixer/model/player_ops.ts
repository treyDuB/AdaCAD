/**
 * More complex ways to combine operations and pedals 
 * in the Draft Player
 */
import { Draft, DraftsOptional, getDefaultParams } from "../../core/model/datatypes";
import { wefts } from "../../core/model/drafts";
import { BaseOp as Op, BuildableOperation as GenericOp, 
  Seed, Pipe, AllRequired } from "../../core/model/datatypes";
import { PlayerState, initState, copyState } from "./player";

export interface SingleOp {
  id?: number,
  name: string,
  dx?: string,
  op?: GenericOp,
  weavingOnly?: boolean,
  chain?: boolean,
  perform: (init: PlayerState) => Promise<PlayerState>;
}
export type PlayerOp = SingleOp;

/** @const forward a player-specific function to progress through the draft */
export const forward: PlayerOp = {
  name: 'forward',
  perform: (init: PlayerState) => { 
    let res = copyState(init);
    res.row = (init.row+1) % wefts(init.draft.drawdown);
    res.pedal = 'forward';
    if (res.weaving) res.numPicks++;
    return Promise.resolve(res); 
  }
}

/** @const refresh a player-specific function to progress through the draft (re-sends the row to give more time) */
export const refresh: PlayerOp = {
  name: 'refresh',
  perform: (init: PlayerState) => { 
    let res = copyState(init);
    if (res.weaving) res.numPicks++;
    return Promise.resolve(res);
  }
}

/** @const reverse a player-specific function to progress backwards through the draft */
export const reverse: PlayerOp = {
  name: 'reverse',
  perform: (init: PlayerState) => { 
    let res = copyState(init);
    res.row = (init.row+wefts(init.draft.drawdown)-1) % wefts(init.draft.drawdown);
    res.pedal = 'reverse';
    if (res.weaving) res.numPicks++;
    return Promise.resolve(res);
  }
}

export function playerOpFrom(op: GenericOp) {
  // use "rotate" op as an example
  let perform;
  if (op.classifier.type === 'pipe') {
    const pipeOp = op as Op<Pipe, AllRequired>;
    perform = function(init: PlayerState) {
      let res = copyState(init);
      res.draft = pipeOp.perform(init.draft, getDefaultParams(pipeOp));
      res.row = (init.row) % wefts(res.draft.drawdown);
      res.pedal = op.name;
      return Promise.resolve(res);
    }
  } else if (op.classifier.type === 'seed') {
    const seedOp = op as Op<Seed, DraftsOptional>;
    perform = function(init: PlayerState) {
      let res = copyState(init);
      res.draft = seedOp.perform(getDefaultParams(seedOp));
      res.row = (init.row) % wefts(res.draft.drawdown);
      res.pedal = op.name;
      return Promise.resolve(res);
    }
  }
  
  var p: PlayerOp = { 
    name: op.name,
    op: op,
    perform: perform
  }
  return p;
}

/** things that can happen in response to a pedal */
interface PedalEvent {
  pedal?: number,
  name: string
  perform: (init: PlayerState, ...args) => Promise<PlayerState>;
}

/** 
 * Basic combination: 
 *  - 1 pedal, 1 operation
 *  - if pedal, then operation perform() 
 * @param pedal ID number of pedal
 * @param op    ID number of Operation (assigned in Draft Player service)
 */
export interface OpPairing extends PedalEvent {
  pedal:  number,
  op:     SingleOp,
}

// this ...args thing is such a hack
export function makeOpPairing(p: number, op: SingleOp): OpPairing {
  let jankPerform = (init: PlayerState, ...args) => {
    return op.perform(init);
  }
  return {
    pedal: p,
    name: op.name,
    op: op,
    perform: jankPerform
  }
}

/**
 * Op chain:
 * - 1 pedal, multiple operations in a chain (array)
 * - if pedal, perform() each Op in sequence
 * @param pedal ID number of pedals
 * @param ops   array of Op ID numbers to execute in order
 */
export interface OpChain extends PedalEvent{
  pedal:  number,
  ops:    Array<SingleOp>,
}

export function makeOpChain(ops: Array<SingleOp>, p?: number): OpChain {
  let res: OpChain = {
    pedal: -1,
    name: "",
    ops: [],
    perform: (init: PlayerState, ...args) => {return Promise.resolve(init);}
  };
  if (p) {
    res.pedal = p;
  } else { res.pedal = -1; }
  res.name = "ch";
  for (let o of ops) {
    res.name += "-" + o.name;
  }

  res.ops = ops;
  res.perform = (init: PlayerState, ...args) => {
    let newState = copyState(init);
    newState.pedal = "ch";
    let d: Draft = init.draft;
    for (let o of ops) {
      if (o.op.classifier.type == 'seed') {
        let base_op = o.op as Op<Seed, DraftsOptional>;
        d = base_op.perform(getDefaultParams(base_op));
      } else if (o.op.classifier.type == 'pipe') {
        let base_op = o.op as Op<Pipe, AllRequired>;
        d = base_op.perform(d, getDefaultParams(base_op));
      }
      newState.pedal += "-" + o.name;
    }

    newState.draft = d;

    return Promise.resolve(newState);
  }

  console.log('op chain: ', res);

  return res;
}

/**
 * Sequencer:
 *  - 1 or 2 pedal "select" pedals ->
 *    multiple operations in a circular queue
 *  - 1 "confirm" pedal (forward)
 *  - if pedal, go to next operation in Sequencer
 */
export class OpSequencer implements PedalEvent {
  name: string;
  p_select_a: number;
  p_select_b?: number;
  p_conf: number;
  pos: number = -1;
  ops: Array<SingleOp | OpChain> = [];
  selecting: boolean = false;

  /** 
   * @constructor Provide an array of pedals to initialize the 
   * OpSequencer, specifying the select pedal(s) and confirm 
   * pedal. Optionally, provide an array of Ops to load onto the
   * Sequencer.
   */
  constructor(pedals: Array<number>, ops?: Array<SingleOp | OpChain>) {
    this.name = "sequencer";
    this.p_conf = pedals[0];
    this.p_select_a = pedals[1];
    if (pedals.length > 2) {
      this.p_select_b = pedals[2];
    }

    if (ops) {
      this.ops = ops;
      this.pos = 0;
    }
  }

  get current(): SingleOp | OpChain {
    return this.ops[this.pos];
  }

  hasPedal(n: number): boolean {
    if (this.p_conf == n || this.p_select_a == n || this.p_select_b == n) return true;
    else return false;
  }

  addOp(o: SingleOp | OpChain) {
    this.ops.push(o);
    if (this.pos < 0) this.pos = 0;
  }

  delOp(x: number) {
    this.ops.splice(x, 1);
    if (this.ops.length == 0) this.pos = -1;
  }

  perform(init: PlayerState, n: number): Promise<PlayerState> {
    let res = copyState(init);
    if (n == this.p_conf) {
      // if prev step was one of the selects, this row gets sent
      res.weaving = true;
      if (this.selecting) {
        this.selecting = false; // unset because we've confirmed the selection
        return this.current.perform(res);
      } else {
        return forward.perform(res);
      }
    } else {
      res.weaving = false;
      this.selecting = true;
      if (this.ops.length > 0) {
        if (n == this.p_select_a) {
          this.pos = (this.pos + 1) % this.ops.length;
        } else if (n == this.p_select_b) {
          this.pos = (this.pos - 1) % this.ops.length;
        }
        return this.current.perform(res);
      } else {
        return Promise.resolve(res); // we really can't do anything without any operations on the sequencer
      }
    }
  }
}

export function makeOpSequencer(conf: number = 0, sel_fwd: number = 1, sel_back?: number, start_ops?: Array<SingleOp | OpChain>) {
  let pedals = [conf, sel_fwd];
  if (sel_back) pedals.push(sel_back);
  if (start_ops) return new OpSequencer(pedals, start_ops);
  return new OpSequencer(pedals);
}

export type PedalAction = OpPairing | OpChain | OpSequencer;

export type PedalOpMapping = Array<PedalAction> & {
  [key: number]: PedalAction,
}