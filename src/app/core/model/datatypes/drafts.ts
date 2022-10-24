import { Cell } from '../cell';

/*****   OBJECTS/TYPES RELATED TO DRAFTS  *******/

/**
 * Drawdown can be used as shorthand for drafts, which are just 2D arrays of Cells
 */
 export type Drawdown = Array<Array<Cell>>;


 /**
  * stores a drawdown along with broader information a draft such
  * @param id a unique id to refer to this draft, used for linking the draft to screen components
  * @param gen_name a automatically generated name for this draft (from parent operation)
  * @param ud_name a user defined name for this draft, which, if it exists, will be used instead of the generated name
  * @param drawdown the drawdown/interlacement pattern used in this draft
  * @param rowShuttleMapping the repeating pattern to use to assign draft rows to shuttles (materials)
  * @param rowSystemMapping the repeating pattern to use to assign draft rows to systems (structual units like layers for instance)
  * @param colShuttleMapping the repeating pattern to use to assign draft columns to shuttles (materials)
  * @param colSystemMapping the repeating pattern to use to assign draft columns to systems (structual units like layers for instance)
  */
 export interface Draft {
   id: number,
   gen_name: string,
   ud_name: string,
   drawdown: Drawdown,
   rowShuttleMapping: Array<number>,
   rowSystemMapping: Array<number>,
   colShuttleMapping: Array<number>,
   colSystemMapping: Array<number>,
 }
 
 /**
  * represents a location within a draft.
  * @param i is the row/weft number (0 being at the top of the drawdown)
  * @param j is the column/warp number (0 being at the far left of the drawdown)
  * @param si is the location of this cell within the current view (where the view may be hiding some rows)
  *        this value can be de-indexed to absolute position in the rows using draft.visibleRows array
  * @example const i: number = draft.visibleRows[si];
  */
 export interface Interlacement {
   i: number;  
   j: number;  
   si: number; 
 }
 
 /**
  * represents a location within a draft as well as the value to be placed at that location
  * used by Loom to stage updates before settting them
  * @param i is the row/weft number (0 being at the top of the drawdown)
  * @param j is the column/warp number (0 being at the far left of the drawdown)
  * @param val the value to be assigned at the given location
  */
 
 export interface InterlacementVal {
   i: number;  
   j: number 
   val: boolean; 
 }
 
 
 /***** OBJECTS/TYPES RELATED TO MIXER COMPONENTS ****/
 
 /**
  * this stores a list of drafts created with associated component ids for those drafts, 
  * or -1 if the component for this draft has not been generated yet. 
  */
 export interface DraftMap {
   component_id: number;
   draft: any;
 }