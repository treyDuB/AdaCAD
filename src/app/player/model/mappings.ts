/**
 * MAPPINGS: More complex ways to combine operations and pedals 
 * in the Draft Player
 */
import { Draft } from "../../core/model/datatypes";
import { wefts } from "../../core/model/drafts";
import { OpInput, TreeOperation as TreeOp, SingleInlet,
  BaseOp as Op, BuildableOperation as GenericOp, 
  Seed, Pipe, AllRequired, DraftsOptional, 
  getDefaultParams, 
  ParamValue
} from "../../mixer/model/operation";
import { PlayerState, initState, copyState } from "./state";

import { OpSequencer, makeOpSequencer } from "./sequencer";
import { cloneDeep } from "lodash";
export * from "./sequencer";

type PlayerOpClassifier = GenericOp["classifier"]["type"] | 'prog' | 'chain';

export interface PlayerOp {
  id?: number,
  classifier: PlayerOpClassifier,
  name: string,
  struct_id?: number,
  dx?: string,
  params?: GenericOp["params"],
  weavingOnly?: boolean,
  chain_check?: number,
  custom_check?: number,
  perform: (init: PlayerState) => Promise<PlayerState>;
  setParams?: (params: Array<ParamValue>) => void;
}
export type SingleOp = PlayerOp;

/**
 * Op chain:
 * - 1 pedal, multiple operations in a chain (array)
 * - if pedal, perform() each Op in sequence
 * @param ops   array of Op ID numbers to execute in order
 */
export interface ChainOp extends PlayerOp {
  ops: Array<SingleOp>;
}

export function getParamVals(params: GenericOp["params"]): Array<ParamValue> {
  if (!params || params.length == 0) {
    return [] as Array<ParamValue>;
  }
  return params.map((el) => el.value);
}

/** @const forward a player-specific function to progress through the draft */
export const forward: PlayerOp = {
  name: 'forward',
  classifier: 'prog',
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
  classifier: 'prog',
  perform: (init: PlayerState) => { 
    let res = copyState(init);
    if (res.weaving) res.numPicks++;
    return Promise.resolve(res);
  }
}

/** @const reverse a player-specific function to progress backwards through the draft */
export const reverse: PlayerOp = {
  name: 'reverse',
  classifier: 'prog',
  perform: (init: PlayerState) => { 
    let res = copyState(init);
    res.row = (init.row+wefts(init.draft.drawdown)-1) % wefts(init.draft.drawdown);
    res.pedal = 'reverse';
    if (res.weaving) res.numPicks++;
    return Promise.resolve(res);
  }
}

export function playerOpFrom(op: GenericOp, params?: Array<ParamValue>) {
  let input_params = params ? params : getDefaultParams(op);

  var p: PlayerOp = { 
    name: op.name,
    classifier: op.classifier.type,
    params: cloneDeep(op.params),
    dx: op.dx,
    perform: refresh.perform,
  }

  if (p.classifier === 'pipe') {
    const pipeOp = op as Op<Pipe, AllRequired>;
    p.perform = function(init: PlayerState) {
      let res = copyState(init);
      res.draft = pipeOp.perform(init.draft, input_params);
      res.row = (init.row) % wefts(res.draft.drawdown);
      res.pedal = p.name;
      return Promise.resolve(res);
    }
  } else if (p.classifier === 'seed') {
    const seedOp = op as Op<Seed, DraftsOptional>;
    p.perform = function(init: PlayerState) {
      let res = copyState(init);
      res.draft = seedOp.perform(input_params);
      res.row = (init.row) % wefts(res.draft.drawdown);
      res.pedal = op.name;
      return Promise.resolve(res);
    }
  }
  
  return p;
}


/** 
 * @type 
 * a TreeOperation is compatible with the player if it takes one or zero draft inputs 
 * and outputs one draft.
 */
type PlayableTreeOp = TreeOp & 
  ( { inlets: [ SingleInlet ] } | 
    { inlets: [] });

/** @function playerOpFromTree (untested) */
function playerOpFromTree(op: PlayableTreeOp) {
  let perform: PlayerOp["perform"];
  let param_input: OpInput = { op_name: op.name, drafts: [], params: getDefaultParams(op), inlet: -1 }
  if (op.inlets.length == 0) {
    perform = function(init: PlayerState) {
      return op.perform([param_input]).then((output) => {
        return { 
          draft: output[0], 
          row: init.row, 
          weaving: init.weaving, 
          pedal: op.name, 
          numPicks: init.numPicks 
        };
      });
    }
  } else {
    perform = function(init: PlayerState) {
      let draft_input: OpInput = { op_name: 'child', drafts: [init.draft], params: [], inlet: 0}
      return op.perform([param_input, draft_input]).then((output) => {
        return { 
          draft: output[0], 
          row: init.row, 
          weaving: init.weaving,
          pedal: op.name,
          numPicks: init.numPicks };
      });
    }
  }

  var p: PlayerOp = { 
    name: op.name,
    classifier: '',
    perform: perform
  }
  return p;
}

/** things that can happen in response to a pedal */
export interface PedalEvent {
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
export interface PairedOp extends PedalEvent {
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

export function makeBlankChainOp(p?: number): ChainOp {
  let res: ChainOp = {
    classifier: 'chain',
    name: 'ch',
    ops: [],
    chain_check: 1,
    struct_id: -1,
    perform: (init: PlayerState) => {return Promise.resolve(init);}
  }
  
  return res;
}

export function makeChainOp(ops: Array<PlayerOp>, p?: number): ChainOp {
  let res = makeBlankChainOp(p);
  for (let o of ops) {
    res.name += "-" + o.name;
  }

  const performChain = (init: PlayerState, ops: Array<PlayerOp>) => {
    let res = Promise.resolve(init);
    for (let o of ops) {
      res = res.then((state) => o.perform(state));
    }
  }

  res.ops = ops;
  res.perform = (init: PlayerState) => {
    let newState = copyState(init);
    newState.pedal = "ch";
    let res = Promise.resolve(newState);
    for (let o of ops) {
      console.log("op in chain ", o);
      // if (o.classifier == 'seed') {
      //   let base_op = o.op as Op<Seed, DraftsOptional>;
      //   d = base_op.perform(getDefaultParams(base_op));
      // } else if (o.classifier == 'pipe') {
      //   let base_op = o as Op<Pipe, AllRequired>;
      //   d = base_op.perform(d, getDefaultParams(base_op));
      // }
      res = res.then((state) => o.perform(state)).then((state) => { 
        state.pedal += "-" + o.name; 
        console.log(state);
        return state; });
      // newState.pedal += "-" + o.name;
    }
    return res;
  }

  console.log('op chain: ', res);

  return res;
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