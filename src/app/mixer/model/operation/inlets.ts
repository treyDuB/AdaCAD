import { Draft } from "../../../core/model/datatypes";

/**
 * each operation has 0 or more inlets. These are areas where drafts can be entered as inputs to the operation
 * @param name the display name to show with this inlet
 * @param type the type of parameter that becomes mapped to inputs at this inlet: static means that the user cannot change this value
 * @param dx the description of this inlet
 * @param value the assigned value of the parameter. 
 * @param num_drafts the total number of drafts accepted into this inlet (or -1 if unlimited)
 */
export type OperationInlet = {
  name: string,
  type: 'number' | 'notation' | 'system' | 'color' | 'static' | 'draft' | 'profile' | 'null',
  dx: string,
  value: number | string,
  num_drafts: number
}
  
/**
 * An extension of Inlet that handles extra requirements for numeric data inputs
 * @param value the current (or default?) value of this number input
 * @param min the minimum allowable value
 * @param max the maximum allowable value
 */
export type NumInlet = OperationInlet & {
  value: number,
  min: number,
  max: number
}
  
export type InletDrafts = {
  [key: number]: Array<Draft>
}