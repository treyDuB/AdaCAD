import { Draft } from "../../../core/model/datatypes";
import { ParamValue, OperationParam as OpParam, getParamValues } from "./params";
import { OperationInlet as OpInlet, InletDrafts } from "./inlets";

/**
* At its heart, an Operation is a very fancy function that outputs a Draft or several Drafts.
* The function itself is perform(), and the Operation can take inputs in the form of 
* Drafts (inlets) or Parameters (params).
*/

/** 
* Types that an Operation's perform() function can handlle as input/output
*/

/** @type Union of types that can serve as input to Operation perform() functions. */
export type PerformDraftInput = InletDrafts | Array<Draft> | Draft | null;

type MultiDraftInput = InletDrafts | Array<Draft>;

/** @type Union of types that Operation perform() functions can output. */
export type PerformOutput = Array<Draft> | Draft;

/**
 * OPERATION TOPOLOGY
 * Topology refers to the shape of the Operation in terms of its
 * number of input and output Drafts. Classifies Operations.
 */

export const TopologyName = {
  pipe: 'pipe', 
  seed: 'seed', 
  merge: 'merge', 
  branch: 'branch', 
  bus: 'bus'
} as const;
export type TopologyName = keyof typeof TopologyName;

interface TopologyDef { type: TopologyName; input: PerformDraftInput; output: PerformOutput; };

/**
* @class
* Operation that can generate a draft with no inputs, may take an optional input
* @method perform OpPerform function: 
* - INPUT: zero or one Draft
* - OUTPUT: exactly one Draft
*/
export class Seed implements TopologyDef { type: 'seed'; input: Draft | null; output: Draft; };

/**
* @class
* Operation that takes one input and generates one output draft. 
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
export class Merge implements TopologyDef { type: 'merge'; input: InletDrafts | Array<Draft>; output: Draft; };

/**
* @class
* Operation that takes one input and generates many (N) output drafts.
* @method perform OpPerform function:
* - INPUT: exactly one Draft
* - OUTPUT: Array of Drafts
*/
export class Branch implements TopologyDef { type: 'branch'; input: Draft; output: Array<Draft>; };

/**
* CURRENTLY UNUSED
* @class
* Operation that takes many (N) inputs and generates many (M) output drafts.
* Number of inputs does not necessarily match number of outputs (N ?= M).
* @method perform OpPerform function:  
* - INPUT: Array of Drafts
* - OUTPUT: Array of Drafts
*/
export class Bus implements TopologyDef { type: 'bus'; input: Array<Draft> | InletDrafts; output: Array<Draft>; };

type TopologyIndex = {
  'seed': Seed,
  'pipe': Pipe,
  'merge': Merge,
  'branch': Branch,
  'bus': Bus
}
type OpTopology = TopologyIndex[TopologyName];

/**
 * OPERATION CONSTRAINT
 * A Constraint on an Operation classifies it based on its
 * input requirements (both Drafts and Params).
 */

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

/**
 * @interface OpClassifier
 * Key-value pairs for an Operation's Topology and Constraint.
 */
interface OpClassifier<Topo extends OpTopology, Constraint extends OpConstraint> {
  type: Topo["type"] | '';
  input_drafts: Constraint["input_drafts"] | '';
  input_params: Constraint["input_params"] | '';
}

/** @type User-defined descriptive strings for any Operation. */
type OperationDescriptors = { name: string, displayname: string, dx: string };

/**
* A standard Operation's metadata -- i.e. everything not the perform() function
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
// type PerformArgs<T extends OpTopology, C extends OpConstraint> = Parameters<OpPerform<T, C>>;

/** TODO doublecheck inlets have been added correctly (fields for input drafts) */
export class BaseOp<Topo extends OpTopology, Constraint extends OpConstraint> implements OperationProperties {
  name: string;
  old_names: Array<string>;
  displayname: string;
  dx: string;
  params: Array<OpParam>;
  inlets: Array<OpInlet>;
  default_params?: Array<ParamValue>;
  max_inputs: number;
  classifier: OpClassifier<Topo, Constraint>;
  perform: OpPerform<Topo, Constraint>;

