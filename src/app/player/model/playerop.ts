/**
 * PLAYER OPS: The Draft Player's version of AdaCAD operations.
 */

import utilInstance from "../../core/model/util";
import { Draft } from "../../core/model/datatypes";
import { wefts } from "../../core/model/drafts";
import { OpInput, TreeOperation as TreeOp, SingleInlet,
  BaseOp as Op, BuildableOperation as GenericOp, 
  Seed, Pipe, AllRequired, DraftsOptional, 
  getDefaultParams, ParamValue,
  Params, NumParam, OperationParam, Operation
} from "../../mixer/model/operation";
import { ChainOp } from "./chainop";
import { PlayerState, initState, copyState } from "./state";

import { cloneDeep } from "lodash";

export type PlayerOpClassifier = GenericOp["classifier"]["type"] | 'prog' | 'chain' | 'struct';

/** `Performable` means anything that runs a `perform` function to generate a Draft. */
export interface Performable { 
  perform: (init: PlayerState, ...args) => Promise<PlayerState>; 
}

export const defaultPerform = (init: PlayerState) => { 
  let res = copyState(init);
  return Promise.resolve(res);
}

/** A Performable whose effect is determined by the combination of other perform functions. */
export interface CompoundPerformable extends Performable {
  ops: Array<Performable>;
  addOp: (o: PlayerOp) => any;
  removeOp: () => any;
  delOpAt: (x: number) => any;
  insertOpAt: (o: PlayerOp, x: number) => any;
}

export interface PlayerOpProperties {
  id: number,
  classifier?: PlayerOpClassifier,
  name: string,
  struct_id?: number,
  dx?: string,
  params?: Array<OperationParam>,
  weavingOnly?: boolean,
  chain_check?: number,
  custom_check?: number,
}


/** Mixer-like parameterized operations. Each operation's base can be loaded into multiple instances with unique parameters. */
export interface SingleOpBase extends Performable, PlayerOpProperties {
  id: number,
  classifier: PlayerOpClassifier,
  name: string,
  dx?: string,
  params: Array<OperationParam>,
}

/** A single instance of an operation and its parameters. */
export interface SingleOpInstance extends Performable, PlayerOpProperties {
  id: number,
  name: string,
  base?: SingleOpBase,
  params: Array<OperationParam>,
  perform: SingleOpBase["perform"],
}

export type SingleOp = SingleOpInstance;

export function newOpInstance(base: SingleOpBase): SingleOpInstance {
  const inst = {
    id: utilInstance.generateId(8),
    name: base.name,
    op: base, 
    params: cloneDeep(base.params),
    perform: (init: PlayerState) => { 
      console.log(inst.params);
      return inst.op.perform(init, getParamVals(inst.params)); 
    }
  };
  return inst;
}

export interface CustomStructOp extends Performable, PlayerOpProperties {
  id: number,
  classifier: 'struct',
  name: string,
  struct_id: number,
  custom_check: number,
}

export type PlayerOp = (SingleOpBase | SingleOp | ChainOp | CustomStructOp); // | PlayerOpProperties;

export function getParamVals(params: GenericOp["params"]): Array<ParamValue> {
  if (!params || params.length == 0) {
    return [] as Array<ParamValue>;
  }
  return params.map((el) => el.value);
}

/** @const forward a player-specific function to progress through the draft */
export const forward: SingleOpBase = {
  id: -1,
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
export const refresh: SingleOpBase = {
  id: -1,
  name: 'refresh',
  classifier: 'prog',
  params: [],
  perform: defaultPerform,
}

/** @const reverse a player-specific function to progress backwards through the draft */
export const reverse: SingleOpBase = {
  id: -1,
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
  var p: SingleOpBase = {
    id: -1, 
    name: op.name,
    classifier: op.classifier.type,
    params: player_params,
    dx: op.dx,
    perform: defaultPerform,
  }

  if (p.classifier === 'pipe') {
    const pipeOp = op as Op<Pipe, AllRequired>;
    p.perform = function(init: PlayerState, params?: Array<ParamValue>) {
      let input_params = params ? params : getParamVals(op.params);
      let res = copyState(init);
      res.draft = pipeOp.perform(init.draft, input_params);
      res.row = (init.row) % wefts(res.draft.drawdown);
      res.pedal = op.name;
      return Promise.resolve(res);
    }
  } else if (p.classifier === 'seed') {
    const seedOp = op as Op<Seed, DraftsOptional>;
    p.perform = function(init: PlayerState, params?: Array<ParamValue>) {
      let input_params = params ? params : getParamVals(op.params);
      let res = copyState(init);
      res.draft = seedOp.perform(input_params);
      res.row = (init.row) % wefts(res.draft.drawdown);
      res.pedal = op.name;
      return Promise.resolve(res);
    }
  }
  
  return p;
}

