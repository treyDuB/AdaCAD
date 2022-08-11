/**
 * FILE: operation.ts
 * Moving things from the operation service to a separate file
 * Types, classes, other infrastructural objects
 */

import { Draft } from '../../core/model/draft';

/**
 * DEFINING TAXONOMY: OPERATION PARAMETERS
 */
export type ParamValue = number | boolean | string;

export interface GenericParam<Type> {
  name: string,
  dx: string,
  type: 'number' | 'boolean' | 'color' | 'file' | 'string',
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
* Types that an Operation's perform() function can handlle as input/output
*/

/** @type Union of types that can serve as input to Operation perform() functions. */
export type PerformInput = Array<Draft> | Draft | null;

/** @type Union of types that Operation perform() functions can output. */
export type PerformOutput = Array<Draft> | Draft;

/**
 * DEFINING TAXONOMY: OPERATION TOPOLOGY
 */
export const TopologyName = {
  pipe: 'pipe', 
  seed: 'seed', 
  merge: 'merge', 
  branch: 'branch', 
  bus: 'bus'
} as const;
export type TopologyName = keyof typeof TopologyName;

interface TopologyDef { type: TopologyName; input: PerformInput; output: PerformOutput; };

/**
* @class
* Operation that uses parameters to generate a draft with no inputs, may take an optional input
* @method perform OpPerform function: 
* - INPUT: zero or one Draft
* - OUTPUT: exactly one Draft
*/
export class Seed implements TopologyDef { type: 'seed'; input: Draft | null; output: Draft; };

/**
* @class
* Operation that takes one input and generates one output draft. 
* May or may not take parameters.
* @method perform OpPerform function: 
* - INPUT: exactly one Draft
* - OUTPUT: exactly one Draft
*/
export class Pipe implements TopologyDef { type: 'pipe'; input: Draft; output: Draft; };

/**
* @class
* Operation that takes many (N) inputs and generates one output draft.
* @method perform OpPerform function: 
* - INPUT: Array of Drafts
* - OUTPUT: exactly one Draft
*/
export class Merge implements TopologyDef { type: 'merge'; input: Array<Draft>; output: Draft; };

/**
* @class
* Operation that takes one input and generates many (N) output drafts.
* @method perform OpPerform function:
* - INPUT: exactly one Draft
* - OUTPUT: Array of Drafts
*/
export class Branch implements TopologyDef { type: 'branch'; input: Draft; output: Array<Draft>; };

/**
* @class
* Operation that takes many (N) inputs and generates many (M) output drafts.
* Number of inputs does not necessarily match number of outputs (N ?= M).
* @method perform OpPerform function:  
* - INPUT: Array of Drafts
* - OUTPUT: Array of Drafts
*/
export class Bus implements TopologyDef { type: 'bus'; input: Array<Draft>; output: Array<Draft>; };

type TopologyIndex = {
  'seed': Seed,
  'pipe': Pipe,
  'merge': Merge,
  'branch': Branch,
  'bus': Bus
}
type OpTopology = TopologyIndex[TopologyName];

export const ConstraintOptions = {
  req: 'req', 
  opt: 'opt', 
  none: 'none'
} as const;
export type ConstraintOptions = keyof typeof ConstraintOptions;

export const ConstraintName = {
  no_drafts: { input_drafts: 'none', input_params: 'req' }, 
  no_params: { input_drafts: 'req', input_params: 'none' }, 
  drafts_opt: { input_drafts: 'opt', input_params: 'req' }, 
  params_opt: { input_drafts: 'req', input_params: 'opt' }, 
  all_req: {input_drafts: 'req', input_params: 'req' },
} as const;
type ConstraintName = keyof typeof ConstraintName;

type ConstraintDefs = {
  [C in keyof typeof ConstraintName]: {
    constraint: C;
    input_drafts: typeof ConstraintName[C]["input_drafts"];
    input_params: typeof ConstraintName[C]["input_params"];
  }
}

export type NoDrafts = ConstraintDefs["no_drafts"];
export type NoParams = ConstraintDefs["no_params"];
export type DraftsOptional = ConstraintDefs["drafts_opt"];
export type ParamsOptional = ConstraintDefs["params_opt"];
export type AllRequired = ConstraintDefs["all_req"];

type ConstraintIndex = {
  'no_drafts': NoDrafts, // does not accept input drafts
  'no_params': NoParams, // does not accept params
  'drafts_opt': DraftsOptional, // can take no params -- has default values
  'params_opt': ParamsOptional, // can take zero input drafts
  'all_req': AllRequired, // both inputs and params required
}
type OpConstraint = ConstraintIndex[ConstraintName]; 

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
  no_drafts: { [Topo in keyof TopologyIndex]: NoDraftsPerform<TopologyIndex[Topo]>; },
  no_params: { [Topo in keyof TopologyIndex]: NoParamsPerform<TopologyIndex[Topo]>; },
  drafts_opt: { [Topo in keyof TopologyIndex]: DraftsOptionalPerform<TopologyIndex[Topo]>; },
  params_opt: { [Topo in keyof TopologyIndex]: ParamsOptionalPerform<TopologyIndex[Topo]>; },
  all_req: { [Topo in keyof TopologyIndex]: AllRequiredPerform<TopologyIndex[Topo]>; }
}

