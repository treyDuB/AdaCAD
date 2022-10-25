import { Draft } from '../../core/model/datatypes';
import { OperationParam, ParamValue } from './operation/params';
import { InletDrafts, OperationInlet } from './operation/inlets';
import { BaseOp as Op, BuildableOperation as GenericOp,
  Seed, Pipe, Merge, Branch, Bus,
  NoDrafts, NoParams, DraftsOptional, ParamsOptional, AllRequired
} from './operation/topology';
import { filter } from 'mathjs';


/** ALL OBJECTS/TYPES/UTILITY FUNCTIONS RELATED to OPERATIONS *****************/

export * from './operation/inlets';
export * from './operation/params';
export * from './operation/topology';
export * as format from './operation/formatting';

/**** USING OPERATIONS with the MIXER TREE **************/

/**
 * this is a type that contains a series of smaller operations held under the banner of one larger operation (such as layer)
 * @param op_name the name of the operation or "child" if this is an assignment to an input parameter
 * @param drafts the drafts associated with this input
 * @param params the parameters associated with this operation OR child input
 * @param inlets the index of the inlet for which the draft is entering upon
 */
 export interface OpInput {
  op_name: string,
  drafts: Array<Draft | never>,
  params: Array<any>,
  inlet: number | null
}

function getParamsFromInputs(inputs: Array<OpInput>): Array<ParamValue> {
  let res = inputs.map((el) => el.params).reduce((acc, el) => acc.concat(el), []);
  console.log(res);
  return res;
}

function getDraftsFromInputs(inputs: Array<OpInput>): Array<Draft> {
  return inputs.map((el) => el.drafts).reduce((acc, ds) => acc.concat(ds), []);
}

function getInletsFromInputs(inputs: Array<OpInput>, n: number): InletDrafts {
  let res: InletDrafts;
  for (let i = 0; i < n; i++) {
    let this_inlet = inputs.filter((el) => el.inlet == i);
    let inlet_drafts = this_inlet.map((el) => el.drafts);
    res[i] = inlet_drafts.reduce((acc, ds) => acc.concat(ds), []);
  }
  return res;
}
  
/**
 * a standard operation used by the tree
 * @param name the internal name of this opearation (CHANGING THESE WILL BREAK LEGACY VERSIONS)
 * @param displayname the name to show upon this operation in the interface
 * @param dx the description of this operation
 * @param params the parameters associated with this operation
 * @param inets the inlets associated with this operation
 * @param old_names referes to any prior name of this operation to aid when loading old files
 * @param perform a function that executes when this operation is performed, takes a series of inputs and resturns an array of drafts
 */
export interface TreeOperation {
  name: string,
  displayname: string,
  dx: string,
  params: Array<OperationParam>,
  inlets: Array<OperationInlet>,
  old_names: Array<string>,
  perform: (op_inputs: Array<OpInput>) => Promise<Array<Draft>>
}

