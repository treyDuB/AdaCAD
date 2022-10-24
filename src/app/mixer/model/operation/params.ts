/**
 * an operation param describes what data be provided to this operation
 * some type of operations inherent from this to offer more specific validation data 
 * @param name user-defined name, should reflect the parameter's role in its operation
 * @param dx user-defined description of the parameter and how it affects the operation
 * @param type
 * @param value
 */
export interface OperationParam {
  name: string,
  dx: string,
  type: 'number' | 'boolean' | 'select' | 'file' | 'string' | 'draft',
  value: number | boolean | string | null,
}

export type ParamType = OperationParam["type"];
export type ParamValue = OperationParam["value"];
  
/**
 * An extension of Param that handles extra requirements for numeric data inputs
 * @param min the minimum allowable value
 * @param max the maximum allowable value
 */
export type NumParam = OperationParam & {
  type: 'number',
  value: number,
  min: number,
  max: number
}
  
/**
 * An extension of Param that handles extra requirements for select list  inputs
 * @param selectlist an array of names and values from which the user can select
 */
export type SelectParam = OperationParam & {
  type: 'select',
  value: number,
  selectlist: Array<{name: string, value: number}>,
  default?: number
}
  
/**
 * An extension of Param that handles extra requirements for select boolean inputs
 * @param falsestate a description for the user explaining what "false" means in this param
 * @param truestate a description for the user explaining what "false" means in this param
 */
export type BoolParam = OperationParam & {
  type: 'boolean',
  value: boolean | number,
  falsestate: string,
  truestate: string,
  default?: boolean | number
}
  
/**
 * An extension of Param that handles extra requirements for strings as inputs
 * @param regex strings must come with a regex used to validate their structure
 * test and make regex using RegEx101 website
 * do not use global (g) flag, as it creates unpredictable results in test functions used to validate inputs
 @param error the error message to show the user if the string is invalid 
 */
export type StringParam = OperationParam & {
  type: 'string',
  value: string,
  regex: RegExp,
  error: string
}
  
/**
* An extension of Param that handles extra requirements for select file inputs
* Currently a placeholder should extra data be required. 
*/
export type FileParam = OperationParam & {
  type: 'file'
}
  
/**
* UNUSED -- if you want another draft input on an operation, add another inlet
* An extension of Param that handles extra requirements for select drafts as inputs
* @param id draft id at this parameter --- DON'T USE
*/
export type DraftParam = OperationParam & {
  id: number,
  type: 'draft'
}

export type GenericParam<Type> = OperationParam & {
  value: Type,
  default?: Type,
  new (v: Type): GenericParam<Type>,
}

/**
 * Utility function to extract values from an array of Params
 * @param input Array of OperationParams, any type
 * @returns Array of ParamValues
 */
export function getParamValues(input: Array<OperationParam>): Array<ParamValue> {
  return input.map((param) => param.value);
}

/**
 * Set of functions to help make OperationParameters
 */
export class Params {
  static Number(name: string, dx: string, value: number, min: number, max: number): NumParam;
  static Number({ name, dx, value, min, max }: 
    { name: string; 
      dx: string; 
      value: number; 
      min: number; 
      max: number; }
  ): NumParam;
  static Number(objOrName: any, dx?: string, value?: number, min?: number, max?: number) {
    return { type: 'number', name: objOrName, value: value, min: min, max: max, dx: dx };
  }

  static String(name: string, dx: string, value: string, regex: RegExp, error: string): StringParam;
  static String({ name, dx, value, regex, error }:
    { name: string;
      dx: string;
      value: string;
      regex: RegExp;
      error: string; }
  ): StringParam;
  static String(objOrName: any, dx?: string, value?: string, regex?: RegExp, error?: string) {
    return { type: 'string', name: objOrName, dx: dx, value: value, regex: regex, error: error };
  }

  // static Bool(

  // ): BoolParam {

  // }

}