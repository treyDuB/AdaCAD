import { Draft } from './drafts';
import { Loom, LoomSettings } from './looms';
import { Shuttle } from '../shuttle';
import { Note } from '../../provider/notes.service';
import { Bounds } from './screenlayout';

/****** OBJECTS/TYPES FOR LOADING AND SAVING FILES *****/

/**
 * holds data about each node/component in a form to easily load.
 * @param node_id the id of this node within the tree
 * @param type the type of node
 * @param bounds the screen position and size data for this node
 */
export interface NodeComponentProxy {
    node_id: number,
    type: string,
    bounds: Bounds
  }
  
  /**
   * stores a sparce version of a tree node for easy reloading
   * @param node the node id this treenode refers too
   * @param parent the node id of the parent node for this treenode
   * @param inputs an array of treenode ids for all values coming into this node
   * @param outputs an array of treenode ids for all downstream functions 
   */
   export interface TreeNodeProxy {
    node: number,
    parent: number; 
    inputs: Array<{tn: number, ndx: number}>;
    outputs: Array<{tn: number, ndx: number}>; 
   }
  
    /**
    * holds data about each draft component in a compressed form 
    * @param draft_id the draft id associated with this node (if available)
   * @param draft_visible a boolean to state if this node is visible or not. 
   * @param draft_name a string representing a user defined name
   * @param draft this will only export if the draft is a seed draft
   * @param loom this will only export if the draft is a seed draft 
   * @param loom_settings the associated loom settings on this node, if present
    */
  
    export interface DraftNodeProxy {
      node_id: number;
      draft_id: number;
      draft_name: string;
      draft: Draft;
      draft_visible: boolean;
      loom: Loom,
      loom_settings: LoomSettings;
    }
  
  /**
    * a sparce form of an operaction component to use for saving
    * @param node_id the node id this object refers too
    * @param name the name of the operation at this node
    * @param params the list of input parameters to this operation
    * @param inlets the let of inlets and associated values 
    */
  export interface OpComponentProxy {
    node_id: number,
    name: string,
    params: Array<any>, 
    inlets: Array<any>;
  }
  
  
   /**
    * describes the data from the workspace that is saved.
    */
   export interface SaveObj {
    version: string,
    workspace: any,
    type: string,
    nodes: Array<NodeComponentProxy>,
    tree: Array<TreeNodeProxy>,
    draft_nodes: Array<DraftNodeProxy>,
    ops: Array<any>,
    notes: Array<Note>,
    materials: Array<Shuttle>,
    scale: number
   }
  
  export interface FileObj {
   version: string,
   workspace: any,
   filename: string,
   nodes: Array<NodeComponentProxy>,
   treenodes: Array<TreeNodeProxy>,
   draft_nodes: Array<DraftNodeProxy>,
   ops: Array<OpComponentProxy>
   scale: number
  }
  
  export interface StatusMessage {
    id: number,
    message: string,
    success: boolean
  }
  
  export interface LoadResponse {
    data: FileObj,
    status: number;
  }
  
  export interface Fileloader {
    ada: (filename: string, data: any) => Promise<LoadResponse>,
    //wif: (filename: string, data: any) => Promise<LoadResponse>,
    //bmp: (filename: string, data: any) => Promise<LoadResponse>,
    //jpg: (filename: string, data: any) => Promise<LoadResponse>,
    form: (data: any) => Promise<LoadResponse>}
  
  export interface FileSaver {
    ada: (type: string, for_timeline:boolean, current_scale: number) => Promise<{json: string, file: SaveObj}>,
    //wif: (draft: Draft, loom: Loom) => Promise<string>,
    bmp: (canvas: HTMLCanvasElement) => Promise<string>,
    jpg: (canvas: HTMLCanvasElement) => Promise<string>
  }