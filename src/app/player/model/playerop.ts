/**
 * PLAYER OPS: The Draft Player's version of AdaCAD operations.
 */

import { Draft } from "../../core/model/datatypes";
import { wefts } from "../../core/model/drafts";
import { OpInput, TreeOperation as TreeOp, SingleInlet,
  BaseOp as Op, BuildableOperation as GenericOp, 
  Seed, Pipe, AllRequired, DraftsOptional, 
  getDefaultParams, ParamValue,
  Params, NumParam, OperationParam, Operation
} from "../../mixer/model/operation";
import { PlayerState, initState, copyState } from "./state";

import { cloneDeep } from "lodash";

export type PlayerOpClassifier = GenericOp["classifier"]["type"] | 'prog' | 'chain';

/** `Performable` means anything that runs a function to generate a Draft. */
export interface Performable { 
  perform: (init: PlayerState, ...args) => Promise<PlayerState>; 
}

export interface CompoundPerformable extends Performable {
  ops: Array<Performable>;
}

export interface SingleOp extends Performable {
  classifier: PlayerOpClassifier,
  name: string,
  dx?: string,
  params?: Array<OperationParam>,
}

export interface OpInstance {
  op: SingleOp,
  params: Array<OperationParam>,
  perform: SingleOp["perform"],
}

export function newOpInstance(base: SingleOp) {
  const inst = { 
    op: base, 
    params: cloneDeep(base.params),
    perform: (init: PlayerState) => { return base.perform(init, this.params); }
  }
}

export interface PlayerOp extends SingleOp {
  id?: number,
  classifier: PlayerOpClassifier,
  name: string,
  struct_id?: number,
  dx?: string,
  params?: GenericOp["params"],
  weavingOnly?: boolean,
  chain_check?: number,
  custom_check?: number,
  setParams?: (params: Array<ParamValue>) => void;
}

// export type SingleOp = PlayerOp;

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
  params: <Array<NumParam>> [{
    name: 'step size',
    dx: 'the number of rows to move forward',
    type: 'number',
    min: 1,
    max: 100,
    value: 1,
  }],
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
  params: [],
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
  params: <Array<NumParam>> [{
    name: 'step size',
    dx: 'the number of rows to move backward',
    type: 'number',
    min: 1,
    max: 100,
    value: 1,
  }],
  perform: (init: PlayerState) => { 
    let res = copyState(init);
    res.row = (init.row+wefts(init.draft.drawdown)-1) % wefts(init.draft.drawdown);
    res.pedal = 'reverse';
    if (res.weaving) res.numPicks++;
    return Promise.resolve(res);
  }
}

export function playerOpFrom(op: GenericOp, params?: Array<ParamValue>) {
  let player_params = cloneDeep(op.params);
  if (params) {
    player_params.forEach((el, i) => {
      el.value = params[i];
    });
  }
  var p: PlayerOp = { 
    name: op.name,
    classifier: op.classifier.type,
    params: player_params,
    dx: op.dx,
    perform: refresh.perform,
  }

  if (p.classifier === 'pipe') {
    const pipeOp = op as Op<Pipe, AllRequired>;
    p.perform = function(init: PlayerState, params?: Array<ParamValue>) {
      let input_params = params ? params : getParamVals(p.params);
      let res = copyState(init);
      res.draft = pipeOp.perform(init.draft, input_params);
      res.row = (init.row) % wefts(res.draft.drawdown);
      res.pedal = p.name;
      return Promise.resolve(res);
    }
  } else if (p.classifier === 'seed') {
    const seedOp = op as Op<Seed, DraftsOptional>;
    p.perform = function(init: PlayerState, params?: Array<ParamValue>) {
      let input_params = params ? params : getParamVals(p.params);
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
