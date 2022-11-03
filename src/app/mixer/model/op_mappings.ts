/**
 * More complex ways to combine operations and pedals 
 * in the Draft Player
 */
import { Draft, getDefaultParams } from "../../core/model/datatypes";
import { BaseOp as Op, Pipe, AllRequired } from "../../core/model/datatypes";
import { PlayerOp, PlayerState } from "../provider/draftplayer.service";

interface PedalEvent {
  pedal: number,
  name: string
  perform: (init: PlayerState) => Promise<PlayerState>;
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
  op:     PlayerOp,
}

export function makeOpPairing(p: number, op: PlayerOp): OpPairing {
  return {
    pedal: p,
    name: op.name,
    op: op,
    perform: op.perform
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
  ops:    Array<PlayerOp>,
}

export function makeOpChain(ops: Array<PlayerOp>, p?: number): OpChain {
  let res: OpChain;
  if (p) {
    res.pedal = p;
  } else { res.pedal = -1; }
  res.name = "ch";
  for (let o of ops) {
    res.name += "-" + o.name;
  }

  res.ops = ops;
  res.perform = (init: PlayerState) => {
    let d: Draft;
    for (let o of ops) {
      let base_op = o.op as Op<Pipe, AllRequired>;
      d = base_op.perform(d, getDefaultParams(base_op));
    }

    return Promise.resolve({draft: d, row: init.row, numPicks: init.numPicks});
  }

  return res;
}

/**
 * Roulette:
 *  - 1 or 2 pedal select pedals ->
 *    multiple operations in a circular queue
 *  - 1 "confirm" pedal (forward)
 *  - if pedal, go to next operation in Roulette
 */
export interface OpRoulette extends PedalEvent {
  pedals:   Array<number>,
  p_select: Array<number>,
  p_conf:   number,
  pos:      number,
  ops:      Array<PlayerOp | OpChain>,
}

export type PedalAction = OpPairing | OpChain | OpRoulette;

export type PedalOpMapping = Array<PedalAction> & {
  [key: number]: PedalAction,
}