/**
 * MAPPINGS: Ways that Pedals can control things in the 
 * Player, namely Operations
 */

import { PlayerState, copyState } from "./state";
import { PlayerOp, SingleOp, OpInstance } from "./playerop";
import { ChainOp } from "./chainop";
import { OpSequencer } from "../provider/sequencer.service";
import { OperationParam } from "../../mixer/model/operation";

/** things that can happen in response to a pedal */
export interface PedalTarget {
  id?: number,
  pedal?: number,
  name: string
  perform: (init: PlayerState, ...args) => Promise<PlayerState>;
}

/**
 * Pedal control modes: different types of triggered behaviors
 *  - `run` = fire the operation every time
 *  - `toggle` = first time: run the operation; 
 *      second time: undo the operation; alternate on/off
 */
export type OpControlMode = 'run' | 'toggle';
export type ParamControlMode = 'inc' | 'dec' | 'rand';

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
  mode?:  OpControlMode,
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
    perform: op["perform"],
  }
}

export interface ParamControl extends PedalTarget {
  op: OpInstance,
  mode: ParamControlMode,
  perform: SingleOp["perform"],
}

// export type PedalOpMapping = Array<PedalAction>;

export type MappingShapes = {
  'pairing': PairedOp,
  'chain': ChainOp,
  'sequencer': OpSequencer,
  'param': ParamControl,
};

export type PedalAction = MappingShapes[keyof MappingShapes];

// export type MappingType = 'pairing' | 'chain' | 'sequencer';