import { PlayerState, copyState } from "./state";
import { PlayerOp, ChainOp } from "./playerop";
import { OpSequencer } from "./sequencer";

/** things that can happen in response to a pedal */
export interface PedalTarget {
  id?: number,
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
export interface PairedOp extends PedalTarget {
  pedal:  number,
  op:     PlayerOp,
}

// this ...args thing is such a hack
export function makePairedOp(p: number, op: PlayerOp): PairedOp {
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

export type PedalOpMapping = Array<PedalAction>;// & {
//   [id: number]: PedalAction
// }

export type MappingShapes = {
  'pairing': PairedOp,
  'chain': ChainOp,
  'sequencer': OpSequencer
};

export type PedalAction = MappingShapes[keyof MappingShapes];

export type MappingType = 'pairing' | 'chain' | 'sequencer';