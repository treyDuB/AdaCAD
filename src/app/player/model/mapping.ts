/**
 * MAPPINGS: Ways that Pedals can control things in the 
 * Player, namely Operations
 */

import { PlayerState } from "./state";
import { PlayerOp, SingleOpBase, SingleOp, CustomStructOp } from "./playerop";
import { ChainOp } from "./chainop";
import { OpSequencer } from "../provider/sequencer.service";
import { OperationParam } from "../../mixer/model/operation";

/** things that can happen in response to a pedal */
export interface PedalTarget {
  id?: number,
  pedal: number, 
  name: string, // name of the operation that matches icon name
  perform: (init: PlayerState, ...args) => Promise<PlayerState>;
}

/**
 * Pedal control modes: different types of triggered behaviors
 *  - `run` = fire the operation every time
 *  - `toggle` = first time: run the operation; 
 *      second time: undo the operation; alternate on/off
 *  - `redo` = undo the operation, then run it again (for operations that are randomized, or may accumulate resizing the draft, etc.)
 */
export type OpControlMode = 'run' | 'toggle' | 'redo';
export type ParamControlMode = 'inc' | 'dec' | 'rand';

/** operations that will show up as menu options for mapping */
export type MenuOp = SingleOpBase | CustomStructOp;
export type PairableOp = SingleOp | CustomStructOp;

/** 
 * Basic combination: 
 *  - 1 pedal, 1 operation
 *  - if pedal, then operation perform() 
 * @param pedal ID number of pedal
 * @param op    ID number of Operation (assigned in Draft Player service)
 */
export interface SimplePairing extends PedalTarget {
  pedal:  number,
  name:   string, // name of the operation that matches icon name
  op:     PairableOp,
  mode?:  OpControlMode,
}

export interface ChainPairing extends PedalTarget {
  pedal:  number,
  ch:     ChainOp
}

export function makeSimplePairing(p: number, op: SingleOp | CustomStructOp): SimplePairing {
  return {
    pedal: p,
    name: op.name,
    op: op,
    perform: op["perform"],
  }
}

export function makeChainPairing(p: number, ch: ChainOp): ChainPairing {
  return {
    pedal: p,
    name: ch.name,
    ch: ch,
    perform: ch["perform"],
  }
}

export interface ParamControl extends PedalTarget {
  op: SingleOp,
  mode: ParamControlMode,
  perform: SingleOp["perform"],
}

// export type PedalOpMapping = Array<PedalAction>;

export type MappingShapes = {
  'pairing': SimplePairing,
  'chain': ChainOp,
  'sequencer': OpSequencer,
  'param': ParamControl,
};

export type PedalAction = MappingShapes[keyof MappingShapes];

// export type MappingType = 'pairing' | 'chain' | 'sequencer';