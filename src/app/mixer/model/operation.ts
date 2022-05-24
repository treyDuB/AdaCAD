/**
 * FILE: operation.ts
 * Moving things from the operation service to a separate file
 * Types, classes, other infrastructural objects
 */

import { toPlainObject } from 'lodash';
import { string } from 'mathjs';
import { Draft } from '../../core/model/draft';

export type ParamValue = number | boolean | string;

export interface GenericParam<Type> {
  name: string,
  dx: string,
  type: 'number' | 'boolean' | 'color' | 'file' | 'string', //number, boolean, color, file, string
  value: Type,
  default?: Type,
  min?: number,
  max?: number
}
 
abstract class RangedParam implements GenericParam<number> {
  name: string;
  dx: string;
  type: 'number' | 'boolean';

  min: number;
  max: number;
  default: number;
  value: number;

  constructor(name: string, value: number, min: number, max: number, dx?: string) {
    this.name = name;
    this.dx = dx ? dx : name;

    this.value = value;
    this.default = value;
    this.min = min;
    this.max = max;
  }
}

export class NumberParam extends RangedParam {
  constructor(name: string, value: number, min: number, max: number, dx?: string) {
    super(name, value, min, max, dx);
    this.type = 'number';
  }
}

export class BooleanParam extends RangedParam {
  constructor(name: string, value: number, dx?: string) {
    super(name, value, 0, 1, dx);
    this.type = 'boolean';
  }
}

export type OpParam = NumberParam | BooleanParam | GenericParam<any>;

export function getParamValues(input: Array<OpParam>): Array<ParamValue> {
  return input.map((param) => param.value);
}

/**
* Helper types to provide extra type-checking for Operation perform() functions
*/

/** @type Union of types that can serve as input to Operation perform() functions. */
export type PerformInput = Array<Draft> | Draft | null;

/** @type Union of types that Operation perform() functions can output. */
export type PerformOutput = Array<Draft> | Draft;

type OpTopologyType = 'pipe' | 'seed' | 'merge' | 'branch' | 'bus';
type OpConstraintType = 'no_drafts' | 'no_params' | 'drafts_opt' | 'params_opt' | 'all_req';
type OpInputConstraint = 'req' | 'opt' | 'none';

interface OpTopologyDef {name: OpTopologyType, input: PerformInput, output: PerformOutput};
export interface Seed extends OpTopologyDef {name: 'seed', input: Draft | null, output: Draft};
export interface Pipe extends OpTopologyDef {name: 'pipe', input: Draft, output: Draft};
export interface Merge extends OpTopologyDef {name: 'merge', input: Array<Draft>, output: Draft};
export interface Branch extends OpTopologyDef {name: 'branch', input: Draft, output: Array<Draft>};
export interface Bus extends OpTopologyDef {name: 'bus', input: Array<Draft>, output: Array<Draft>};

type OpTopology = Seed | Pipe | Merge | Branch | Bus;
type OpTopologyIndex = {
  'seed': Seed,
  'pipe': Pipe,
  'merge': Merge,
  'branch': Branch,
  'bus': Bus,
}

interface InputConstraintDef {name: OpConstraintType, input_drafts: OpInputConstraint, input_params: OpInputConstraint};
export interface NoDrafts extends InputConstraintDef { name: "no_drafts", input_drafts: 'none', input_params: 'req' };
export interface NoParams extends InputConstraintDef { name: "no_params", input_drafts: 'req', input_params: 'none' };
export interface DraftsOptional extends InputConstraintDef { name: "drafts_opt", input_drafts: 'opt', input_params: 'req' };
export interface ParamsOptional extends InputConstraintDef { name: "params_opt", input_drafts: 'req', input_params: 'opt' };
export interface AllRequired extends InputConstraintDef { name: "all_req", input_drafts: 'req', input_params: 'req' };

type OpConstraint = NoDrafts | NoParams | DraftsOptional | ParamsOptional | AllRequired;
type OpConstraintIndex = {
  'no_drafts': NoDrafts,
  'no_params': NoParams,
  'drafts_opt': DraftsOptional,
  'params_opt': ParamsOptional,
  'all_req': AllRequired,
}