  /** @constructor create an Operation using an object literal (keys and values) */
  constructor (args: OpConstructorArgs<Topo, Constraint>);
  /** @constructor create an Operation using direct arguments in the constructor (values only) */
  constructor (...args: OpConstructorArray<Topo, Constraint>);
  constructor (name: string, displayname: string, dx: string, perform: OpPerform<Topo, Constraint>);
  constructor (name: string, displayname: string, dx: string, params: Array<OpParam>, perform: OpPerform<Topo, Constraint>);
  constructor (nameOrArgs: any, displayname?: string, dx?: string, performOrParams?: OpPerform<Topo, Constraint> | Array<OpParam>, performWithParams?: OpPerform<Topo, Constraint>) {
    // console.log((nameOrArgs.name != undefined));
    this.classifier = { type: '', input_drafts: '', input_params: '' };
    if (nameOrArgs.name) {
      let args = nameOrArgs;
      this.name = args.name;
      this.displayname = args.displayname;
      this.dx = args.dx;
      this.perform = args.perform;
      if (args.params) this.params = args.params;
      else this.params = [];
      if (args.inlets) this.inlets = args.inlets;
      else this.inlets = [];
    } else {
      this.name = nameOrArgs;
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

  constrain(c: ConstraintName): void {
    if (c == 'no_drafts') { this.max_inputs = 0; this.inlets = []; }
    this.classifier.input_drafts = ConstraintName[c]["input_drafts"]; 
    this.classifier.input_params = ConstraintName[c]["input_params"];
  }

  type(t: TopologyName): BaseOp<Topo, Constraint> {
    this.classifier.type = t;
    return this;
  }
}

type ConstructorArgKeysIndex = {
  [C in keyof ConstraintIndex]: C extends "no_params" ? {
    [T in keyof TopologyIndex]: {
      name: string, displayname: string, dx: string, old_names: string[],
      inlets: OpInlet[], perform: OpPerform<TopologyIndex[T], ConstraintIndex[C]>
    }
  } : C extends "no_drafts" ? {
    [T in keyof TopologyIndex]: {
      name: string, displayname: string, dx: string, old_names: string[],
      params: OpParam[], perform: OpPerform<TopologyIndex[T], ConstraintIndex[C]>
    }
  } : {
    [T in keyof TopologyIndex]: {
      name: string, displayname: string, dx: string, old_names: string[],
      params: OpParam[], inlets: OpInlet[],
      perform: OpPerform<TopologyIndex[T], ConstraintIndex[C]>
    }
  }
}

type ConstructorArrayIndex = {
  [C in keyof ConstraintIndex]: C extends "no_params" ? {
    [T in keyof TopologyIndex]: [
      name: string, displayname: string, dx: string, old_names: string[],
      inlets: OpInlet[], perform: OpPerform<TopologyIndex[T], ConstraintIndex[C]>
    ]
  } : C extends "no_drafts" ? {
    [T in keyof TopologyIndex]: [
      name: string, displayname: string, dx: string, old_names: string[],
      params: OpParam[], perform: OpPerform<TopologyIndex[T], ConstraintIndex[C]>
    ]
  } : {
    [T in keyof TopologyIndex]: [
      name: string, displayname: string, dx: string, old_names: string[],
      params: OpParam[], inlets: OpInlet[],
      perform: OpPerform<TopologyIndex[T], ConstraintIndex[C]>
    ]
  }
}

type OpConstructorArgKeys<Topo extends OpTopology, Constraint extends OpConstraint> = 
ConstructorArgKeysIndex[Constraint["constraint"]][Topo["type"]];

type OpConstructorArray<Topo extends OpTopology, Constraint extends OpConstraint> = 
ConstructorArrayIndex[Constraint["constraint"]][Topo["type"]];

type OpConstructorArgs<Topo extends OpTopology, Constraint extends OpConstraint> = 
OpConstructorArgKeys<Topo, Constraint> | OpConstructorArray<Topo, Constraint>;

// use factory design pattern to apply classifiers to BaseOp?? Is this too convoluted
// https://refactoring.guru/design-patterns/abstract-factory/typescript
class AbstractOpFactory<T extends OpTopology> {
  NoDrafts(args: OpConstructorArgKeys<T, NoDrafts>): BaseOp<T, NoDrafts>;
  NoDrafts(...args: OpConstructorArray<T, NoDrafts>): BaseOp<T, NoDrafts>;
  NoDrafts(...args: any) {
    let op = new BaseOp<T, NoDrafts>(...args);
    op.constrain("no_drafts");
    return op;
  }

  NoParams(args: OpConstructorArgKeys<T, NoParams>): BaseOp<T, NoParams>;
  NoParams(...args: OpConstructorArray<T, NoParams>): BaseOp<T, NoParams>;
  NoParams(...args: any) {
    let op = new BaseOp<T, NoParams>(...args);
    op.constrain("no_params");
    return op;
  }

  DraftsOptional(args: OpConstructorArgKeys<T, DraftsOptional>): BaseOp<T, DraftsOptional>;
  DraftsOptional(...args: OpConstructorArray<T, DraftsOptional>): BaseOp<T, DraftsOptional>;
  DraftsOptional(...args: any) {
    let op = new BaseOp<T, DraftsOptional>(...args);
    op.constrain("drafts_opt");
    return op;
  }

  ParamsOptional(args: OpConstructorArgKeys<T, ParamsOptional>): BaseOp<T, ParamsOptional>;
  ParamsOptional(...args: OpConstructorArray<T, ParamsOptional>): BaseOp<T, ParamsOptional>;
  ParamsOptional(...args: any) {
    let op = new BaseOp<T, ParamsOptional>(...args);
    op.constrain("params_opt");
    return op;
  }

  AllRequired(args: OpConstructorArgKeys<T, AllRequired>): BaseOp<T, AllRequired>;
  AllRequired(...args: OpConstructorArray<T, AllRequired>): BaseOp<T, AllRequired>;
  AllRequired(...args: any) {
    let op = new BaseOp<T, AllRequired>(...args);
    op.constrain("all_req");
    return op;
  }
}

// combine with mix-ins design pattern (link: TypeScript docs website)
function makeTopoFactory<T extends OpTopology>(topo: TopologyName) {
  return class TopologyFactory extends AbstractOpFactory<T> {
    static base = new AbstractOpFactory<T>();
    
    static NoDrafts(args: OpConstructorArgKeys<T, NoDrafts>): BaseOp<T, NoDrafts>;
    static NoDrafts(...args: OpConstructorArray<T, NoDrafts>): BaseOp<T, NoDrafts>;
    static NoDrafts(...args: any) {
      return this.base.NoDrafts(...args).type(topo);
    }

    static NoParams(args: OpConstructorArgKeys<T, NoParams>): BaseOp<T, NoParams>;
    static NoParams(...args: OpConstructorArray<T, NoParams>): BaseOp<T, NoParams>;
    static NoParams(...args: any) {
      return this.base.NoParams(...args).type(topo);
    }

    static DraftsOptional(args: OpConstructorArgKeys<T, DraftsOptional>): BaseOp<T, DraftsOptional>;
    static DraftsOptional(...args: OpConstructorArray<T, DraftsOptional>): BaseOp<T, DraftsOptional>;
    static DraftsOptional(...args: any) {
      return this.base.DraftsOptional(...args).type(topo);
    }

    static ParamsOptional(args: OpConstructorArgKeys<T, ParamsOptional>): BaseOp<T, ParamsOptional>;
    static ParamsOptional(...args: OpConstructorArray<T, ParamsOptional>): BaseOp<T, ParamsOptional>;
    static ParamsOptional(...args: any) {
      return this.base.ParamsOptional(...args).type(topo);
    }

    static AllRequired(args: OpConstructorArgKeys<T, AllRequired>): BaseOp<T, AllRequired>;
    static AllRequired(...args: OpConstructorArray<T, AllRequired>): BaseOp<T, AllRequired>;
    static AllRequired(...args: any) {
      return this.base.AllRequired(...args).type(topo);
    }
  }
}

export const OpFactories = {
  Seed: makeTopoFactory<Seed>("seed"),
  Pipe: makeTopoFactory<Pipe>("pipe"),
  Merge: makeTopoFactory<Merge>("merge"),
  Branch: makeTopoFactory<Branch>("merge"),
  Bus: makeTopoFactory<Bus>("bus"),
}

// export const SeedOperation = makeTopoFactory<Seed>("seed");
// export const PipeOperation = makeTopoFactory<Pipe>("pipe");
// export const MergeOperation = makeTopoFactory<Merge>("merge");
// export const BranchOperation = makeTopoFactory<Branch>("merge");
// export const BusOperation = makeTopoFactory<Bus>("bus");

type TopologyOpIndex = {
  [T in keyof TopologyIndex]: {
    [C in keyof ConstraintIndex]: BaseOp<TopologyIndex[T], ConstraintIndex[C]>;
  }
}

export type BuildableOperation = TopologyOpIndex[TopologyName][ConstraintName];