interface OpClassifier<Topo extends OpTopology, Constraint extends OpConstraint> {
  type: Topo["type"] | '';
  input_drafts: Constraint["input_drafts"] | '';
  input_params: Constraint["input_params"] | '';
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
export type OpPerform<Topo extends OpTopology, Constraint extends OpConstraint> = PerformCallSigs[Constraint["constraint"]][Topo["type"]];

export class BaseOp<Topo extends OpTopology, Constraint extends OpConstraint> implements OperationProperties {
  name: string;
  displayname: string;
  dx: string;
  params: Array<OpParam>;
  default_params?: Array<ParamValue>;
  max_inputs: number;
  classifier: OpClassifier<Topo, Constraint>;
  perform: OpPerform<Topo, Constraint>;

  constructor (...args: OpConstructorArgs<Topo, Constraint>);
  constructor (name: string, displayname: string, dx: string, perform: OpPerform<Topo, Constraint>);
  constructor (name: string, displayname: string, dx: string, params: Array<OpParam>, perform: OpPerform<Topo, Constraint>);
  constructor (name: string, displayname: string, dx: string, performOrParams: OpPerform<Topo, Constraint> | Array<OpParam>, performWithParams?: OpPerform<Topo, Constraint>) {
    this.name = name;
    this.displayname = displayname;
    this.dx = dx;
    this.classifier = { type: '', input_drafts: '', input_params: '' };
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

  constrain(c: ConstraintName): void {
    if (c == 'no_drafts') { this.max_inputs = 0; }
    this.classifier.input_drafts = ConstraintName[c]["input_drafts"]; 
    this.classifier.input_params = ConstraintName[c]["input_params"];
  }

  type(t: TopologyName): BaseOp<Topo, Constraint> {
    this.classifier.type = t;
    return this;
  }
}

type ConstructorArgsIndex = {
  [C in keyof ConstraintIndex]: C extends "no_params" ? {
    [T in keyof TopologyIndex]: [
      name: string, displayname: string, dx: string, 
      perform: OpPerform<TopologyIndex[T], ConstraintIndex[C]>
    ]
  } : {
    [T in keyof TopologyIndex]: [
      name: string, displayname: string, dx: string, 
      params: OpParam[], perform: OpPerform<TopologyIndex[T], ConstraintIndex[C]>
    ]
  }
}
type OpConstructorArgs<Topo extends OpTopology, Constraint extends OpConstraint> = 
ConstructorArgsIndex[Constraint["constraint"]][Topo["type"]];

// use factory design pattern to apply classifiers to BaseOp?? Is this too convoluted
// https://refactoring.guru/design-patterns/abstract-factory/typescript
class AbstractOpFactory<T extends OpTopology> {
  NoDrafts(...args: OpConstructorArgs<T, NoDrafts>): BaseOp<T, NoDrafts> {
    let op = new BaseOp<T, NoDrafts>(...args);
    op.constrain("no_drafts");
    return op;
  }
  NoParams(...args: OpConstructorArgs<T, NoParams>): BaseOp<T, NoParams> {
    let op = new BaseOp<T, NoParams>(...args);
    op.constrain("no_params");
    return op;
  }
  DraftsOptional(...args: OpConstructorArgs<T, DraftsOptional>): BaseOp<T, DraftsOptional> {
    let op = new BaseOp<T, DraftsOptional>(...args);
    op.constrain("drafts_opt");
    return op;
  }
  ParamsOptional(...args: OpConstructorArgs<T, ParamsOptional>): BaseOp<T, ParamsOptional> {
    let op = new BaseOp<T, ParamsOptional>(...args);
    op.constrain("params_opt");
    return op;
  }
  AllRequired(...args: OpConstructorArgs<T, AllRequired>): BaseOp<T, AllRequired> {
    let op = new BaseOp<T, AllRequired>(...args);
    op.constrain("all_req");
    return op;
  }
}

// combine with mix-ins design pattern (link: TypeScript docs website)
function makeTopoFactory<T extends OpTopology>(topo: TopologyName) {
  return class TopologyFactory extends AbstractOpFactory<T> {
    static base = new AbstractOpFactory<T>();
    static NoDrafts(...args: OpConstructorArgs<T, NoDrafts>) {
      return this.base.NoDrafts(...args).type(topo);
    }
    static NoParams(...args: OpConstructorArgs<T, NoParams>) {
      return this.base.NoParams(...args).type(topo);
    }
    static DraftsOptional(...args: OpConstructorArgs<T, DraftsOptional>) {
      return this.base.DraftsOptional(...args).type(topo);
    }
    static ParamsOptional(...args: OpConstructorArgs<T, ParamsOptional>) {
      return this.base.ParamsOptional(...args).type(topo);
    }
    static AllRequired(...args: OpConstructorArgs<T, AllRequired>) {
      return this.base.AllRequired(...args).type(topo);
    }
  }
}

export const SeedOperation = makeTopoFactory<Seed>("seed");
export const PipeOperation = makeTopoFactory<Pipe>("pipe");
export const MergeOperation = makeTopoFactory<Merge>("merge");
export const BranchOperation = makeTopoFactory<Branch>("merge");
export const BusOperation = makeTopoFactory<Bus>("bus");

type TopologyOpIndex = {
  [T in keyof TopologyIndex]: {
    [C in keyof ConstraintIndex]: BaseOp<TopologyIndex[T], ConstraintIndex[C]>;
  }
}

export type TopologyOperation = TopologyOpIndex[TopologyName][ConstraintName];