export function buildTreeOp(base: GenericOp): TreeOperation {
  let tree_op_perform: TreeOperation["perform"];
  // check what type of op, topologically with I/O (seed, pipe, merge, branch, bus, dynamic)
    // convert perform args to Array<OpInput>
  // check for special case of args (no drafts, no params, everything else is ok)
    // only seed -> no drafts, everything else
    // pipe/merge/branch/bus -> no params, everything else
  // check if there is a param or draft in op_inputs[0] to put into an optional arg
  if (base.classifier.type === 'seed') {
    if (base.classifier.input_drafts === 'none') {
      let seedOp = base as Op<Seed, NoDrafts>;
      tree_op_perform = (op_inputs: Array<OpInput>) => {
        return Promise.resolve([seedOp.perform(op_inputs[0].params)]);
      }
    } else {
      let seedOp = base as Op<Seed, DraftsOptional>;
      tree_op_perform = (op_inputs: Array<OpInput>) => {
        console.log("op inputs: ", op_inputs);
        if (op_inputs.filter((el) => (el.op_name == 'child')).length > 0) {
          return Promise.resolve([seedOp.perform(op_inputs[0].params, getDraftsFromInputs(op_inputs)[0])]);
        } else {
          return Promise.resolve([seedOp.perform(op_inputs[0].params)]);
        }
      }
    }
  } else if (base.classifier.type === 'pipe') {
    // let pipeOp;
    if (base.classifier.input_params === 'none') {
      let pipeOp = base as Op<Pipe,NoParams> ;
      tree_op_perform = (op_inputs: Array<OpInput>) => {
        if (op_inputs.filter((el) => (el.op_name == 'child')).length == 0) {
          return Promise.resolve([]) as Promise<Array<Draft>>;
        }
        return Promise.resolve([pipeOp.perform(getDraftsFromInputs(op_inputs)[0])]);
      }
    } else if (base.classifier.input_params === 'req') {
      let pipeOp = base as Op<Pipe,AllRequired>;
      tree_op_perform = (op_inputs: Array<OpInput>) => {
        if (op_inputs.filter((el) => (el.op_name == 'child')).length == 0) {
          return Promise.resolve([]) as Promise<Array<Draft>>;
        }
        return Promise.resolve([pipeOp.perform(getDraftsFromInputs(op_inputs)[0], op_inputs[0].params)]);
      }
    } else {
      let pipeOp = base as Op<Pipe,ParamsOptional>;
      tree_op_perform = (op_inputs: Array<OpInput>) => {
        if (op_inputs[0].params.length > 0) {
          return Promise.resolve([pipeOp.perform(op_inputs[0].drafts[0], op_inputs[0].params)]);
        } else {
          return Promise.resolve([pipeOp.perform(op_inputs[0].drafts[0])]);
        }
      }
    }
  } else if (base.classifier.type === 'merge') {
    if (base.classifier.input_params === 'none') {
      let mergeOp = base as Op<Merge, NoParams>;
      if (base.inlets.filter((i) => i.num_drafts != 1).length) {
        // complex merge, at least one inlet can take multiple drafts, so we have to prepare
        // the inputs a little differently
        tree_op_perform = (op_inputs: Array<OpInput>) => {
          if (op_inputs.filter((el) => (el.op_name == 'child')).length <= 1) {
            return Promise.resolve([]) as Promise<Array<Draft>>;
          }
          let inputs: InletDrafts = {};
          for (let i = 0; i < base.inlets.length; i++) {
            let this_inlet = op_inputs.filter((el) => el.inlet == i);
            let inlet_drafts = this_inlet.map((el) => el.drafts);
            inputs[i] = inlet_drafts.reduce((acc, ds) => acc.concat(ds), []);
          }
          return Promise.resolve([mergeOp.perform(inputs)]);
        }
      } else {
        // simple merge, either 1 multi-inlet or mulitple single inlets
        tree_op_perform = (op_inputs: Array<OpInput>) => {
          if (op_inputs.filter((el) => (el.op_name == 'child')).length == 0) {
            return Promise.resolve([]) as Promise<Array<Draft>>;
          }
          let inputs: Array<Draft>;
          inputs = op_inputs.map((el) => el.drafts).reduce((acc, ds) => acc.concat(ds), []);
          return Promise.resolve([mergeOp.perform(inputs)]);
        }
      }
    } else if (base.classifier.input_params === 'req') {
      let mergeOp = base as Op<Merge, AllRequired>;
      if (base.inlets.filter((i) => i.num_drafts != 1).length) {
        // complex merge, at least one inlet can take multiple drafts, so we have to prepare
        // the inputs a little differently
        tree_op_perform = (op_inputs: Array<OpInput>) => {
          if (op_inputs.filter((el) => (el.op_name == 'child')).length == 0) {
            return Promise.resolve([]) as Promise<Array<Draft>>;
          }
          let inputs: InletDrafts = {};
          for (let i = 0; i < base.inlets.length; i++) {
            let this_inlet = op_inputs.filter((el) => el.inlet == i);
            let inlet_drafts = this_inlet.map((el) => el.drafts);
            inputs[i] = inlet_drafts.reduce((acc, ds) => acc.concat(ds), []);
          }
          return Promise.resolve([mergeOp.perform(inputs, op_inputs[0].params)]);
        }
      } else {
        // simple merge, either 1 multi-inlet or mulitple single inlets
        tree_op_perform = (op_inputs: Array<OpInput>) => {
          if (op_inputs.filter((el) => (el.op_name == 'child')).length == 0) {
            return Promise.resolve([]) as Promise<Array<Draft>>;
          }
          let inputs: Array<Draft>;
          inputs = op_inputs.map((el) => el.drafts).reduce((acc, ds) => acc.concat(ds));
          return Promise.resolve([mergeOp.perform(inputs, op_inputs[0].params)]);
        }
      }
    }
  } else if (base.classifier.type === 'branch') { /** @todo */
    if (base.classifier.input_params === 'req') {
      let branchOp = base as Op<Branch, AllRequired>;
      tree_op_perform = (op_inputs: Array<OpInput>) => {
        return Promise.resolve(branchOp.perform(op_inputs[1].drafts[0], getParamsFromInputs(op_inputs))) as Promise<Array<Draft>>;
      }
    } else {
      let branchOp = base as Op<Branch, NoParams>;
      tree_op_perform = (op_inputs: Array<OpInput>) => {
        if (op_inputs.filter((el) => (el.op_name == 'child')).length == 0) {
          return Promise.resolve([]) as Promise<Array<Draft>>;
        }
        return Promise.resolve(branchOp.perform(op_inputs[1].drafts[0])) as Promise<Array<Draft>>;
      }
    }
  } else { /** @todo bus ops */
    tree_op_perform = (op_inputs: Array<OpInput>) => {
      return Promise.resolve([]) as Promise<Array<Draft>>;
    }
  }

  let new_op = {
    name: base.name,
    topo_op: base,
    old_names: base.old_names,
    inlets: base.inlets,
    displayname: base.displayname,
    dx: base.dx,
    max_inputs: base.max_inputs,
    params: base.params,
    perform: tree_op_perform
  } as TreeOperation;

  return new_op;
}

/**
 * A container operation that takes drafts with some parameter assigned to them 
 * @param name the internal name of this operation used for index (DO NOT CHANGE THESE NAMES!)
 * @param displayname the name to show the viewer 
 * @param params the parameters that one can directly input to the parent
 * @param dynamic_param_id which parameter id should we use to dynamically create paramaterized input slots
 * @param dynamic_param_type the type of parameter that we look to generate
 * @param inlets the inlets available for input by default on this operation
 * @param dx the description of this operation
 * @param old_names referes to any prior name of this operation to aid when loading old files
 * @param perform a function that executes when this operation is performed, takes a series of inputs and resturns an array of drafts
 */
export interface DynamicOperation extends TreeOperation {
  name: string,
  displayname: string,
  params: Array<OperationParam>, 
  dynamic_param_id: number,
  dynamic_param_type: string,
  inlets: Array<OperationInlet>,
  dx: string,
  old_names: Array<string>,
  perform: (op_inputs: Array<OpInput>) => Promise<Array<Draft>>;
}

 /**
  * this type is used to classify operations in the dropdown menu
  * @param category the name of the category for all associated operations (e.g. block, structure)
  * @param dx a description of that category to show on screen
  * @param ops an array of all the operations associated with this category
  */
 export interface OperationClassification {
  category: string,
  dx: string,
  ops: Array<TreeOperation> 
 }

 export type Operation = TreeOperation; // default: export operations to interface with Tree

 