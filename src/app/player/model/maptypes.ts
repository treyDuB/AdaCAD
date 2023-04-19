/**
 * MAPPINGS: Ways that Pedals can control things in the 
 * Player, namely Operations
 */ 

import { PlayerState } from "./state";
import { OpTemplate, OpInstance, CustomStructOp, ProgressOp, refresh, newOpInstance } from "./playerop";
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
// export type MenuOp = SingleOpTemplate | CustomStructOp;
// export type PairableOp = OpInstance | CustomStructOp;

/** 
 * Basic combination: 
 *  - 1 pedal, 1 operation
 *  - if pedal, then operation perform() 
 * @param pedal ID number of pedal
 * @param op    ID number of Operation (assigned in Draft Player service)
 */
export interface SimplePairing extends PedalTarget {
  pedal:  number,
  // name:   string, // name of the operation that matches icon name
  op:     OpInstance,
  mode?:  OpControlMode,
}

export interface ChainPairing extends PedalTarget {
  pedal:  number,
  ch:     ChainOp
}

export interface SequencerProg extends PedalTarget {
  pedal: number,
  role: 'prog',
  op: ProgressOp
}

export interface SequencerSelect extends PedalTarget {
  pedal: number,
  role: 'sel',
  dir: boolean
}

function nullMapping(p: number): SimplePairing {
  return {
    pedal: p,
    name: 'null',
    op: newOpInstance(refresh),
    perform: refresh["perform"]
  }

}

export type SequencerMapping = SequencerProg | SequencerSelect;

export function makeSimplePairing(p: number, op: OpInstance): SimplePairing {
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

export type SeqMapOptions = {
  role: 'sel' | 'prog',
  op_name?: string,
  op?: OpInstance,
  dir?: boolean,
  seq?: number | OpSequencer
}

export function mapToSequencer(p: number, opts: SeqMapOptions): SequencerMapping {
  let m: SequencerMapping;
  if (opts.role === 'sel') {
    m = <SequencerSelect>{ pedal: p, role: opts.role };
    m.name = (opts.dir) ? 'next' : 'previous';
    m.dir = <boolean> opts.dir;
    m.perform = (<OpSequencer> opts.seq)["perform"];
  } else {
    m = <SequencerProg>{ pedal: p, role: opts.role };
    let op = <OpInstance> opts.op;
    m.name = op.name;
    m.perform = op["perform"];
  }
  return m;
}

export interface ParamControl extends PedalTarget {
  op: OpInstance,
  mode: ParamControlMode,
  perform: OpInstance["perform"],
}

// export type PedalOpMapping = Array<PedalAction>;

export type MappingShapes = {
  'pairing': SimplePairing | ChainPairing,
  'sequencer': SequencerMapping,
  'param': ParamControl,
};

export function makeMapping(p: number, targ: any, type: keyof MappingShapes): PedalAction {
  switch (type) {
    case 'pairing':
      return makeSimplePairing(p, <OpInstance> targ) as SimplePairing;
    case 'sequencer':
      return mapToSequencer(p, <SeqMapOptions> targ) as SequencerMapping;
    case 'param':
      return nullMapping(p);
  }
}

export type PedalAction = MappingShapes[keyof MappingShapes];