/** 
* Generic types for perform() functions, describing options 
* for input draft multiplicity (0, 1, N) and param requirement 
*/
type NoDraftsPerform<Topo extends OpTopology> = {(params: Array<ParamValue>): Topo["output"]};
type NoParamsPerform<Topo extends OpTopology> = {(inputs: Topo["input"]): Topo["output"]};
type ParamsOptionalPerform<Topo extends OpTopology> = {(inputs: Topo["input"], params?: Array<ParamValue>): Topo["output"]}; 
type DraftsOptionalPerform<Topo extends OpTopology> = {(params: Array<ParamValue>, inputs?: Topo["input"]): Topo["output"]};  
type AllRequiredPerform<Topo extends OpTopology> = {(inputs: Topo["input"], params: Array<ParamValue>): Topo["output"]};  

type PerformCallSigs = {
  no_drafts: {
    seed: NoDraftsPerform<Seed>,
    pipe: never,
    merge: never,
    branch: never, 
    bus: never,
  },
  no_params: {
    seed: NoParamsPerform<Seed>,
    pipe: NoParamsPerform<Pipe>,
    merge: NoParamsPerform<Merge>,
    branch: NoParamsPerform<Branch>,
    bus: NoParamsPerform<Bus>
  },
  drafts_opt: {
    seed: DraftsOptionalPerform<Seed>,
    pipe: DraftsOptionalPerform<Pipe>,
    merge: DraftsOptionalPerform<Merge>,
    branch: DraftsOptionalPerform<Branch>,
    bus: DraftsOptionalPerform<Bus>
  },
  params_opt: {
    seed: ParamsOptionalPerform<Seed>,
    pipe: ParamsOptionalPerform<Pipe>,
    merge: ParamsOptionalPerform<Merge>,
    branch: ParamsOptionalPerform<Branch>,
    bus: ParamsOptionalPerform<Bus>
  },
  all_req: { [Topo in keyof OpTopologyIndex]: AllRequiredPerform<OpTopologyIndex[Topo]>; }
  //   seed: AllRequiredPerform<Seed>,
  //   pipe: AllRequiredPerform<Pipe>,
  //   merge: AllRequiredPerform<Merge>,
  //   branch: AllRequiredPerform<Branch>,
  //   bus: AllRequiredPerform<Bus>
  // }
}

export type OperationClassifier<Topo extends OpTopology, Constraint extends OpConstraint> = {
  type: Topo["name"],
  input_drafts: Constraint["input_drafts"],
  input_params: Constraint["input_params"]
}

/** @type User-defined descriptive strings for any Operation. */
type OperationDescriptors = { name: string, displayname: string, dx: string };

/**
* A standard Operation's metadata
* @param name the internal name of this opearation (CHANGING THESE WILL BREAK LEGACY VERSIONS)
* @param displayname the name to show upon this operation
* @param dx the description of this operation
* @param max_inputs the maximum number of inputs (drafts) allowed directly into this operation
* @param params the parameters associated with this operation
* @method perform an OpPerform function
*/
export interface OperationProperties extends OperationDescriptors {
  max_inputs: number,
  default_params?: Array<ParamValue>;
  params: Array<OpParam>,
}

/**
 * @type A function that serves as the perform() method for an Operation. 
 * This generic type requires two type parameters:
 * @param Topo one of the PerformInput types
 * @param Constraint one of the PerformOutput types
 *
 * OpPerform<Topo, Constraint> to give call signature for perform() function 
 * Topo  = Seed | Pipe | Merge | Branch | Bus
 * Constraint = NoDrafts | NoParams | DraftsOptional | ParamsOptional | AllRequired
 */
export type OpPerform<Topo extends OpTopology, Constraint extends OpConstraint> = PerformCallSigs[Constraint["name"]][Topo["name"]];

/** 
 * Operation<Topo, Constraint> = { perform: OpPerform<Topo, Constraint> }
 */
