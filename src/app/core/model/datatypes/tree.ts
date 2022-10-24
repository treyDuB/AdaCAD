import { ViewRef } from '@angular/core';
import { ConnectionComponent } from "../../../mixer/palette/connection/connection.component";
import { OperationComponent } from "../../../mixer/palette/operation/operation.component";
import { SubdraftComponent } from "../../../mixer/palette/subdraft/subdraft.component";

import { Draft } from './drafts';
import { Loom, LoomSettings } from './looms';

/****************** OBJECTS/TYPES RELATED to OPERATION TREE *****************/

/**
 * this stores a reference to a component on the palette with its id and some
 * @param type is the type of component'
 * @param view_id is ndx to reference to this object in the ViewComponentRef (for deleting)
 * @param id is a unique id linked forever to this component 
 * @param component is a reference to the component object
 * @param dirty describes if this needs to be recalcuated or redrawn 
 */
 type BaseNode = {
    type: 'draft' | 'op' | 'cxn',
    ref: ViewRef,
    id: number, //this will be unique for every instance
    component: SubdraftComponent | OperationComponent | ConnectionComponent,
    dirty: boolean
  }
  
  
  /**
   * an OpNode is an extension of BaseNode that includes additional params
   * @param name the name of the operation at this node
   * @param params an array of the current param values at this node
   * @param inlets an array of the inlet values at this node
   */
  export type OpNode = BaseNode & {
    name: string,
    params: Array<any>
    inlets: Array<any>;
   }
  
  
   /**
   * a DraftNode is an extension of BaseNode that includes additional params
   * @param draft the active draft at this node
   * @param loom the loom associated with the draft at this node
   * @param loom_settings the settings associted with the loom at this node
   */
   export type DraftNode = BaseNode & {
    draft: Draft,
    loom: Loom,
    loom_settings: LoomSettings
   }
  
  
  /**
   * Allows one to use Node as shorthand for any of these types of nodes
   */
   export type Node = BaseNode | OpNode | DraftNode;
  
  
   /**
    * a type to store input and output information for nodes that takes multiple node inputs and outputs into account.
    * each node stores the node it gets as input and output and the inlet/outlet that node enter into on itself. 
    * connections will have inlet/outlet indexes of 0, 0 (they cannot connect ot multiple things)
    * drafts will have inset/outout indexes of 0, 0 (they can only have one parent)
    * ops will have multiple inlets and outlets. For example, an input of (2, 1) means that treenode 2 is connected to inlet 1. 
    * @param treenode - the treenode that this input or output goes towards
    * @param ndx - which ndx on the said treenodes does this connect to specifically
    */
   export interface IOTuple {
     tn: TreeNode,
     ndx: number
   }
  
  /**
   * A tree node stores relationships between the components created by operations
    * @param node: is a reference to the node object stored in the tree. 
    * @param parent links to the treenode that "created" this node or null if it was created by the user 
    * @param inputs a list of TreeNodes that are used as input to this TreeNode with an idex to which input they belong to
    * @param outputs a list of TreeNodes created by this node or specified by the user
    * Rules: 
    *   Operations can have many inputs and many outputs 
    *   Subdrafts can only have one input and one output (for now)
    *   
  */
export interface TreeNode {
    node: Node,
    parent: TreeNode,
    inputs: Array<IOTuple>,
    outputs: Array<IOTuple>
}