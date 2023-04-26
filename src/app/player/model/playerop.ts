/**
 * PLAYER OPS: The Draft Player's version of AdaCAD operations.
 */

import utilInstance from "../../core/model/util";
import { Draft } from "../../core/model/datatypes";
import { wefts } from "../../core/model/drafts";
import { 
  BaseOp as Op, BuildableOperation as GenericOp, 
  Seed, Pipe, AllRequired, DraftsOptional, 
  ParamValue, NumParam, OperationParam
} from "../../mixer/model/operation";
import { PlayerState, initState, copyState } from "./state";

import { cloneDeep } from "lodash";

/** classifies operations in the player */
export type PlayerOpClassifier = GenericOp["classifier"]["type"] | 'prog' | 'chain' | 'struct';

/** the thing that calls an operation's perform */
type PerformTrigger = 'pedal' | 'seq' | 'none';

/** 
 * `Performable` means anything that runs a `perform` function to generate a Draft. 
 * @method `perform` The function that generates a Draft
 */
export interface Performable { 
  /** Function that takes an initla PlayerState and returns a resulting PlayerState */
  perform: (init: PlayerState, ...args) => Promise<PlayerState>; 
}

/** The "do nothing" perform */
export const defaultPerform = (init: PlayerState) => { 
  let res = copyState(init);
  return Promise.resolve(res);
}

/** 
 * A Performable whose effect is determined by the combination of other perform functions. 
 * @property {Array<Performable>} `ops` An array of Performables to execute in order.
 * @method `addOp` Add a Performable to the end of the array
 * @method `removeOp` Remove a Performable from the end of the array
 * @method `delOpAt`
 * @method `insertOpAt`
 */
export interface CompoundPerformable extends Performable {
  /** An array of Performables to execute in order. */
  ops: Array<Performable>;
  /** Add a Performable to the end of the `ops` array */
  addOp: (o: Performable) => any;
  /** Remove a Performable from the end of the `ops` array */
  removeOp: () => any;
  /** Delete the Performable at position `x` */
  delOpAt: (x: number) => any;
  /** 
   * Insert a Performable at position `x` 
   * @param o The Performable
   * @param x Position/index
   */
  insertOpAt: (o: Performable, x: number) => any;
}

/** 
 * Mixer-like parameterized operations. Each operation's base 
 * can be loaded into multiple instances with unique 
 * parameter values. 
 */
export interface SingleOpTemplate extends Performable {
  id: number,
  classifier: PlayerOpClassifier,
  name: string,
  dx?: string,
  params: Array<OperationParam>,
}

/**
 * An operation created from a Draft loaded from the Mixer
 */
export interface CustomStructOp extends Performable {
  id: number,
  classifier: 'struct',
  name: string,
  gen_name?: string, /** automatically generated draft name */
  params: Array<OperationParam>,
  struct_id: number,
  custom_check: number,
}

/** 
 * OpTemplates are the base versions of any operations that 
 * are mapped in the Draft Player (added to sequencer or 
 * paired with pedals) 
 */
export type OpTemplate = SingleOpTemplate | CustomStructOp & { trigger: never };

/**
 * OpInstances are copies of an OpTemplate that keep an 
 * independent set of parameter values, and call the 
 * template's perform function using these values.
 */
export interface BaseOpInstance extends Performable {
  /** A generated unique ID number */
  id: number,
  /** Name of the operation (matches template) */
  name: string,
  /** See {@link PlayerOpClassifier} */
  classifier: OpTemplate['classifier'],
  /** What calls the operation's `perform` method. */
  trigger?: PerformTrigger,
  /** Template for this instance */
  template?: Performable,
  /** Parameters of this oepration  */
  params: Array<OperationParam>,
}

/** An instance of a single operation and its parameters. */
export interface SingleOpInstance extends BaseOpInstance {
  id: number,
  name: string,
  template: SingleOpTemplate,
  perform: SingleOpTemplate["perform"],
}

/** An instance of a custom structure operation */
export interface StructOpInstance extends BaseOpInstance {
  id: number,
  classifier: 'struct',
  template: CustomStructOp,
  perform: CustomStructOp["perform"],
}

/** union of op instance types */
export type OpInstance = SingleOpInstance | StructOpInstance | BaseOpInstance;

/**
 * Helper function to generate an instance of an OpTemplate
 * @param {OpTemplate} base 
 * @returns instance of the OpTemplate
 */
export function newOpInstance(base: OpTemplate): OpInstance {
  const inst = {
    id: utilInstance.generateId(8),
    name: base.name,
    classifier: base.classifier,
    template: base, 
    params: cloneDeep(base.params),
    perform: (init: PlayerState) => { 
      // console.log(inst.params);
      return inst.template.perform(init, getParamVals(inst.params)); 
    }
  };
  return inst;
}

/** @function getParamVals Helper function to turn an array of OperationParams into an array of their values */
export function getParamVals(params: Array<OperationParam>): Array<ParamValue> {
  if (!params || params.length == 0) {
    return [] as Array<ParamValue>;
  }
  return params.map((el) => el.value);
}

/** A player-specific function to progress through the draft */
export const forward: SingleOpTemplate = {
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

/** A player-specific function to progress through the draft (re-sends the row to give more time) */
export const refresh: SingleOpTemplate = {
  id: -1,
  name: 'refresh',
  classifier: 'prog',
  params: [],
  perform: defaultPerform,
}

/** A player-specific function to progress backwards through the draft */
export const reverse: SingleOpTemplate = {
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

/** Player-specific operations representing progress within a Draft. */
export type ProgressOp = OpTemplate | OpInstance & { name: 'forward' | 'refresh' | 'reverse' };

/** Function that converts a general AdaCAD operation to a Player operation. */
export function playerOpFrom(op: GenericOp, params?: Array<ParamValue>) {
  let player_params = cloneDeep(op.params);
  if (params) {
    player_params.forEach((el, i) => {
      el.value = params[i];
    });
  }
  var p: SingleOpTemplate = {
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