export class Operation<Topo extends OpTopology, Constraint extends OpConstraint> implements OperationProperties {
  name: string;
  displayname: string;
  dx: string;
  params: Array<OpParam>;
  default_params?: Array<ParamValue>;
  max_inputs: number;
  classifier: OperationClassifier<Topo, Constraint>;
  perform: OpPerform<Topo, Constraint>;

  constructor (name: string, displayname: string, dx: string, perform: OpPerform<Topo, Constraint>);
  constructor (name: string, displayname: string, dx: string, params: Array<OpParam>, perform: OpPerform<Topo, Constraint>)
  constructor (name: string, displayname: string, dx: string, performOrParams: OpPerform<Topo, Constraint> | Array<OpParam>, performWithParams?: OpPerform<Topo, Constraint>) {
    this.name = name;
    this.displayname = displayname;
    this.dx = dx;
    if (performWithParams) {
      let params = <Array<OpParam>> performOrParams;
      this.params = params;
      this.default_params = getParamValues(params);
      this.perform = performWithParams;
    } else {
      this.params = [];
      this.perform = <OpPerform<Topo,Constraint>> performOrParams;
    }
  }
}

/**
* @class
* Operation that uses parameters to generate a draft with no inputs, may take an optional input
* @method perform OpPerform function: 
* - PARAMETERS: Array of OpParams
* - INPUT: zero or one Draft
* - OUTPUT: exactly one Draft
*/
export class SeedOperation<Constraint extends OpConstraint = DraftsOptional> extends Operation<Seed, Constraint> {
  max_inputs: Constraint extends NoDrafts ? 0 : 1;
}

/**
* @class
* Operation that takes one input and generates one output draft. 
* May or may not take parameters.
* @method perform OpPerform function: 
* - PARAMETERS: Array of OpParams
* - INPUT: exactly one Draft
* - OUTPUT: exactly one Draft
*/
export class PipeOperation<Constraint extends OpConstraint = AllRequired> extends Operation<Pipe, Constraint> { 
  params: Constraint extends NoParams ? [] : Array<OpParam>;
  max_inputs: 1; 
}

/**
* @class
* Operation that takes many (N) inputs and generates one output draft.
* @method perform OpPerform function: 
* - PARAMETERS: Array of OpParams
* - INPUT: Array of Drafts
* - OUTPUT: exactly one Draft
*/
export class MergeOperation<Constraint extends OpConstraint = AllRequired> extends Operation<Merge, Constraint> {
  params: Constraint extends NoParams ? [] : Array<OpParam>;
}

/**
* @class
* Operation that takes one input and generates many (N) output drafts.
* @method perform OpPerform function: 
* - PARAMETERS: Array of OpParams
* - INPUT: exactly one Draft
* - OUTPUT: Array of Drafts
*/
export class BranchOperation<Constraint extends OpConstraint = AllRequired> extends Operation<Branch, Constraint> {
  params: Constraint extends NoParams ? [] : Array<OpParam>;
  max_inputs: 1;
}

/**
* @class
* Operation that takes many (N) inputs and generates many (M) output drafts.
* Number of inputs does not necessarily match number of outputs (N ?= M).
* @method perform OpPerform function:  
* - PARAMETERS: Array of OpParams
* - INPUT: Array of Drafts
* - OUTPUT: Array of Drafts
*/
export class BusOperation<Constraint extends OpConstraint = AllRequired> extends Operation<Bus, Constraint> {
  params: Constraint extends NoParams ? [] : Array<OpParam>;
}

// does not accept input drafts
export type NoDraftsOp<Topo extends OpTopology> = Operation<Topo, NoDrafts> & { max_inputs: 0 };

// does not accept params
export type NoParamsOp<Topo extends OpTopology> = Operation<Topo, NoParams> & { params: [] };

// can take no params -- has default values
export type ParamsOptionalOp<Topo extends OpTopology> = Operation<Topo, ParamsOptional>;

// can take zero input drafts
export type DraftsOptionalOp<Topo extends OpTopology> = Operation<Topo, DraftsOptional>;

// both inputs and params required
export type AllRequiredOp<Topo extends OpTopology> = Operation<Topo, AllRequired>;

export type TopologyOp = Operation<OpTopology, OpConstraint>;