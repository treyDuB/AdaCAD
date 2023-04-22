import { Draft } from "../../core/model/datatypes";
import { Cell } from "../../core/model/cell";
import { initDraftWithParams, applyMask, warps, wefts, 
  shiftDrawdown, getDraftName, invertDrawdown, flipDrawdown,
} from "../../core/model/drafts";
import utilInstance from "../../core/model/util";
import * as _ from "lodash";

import { NumParam, BoolParam, StringParam, SelectParam,
  ParamValue, Params,
  OpInput, InletDrafts,
  OpPerform as Perform, OpFactories
} from "./operation";
import * as format from './operation/formatting';


// helpers for formatting Operation definitions when coding
const { Seed, Pipe, Merge, Branch, Bus } = OpFactories;

function formatName(drafts: Array<Draft>, op_name: string) : string {
  let combined: string = "";
  if (drafts.length == 0) {
    combined = op_name;
  } else {
    combined = drafts.reduce((acc, el) => {
      return acc + "+" + getDraftName(el);
    }, "");

    combined = op_name + "(" + combined.substring(1) + ")";
  }
  return combined;
}

/************** BASIC OPERATIONS **********************/
/** 
 * The operations that have been refactored into this file 
 * (from the operations service) are the ones that work exclusively
 *  with Draft data that is not dependent on any other
 * contextual information, like warp/weft systems (which span 
 * multiple Draft objects in the tree). 
 * These operations also don't require any of the services to work, 
 * such as the ML service (vae) which the "germanify" and 
 * "crackleify" operations rely on.
 */

export const tabby = Seed.DraftsOptional({
  name: 'tabby',
  displayname: 'tabby',
  old_names: [],
  dx: 'also known as plain weave generates or fills input a draft with tabby structure or derivitae',
  params: <Array<NumParam>>[
    {name: 'repeats',
    type: 'number',
    min: 1,
    max: 100,
    value: 1,
    dx: 'the number or reps to adjust evenly through the structure'
    },
  ],
  inlets: [{
    name: 'shape', 
    type: 'static',
    value: null,
    dx: 'the shape you would like to fill with tabby',
    num_drafts: 1
  }],
  perform: (params: Array<number>, input?: Draft) => {
    const width: number = params[0]*2;
    const height: number = params[0]*2;

    let alt_rows, alt_cols, val: boolean = false;
    const pattern: Array<Array<Cell>> = [];
    for(let i = 0; i < height; i++){
      alt_rows = (i < params[0]);
      pattern.push([]);
      for(let j = 0; j < width; j++){
        alt_cols = (j < params[0]);
        val = (alt_cols && alt_rows) || (!alt_cols && !alt_rows);
        pattern[i][j] =  new Cell(val);
      }
    }

    if (!input) {
      const d: Draft = initDraftWithParams({warps: width, wefts: height, pattern: pattern});
      d.gen_name = formatName([], "tabby");
      return d;
    } else {
      const d: Draft = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
      d.drawdown = applyMask(input.drawdown, pattern);         
      // format.transferSystemsAndShuttles(d, [input], params, 'first');
      d.gen_name = formatName([input], "tabby")
      return d;
    }
  }
});


export const tabby_der = Seed.NoDrafts({
  name: 'tabbyder',
  displayname: 'tabby',
  old_names: [],
  dx: 'also known as plain weave generates or fills input a draft with tabby structure or derivative',
  params: <Array<NumParam>>[
    {name: 'warps raised',
    type: 'number',
    min: 0,
    max: 100,
    value: 1,
    dx: 'the number of warp ends to have lifted in the first pic'
    },
    {name: 'warps lowered',
    type: 'number',
    min: 0,
    max: 100,
    value: 1,
    dx: 'the number of warp ends to keep lowered in the first tabby pic'
    },
    {name: 'pics',
    type: 'number',
    min: 0,
    max: 100,
    value: 1,
    dx: 'the number of pics upon which the first tabby pic will be repeated'
    },
    {
      name: 'alt pics',
      type: 'number',
      min: 0,
      max: 100,
      value: 1,
      dx: 'the number of pics upon which the repeat the alteranting pattern'
    },
  ],
  perform: (params: Array<number>) => {

    const raised: number = params[0];
    const lowered: number = params[1];
    const rep: number = params[2];
    const alt_rep: number = params[3];

    const d: Draft = initDraftWithParams({warps: raised + lowered, wefts: rep+alt_rep});

    for (let i = 0; i < warps(d.drawdown); i++) {
      if(i < raised) d.drawdown[0][i].setHeddle(true);
      else d.drawdown[0][i].setHeddle(false);
    }

    for(let i = 1; i < wefts(d.drawdown); i++){
      if(i < rep) d.drawdown[i] = d.drawdown[0].slice();
      else{
        for(let j = 0; j < warps(d.drawdown); j++){
          d.drawdown[i][j].setHeddle(!d.drawdown[0][j].getHeddle());
        }
      } 
    }
    return d;
  }
});

export const rib = Seed.DraftsOptional({
  name: 'rib',
  displayname: 'rib',
  old_names: [],
  dx: 'generates a rib/cord/half-basket structure defined by the parameters',
  params: <Array<NumParam>>[
    {
      name: 'unders',
      type: 'number',
      min: 1,
      max: 100,
      value: 2,
      dx: 'number of weft unders in a pic'
    },
    {
      name: 'overs',
      type: 'number',
      min: 1,
      max: 100,
      value: 2,
      dx: 'number of weft overs in a pic'
    },
    {
      name: 'repeats',
      type: 'number',
      min: 1,
      max: 100,
      value: 1,
      dx: 'number of weft pics to repeat within the structure'
    }
  ],
  inlets: [{
    name: 'shape', 
    type: 'static',
    value: null,
    dx: 'the shape you would like to fill with this rib structure',
    num_drafts: 1
  }],
  perform: (params: Array<number>, input?: Draft) => {
  
    const sum: number =params[0] + params[1];
    const repeats: number = params[2];
    const width: number = sum;
    const height: number = repeats * 2;

    let alt_rows, alt_cols, val: boolean = false;
    const pattern: Array<Array<Cell>> = [];
    for (let i = 0; i < height; i++) {
      alt_rows = (i < repeats);
      pattern.push([]);
      for (let j = 0; j < width; j++) {
        alt_cols = (j % sum <params[0]);
        val = (alt_cols && alt_rows) || (!alt_cols && !alt_rows);
        pattern[i][j] =  new Cell(val);
      }
    }

    const d: Draft = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
    d.drawdown = applyMask(input.drawdown, pattern);         
    // format.transferSystemsAndShuttles(d, [input], params, 'second');
    d.gen_name = formatName([input], "rib");
    return d;
  }
});

export const twill = Seed.DraftsOptional({
  name: 'twill',
  displayname: 'twill',
  old_names: [],
  dx: 'generates or fills with a twill structure described by the input drafts',
  params: [
    <NumParam> {name: 'warps raised',
    type: 'number',
    min: 1,
    max: 100,
    value: 1,
    dx: 'number of warps raised in the first pic'
    },
    <NumParam>{name: 'warps lowered',
    type: 'number',
    min: 1,
    max: 100,
    value: 3,
    dx: 'number of warps reaminig lowered in the first pic'
    },
    <BoolParam> {name: 'Z/S',
    type: 'boolean',
    falsestate: 'S',
    truestate: 'Z',
    value: 0,
    dx: 'toggle to switch the twist direction'
    },
    <BoolParam> {name: 'face',
    type: 'boolean',
    falsestate: "weft facing",
    truestate: "warp facing",
    value: 0,
    dx: 'select to toggle warp and weft facing variations of this satin'
    }
  ],
  inlets: [{
    name: 'shape', 
    type: 'static',
    value: null,
    dx: 'the shape you would like to fill with twill',
    num_drafts: 1
  }],
  perform: (params: Array<number>, input?: Draft) => {
   
    let sum: number = params[0] + params[1];

   // sum -=params[2];

    const pattern: Array<Array<Cell>> = [];
    for(let i = 0; i < sum; i++){
      pattern.push([]);
      for(let j = 0; j < sum; j++){
        if (params[3] == 0) pattern[i][(j+i)%sum] = (j < params[0]) ? new Cell(true) : new Cell(false);
        else pattern[i][(j+i)%sum] = (j < params[0]) ? new Cell(false) : new Cell(true);
      }
    }

    let d: Draft;
    if (!input) {
      d = initDraftWithParams({warps: sum, wefts: sum, pattern: pattern});
      d.gen_name = formatName([], "twill");
    } else {
      d = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
      d.drawdown = applyMask(input.drawdown, pattern);         
      // format.transferSystemsAndShuttles(d, [input], params, 'first');
      d.gen_name = formatName([input], "twill");
    }

    if (params[2] === 1) {
      return flipx.perform(d);
      //return (<Operation>this.getOp('flip horiz')).perform([{drafts:[], params:[], inlet: 0, op_name:"flip horiz"}, {drafts:outputs, params:[], inlet: 0, op_name:"child"}]);
    } else {
      return d;
    }
  }        
});

export const complextwill = Seed.DraftsOptional({
  name: 'complextwill',
  displayname: 'complex twill',
  old_names:[],
  dx: 'generates a specified by the input parameters, alternating warp and weft facing with each input value',
  params: [
    <StringParam>{name: 'pattern',
    type: 'string',
    regex: /(\d+)/,
    value: '2 2 3 3',
    dx: 'the under over pattern of this twill (e.g. 2 2 3 3)'
    },
    <BoolParam>{name: 'Z/S',
    type: 'boolean',
    falsestate: 'Z',
    truestate: 'S',
    value: 0,
    dx: 'toggle to change twill direction'
    }
  ],
  inlets: [{
    name: 'shape', 
    type: 'static',
    value: null,
    dx: 'the shape you would like to fill with this twill',
    num_drafts: 1
  }],
  perform: (params: Array<ParamValue>, input?: Draft) => {
    const twist = params[1];
    const pattern_string: String = String(params[0]);
    const sequence: Array<number> = pattern_string.split(' ').map(el => parseInt(el));

    let sum: number = sequence.reduce( (acc, val) => {
      return val + acc;
    }, 0);

    const starting_line: Array<boolean>  = [];
    let under = true;
    sequence.forEach(input => {
      for (let j = 0; j < input; j++) {
        starting_line.push(under);
      }
      under = !under;
    });

    const pattern: Array<Array<Cell>> = [];
    let twist_val = (twist == 0) ? -1 : 1;
    for (let i = 0; i < sum; i++) {
      pattern.push([]);
      for (let j = 0; j < sum; j++) {
        let ndx = (j + (twist_val*i)) % sum;
        if (ndx < 0) ndx = sum + ndx;
        pattern[i].push(new Cell(starting_line[ndx]));
      }
    }

    let d: Draft;
    if(!input){
      d = initDraftWithParams({warps: sum, wefts: sum, pattern: pattern});
      d.gen_name = formatName([], "complex twill");
    } else {
      d = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
      d.drawdown = applyMask(input.drawdown, pattern);         
      // format.transferSystemsAndShuttles(d, [input], params, 'first');
      d.gen_name = formatName([input], "complex twill");
    }

    return d; 
  }        
});

export const basket = Seed.DraftsOptional({
  name: 'basket',
  displayname: 'basket',
  old_names: [],
  dx: 'generates a basket structure defined by theop_input.drafts',
  params: <Array<NumParam>>[
    {name: 'unders',
    type: 'number',
    min: 1,
    max: 100,
    value: 2,
    dx: 'number of weft unders'
    },
    {name: 'overs',
    type: 'number',
    min: 1,
    max: 100,
    value: 2,
    dx: 'number of weft overs'
    }
  ],
  inlets: [{
    name: 'shape', 
    type: 'static',
    value: null,
    dx: 'the shape you would like to fill with this twill',
    num_drafts: 1
  }],
  perform: (params: Array<number>, input?: Draft) => {
    const sum: number = params.reduce( (acc, val) => {
        return val + acc;
    }, 0);

    let alt_rows, alt_cols, val: boolean = false;
    const pattern: Array<Array<Cell>> = [];
    for (let i = 0; i < sum; i++) {
      alt_rows = (i % sum <params[0]);
      pattern.push([]);
      for(let j = 0; j < sum; j++){
        alt_cols = (j % sum <params[0]);
        val = (alt_cols && alt_rows) || (!alt_cols && !alt_rows);
        pattern[i][j] =  new Cell(val);
      }
    }

    let d: Draft;
    if (input == undefined) {
      d = initDraftWithParams({warps: sum, wefts: sum, pattern: pattern});
      d.gen_name = formatName([], "basket");
    } else {
      d = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
      d.drawdown = applyMask(input.drawdown, pattern);         
      // format.transferSystemsAndShuttles(d, [input], params, 'first');
      d.gen_name = formatName([input], "basket")
    }

    return d;
    }

  });

export const waffle = Seed.DraftsOptional({
  name: 'waffle',
  displayname: 'waffle-ish',
  old_names: [],
  dx: 'generates or fills with a waffle structure, sometimes, and some other funky structures at others',
  params: <Array<NumParam>>[
    {name: 'ends',
    type: 'number',
    min: 1,
    max: 100,
    value: 8,
    dx: 'the number of ends to be used in the waffle'
    },
    {name: 'pics',
    type: 'number',
    min: 1,
    max: 100,
    value: 8,
    dx: 'the number of pics to use in the waffle'
    },
    {name: 'interlacement rows',
    type: 'number',
    min: 0,
    max: 100,
    value: 1,
    dx: 'builds tabby around the edges of the central diamond, creating some strange patterns'
    }
  ],
  inlets: [{
    name: 'shape', 
    type: 'static',
    value: null,
    dx: 'the shape you would like to fill with waffle',
    num_drafts: 1
  }],
  perform: (params: Array<number>, input?: Draft) => {

    const width = params[0];
    const height = params[1];
    const bindings = params[2];

    const pattern: Array<Array<Cell>> = [];
    const mid_warp: number = Math.floor(width / 2);  //for 5 this is 2
    const mid_weft: number = Math.floor(height / 2); //for 5 this is 2
    const warps_to_wefts_ratio = mid_warp/mid_weft;

    // first create the diamond
    for (let i = 0; i < height; i++) {
      pattern.push([]);
      const row_offset = (i > mid_weft) ? height - i : i;
      for (let j = 0; j < width; j++) {
        if (j >= mid_warp - row_offset*warps_to_wefts_ratio && j <= mid_warp + row_offset*warps_to_wefts_ratio) pattern[i][j] = new Cell(true);
        else pattern[i][j] = new Cell(false);
      }
    }

    // carve out the tabby
    if (bindings > 0) {
      const tabby_range_size = bindings * 2 + 1;
      for (let i = 0; i < height; i++) {
        const row_offset = (i > mid_weft) ? height - i : i;
        const range_size = Math.floor((mid_warp + row_offset*warps_to_wefts_ratio) - (mid_warp - row_offset*warps_to_wefts_ratio)) + 1;

        //figure out how many bindings we're dealing with here - alterlate to the inside and outside of the diamong
        for (let b = 1; b <= bindings; b++) {
          const inside = (b % 2 == 1) ? true : false;
          if (inside) {
            const increment = Math.floor(b+1 / 2)
            const diff = Math.ceil((range_size - tabby_range_size) / 2);
            const left_j = mid_warp - (diff * increment);
            const right_j = mid_warp + (diff * increment);
            if (left_j > 0 && left_j < width) pattern[i][left_j].setHeddle(false);
            if (right_j > 0 && right_j < width) pattern[i][right_j].setHeddle(false);
          } else {
            const increment = Math.floor(b / 2);
            const left_j = (mid_warp - Math.floor((range_size-1)/2)) - (increment*2);
            const right_j = (mid_warp + Math.floor((range_size-1)/2)) + (increment*2);
            if (left_j > 0 && left_j < width) pattern[i][left_j].setHeddle(true);
            if (right_j > 0 && right_j < width) pattern[i][right_j].setHeddle(true);
          }
        }    
      }
    }

    let d: Draft;
    if(input == undefined){
      d = initDraftWithParams({warps: width, wefts: height, pattern: pattern});
      d.gen_name = formatName([], "waffle");
    } else {
      d = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
      d.drawdown = applyMask(input.drawdown, pattern);         
      // format.transferSystemsAndShuttles(d, [input], params, 'first');
      d.gen_name = formatName([input], "waffle");
    }
    console.log(d);
    return d;
  }
});

export const satin = Seed.DraftsOptional({
  name: 'satin',
  displayname: 'satin',
  old_names:[],
  dx: 'generates or fills with a satin structure described by the input parameters',
  params: <Array<NumParam>>[
    {name: 'repeat',
    type: 'number',
    min: 5,
    max: 100,
    value: 5,
    dx: 'the width and height of the pattern'
    },
    {name: 'move',
    type: 'number',
    min: 1,
    max: 100,
    value: 2,
    dx: 'the move number on each row'
    },
    <BoolParam>{name: 'face',
    type: 'boolean',
    falsestate: "weft facing",
    truestate: "warp facing",
    value: 0,
    dx: 'select to toggle warp and weft facing variations of this satin'
    }
  ],
  inlets: [{
    name: 'shape', 
    type: 'static',
    value: null,
    dx: 'the shape you would like to fill with tabby',
    num_drafts: 1
  }],
  perform: (params: Array<number>, input?: Draft) => {
    const pattern: Array<Array<Cell>> = [];
    for(let i = 0; i <params[0]; i++){
      pattern.push([]);
      for(let j = 0; j <params[0]; j++){
        if(params[2]=== 0) pattern[i][j] = (j===(i*params[1])%params[0]) ? new Cell(true) : new Cell(false);
        else pattern[i][j] = (j===(i*params[1])%params[0]) ? new Cell(false) : new Cell(true);
      }
    }

    let d: Draft;
    if(input === undefined){
      d = initDraftWithParams({warps:params[0], wefts:params[0], pattern: pattern});
      d.gen_name = formatName([], "satin");
    } else {
      d = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
      d.drawdown = applyMask(input.drawdown, pattern);         
      // format.transferSystemsAndShuttles(d,[input],params, 'first');
      d.gen_name = formatName([input], "satin");
    }
    return d;
  }        
});

export const shaded_satin = Seed.NoDrafts({
  name: 'shaded_satin',
  displayname: 'shaded satin',
  old_names: [],
  dx: 'generates or fills with a satin structure described by the input parameters',
  params: <Array<NumParam>>[
    {name: 'warps raised',
    type: 'number',
    min: 0,
    max: 100,
    value: 2,
    dx: 'the number of warps to raise on the first pic'
    },
    {name: 'warps lowered',
    type: 'number',
    min: 0,
    max: 100,
    value: 5,
    dx: 'the number of warps to keep lowered on the first pic'
    },
    {name: 'offset',
    type: 'number',
    min: 1,
    max: 100,
    value: 2,
    dx: 'amount to offset the interlacements on each row'
    },
    <BoolParam>{name: 'face',
    type: 'boolean',
    falsestate: "weft facing",
    truestate: "warp facing",
    value: 0,
    dx: 'select to toggle warp and weft facing variations of this satin'
    }
  ],
  perform: (params: Array<number>) => {
    
    const lift = params[0];
    const lowered = params[1];
    const shift = params[2];
    const weft_face = params[3];

    const repeat = lift+lowered;

    let first_pic: Array<Cell> = [];
    for(let i = 0; i < repeat; i++){
      if(i < lift) first_pic.push(new Cell(true));
      else first_pic.push(new Cell(false));
    }

    if(weft_face == 1) first_pic = first_pic.map(el => {
      if(el.getHeddle() == true) return new Cell(false);
      else return new Cell(true);
    });

    const d: Draft = initDraftWithParams({warps:repeat, wefts:repeat});

    for(let i = 0; i < repeat; i++){
      for(let j = 0; j < repeat; j++){
        let shift_j =  (j+ (shift * i)) % repeat;
        d.drawdown[i][j].setHeddle(first_pic[shift_j].getHeddle());
      }
    }
    
    d.gen_name = formatName([], "satin");
    return d;
  }        
});

export const random = Seed.DraftsOptional({
    name: 'random',
    displayname: 'random',
    old_names: [],
    dx: 'generates a random draft with width, height, and percetage of weft unders defined byop_input.drafts',
    params: <Array<NumParam>>[
      {name: 'width',
      type: 'number',
      min: 1,
      max: 100,
      value: 8,
      dx: 'the width of this structure'
      },
      {name: 'height',
      type: 'number',
      min: 1,
      max: 100,
      value: 8,
      dx: 'the height of this structure'
      },
      {name: 'percent weft unders',
      type: 'number',
      min: 1,
      max: 100,
      value: 50,
      dx: 'percentage of weft unders to be used'
      }
    ],
    inlets: [{
      name: 'shape', 
      type: 'static',
      value: null,
      dx: 'the shape you would like to fill with random',
      num_drafts: 1
    }],
    perform: (params: Array<number>, input?: Draft) => {
      const pattern: Array<Array<Cell>> = [];
      for(let i = 0; i <params[1]; i++){
        pattern.push([]);
        for(let j = 0; j <params[0]; j++){
          const rand: number = Math.random() * 100;
          pattern[i][j] = (rand >params[2]) ? new Cell(false) : new Cell(true);
        }
      }

      let d: Draft;
      if (input === undefined) {
        d = initDraftWithParams({warps:params[0], wefts:params[1], pattern: pattern});
        d.gen_name = formatName([], "random");
      } else {
        d = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
        d.drawdown = applyMask(input.drawdown, pattern);         
        // format.transferSystemsAndShuttles(d,[input],params, 'first');
        d.gen_name = formatName([input], "random");
      }
      return d;
    }        
});

export const number_to_draft = Seed.NoDrafts({
  name: 'number_to_draft',
  old_names:[],
  displayname: 'draft by number',  
  dx: 'sets the draft values based on a number, turned into binary, and then filled into the structure',
  params: <Array<NumParam>>[
    {name: 'decode',
    type: 'number',
    min: 1,
    max: 100000,
    value: 1,
    dx: "number you'd like to decode into a draft"
    },
    {name: 'width',
    type: 'number',
    min: 1,
    max: 20,
    value: 5,
    dx: "the width of your structure"
    },
    {name: 'height',
    type: 'number',
    min: 1,
    max: 20,
    value: 5,
    dx: "the height of your structure"
    }
  ],
  perform: (params: Array<number>)=> {
    const decode = params[0];
    const width = params[1];
    const height = params[2];

    const bit_size = width * height;
    let decode_string = decode.toString(2);

    while (decode_string.length < bit_size) {
      decode_string = '0' + decode_string;
    }

    let pattern: Array<Array<Cell>> = [];
    for (let i = 0; i < height; i++) {
      pattern.push([]);
      for (let j = 0; j < width; j++) {
        const ndx = i * width + j;
        if (ndx < decode_string.length) {
          const cell_val: boolean = (decode_string.charAt(ndx) == '1');
          pattern[i].push(new Cell(cell_val));
        } else {
          pattern[i].push(new Cell(false));
        }
      }
    }
    
    return initDraftWithParams({wefts: height, warps: width, drawdown: pattern});
  }        
});

export const rect = Seed.DraftsOptional({
  name: 'rectangle',
  displayname: 'rectangle',
  old_names: [],
  dx: 'generates a rectangle of the user specified size. If given an input, fills the rectangle with the input',
  params: [
    Params.Number({ name: 'width', value: 10, min: 1, max: 500, dx: 'width' }), 
    Params.Number({ name: 'height', value: 10, min: 1, max: 500, dx: 'height' })
  ],
  inlets: [{
    name: 'input draft', 
    type: 'static',
    value: null,
    dx: 'the draft with which you would like to fill this rectangle',
    num_drafts: 1
  }],
  perform: (params: Array<number>, input?: Draft) => {
    const draft = (input !== undefined) ? input : initDraftWithParams({drawdown: [[new Cell(true)]]});
    const d: Draft = initDraftWithParams({   
      warps: params[0], 
      wefts: params[1], 
      drawdown: draft.drawdown,
      rowShuttleMapping: draft.rowShuttleMapping,
      colShuttleMapping: draft.colShuttleMapping,
      rowSystemMapping: draft.rowSystemMapping,
      colSystemMapping: draft.colSystemMapping
    });
  
    d.gen_name = formatName([input], "rect");      
    return d;
  },
});

export const clear = Pipe.NoParams({
    name: 'clear',
    displayname: 'clear',
    old_names: [],
    dx: "this sets all heddles to lifted, allowing it to be masked by any pattern",
    inlets: [{
      name: 'input draft', 
      type: 'static',
      value: null,
      dx: 'the draft you would like to clear',
      num_drafts: 1
    }],
    perform: (input: Draft): Draft => {
      const d: Draft = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), drawdown: [[new Cell(false)]]});
      // format.transferSystemsAndShuttles(d, [input], {}, 'first');
      d.gen_name = formatName([input], "clear");
      return d;
  }
});

export const set = Pipe.AllRequired({
  name: 'set unset',
  displayname: 'set unset heddle to',
  old_names: ['unset'],
  dx: "this sets all unset heddles in this draft to the specified value",
  params: <Array<BoolParam>> [ 
    {name: 'up/down',
    type: 'boolean',
    falsestate: 'unset to heddle up',
    truestate: 'unset to heddle down',
    value: 1,
    dx: "toggles the value to which to set the unset cells (heddle up or down)"
  }],
  inlets: [{
    name: 'input draft', 
    type: 'static',
    value: null,
    dx: 'the draft you would like to modify',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<number>)=> {       
    const d: Draft = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown)});
    input.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
        if(!cell.isSet()){
          if(params[0] === 0) d.drawdown[i][j] = new Cell(false);
          else d.drawdown[i][j] = new Cell(true);
        } 
        else d.drawdown[i][j] = new Cell(cell.isUp());
      });
    });
    // format.transferSystemsAndShuttles(d, [input], params, 'first');
    d.gen_name = formatName([input], "unset->down");
    return d;
  }
});
   
export const unset = Pipe.AllRequired({
  name: 'set down to unset',
  displayname: 'set heddles of type to unset',
  old_names: ['set'],
  dx: "this sets all  heddles of a particular type in this draft to unset",
  params: <Array<BoolParam>> [{
    name: 'up/down',
    type: 'boolean',
    falsestate: 'heddle up to unset',
    truestate: 'heddle down to unset',
    value: 1,
    dx: "toggles which values to map to unselected"
  }],
  inlets: [{
    name: 'input draft', 
    type: 'static',
    value: null,
    dx: 'the draft you would like to modify',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<ParamValue>) => {
    const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts:wefts(input.drawdown)});
    input.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
        if(params[0] === 1 && !cell.isUp() && cell.isSet()) d.drawdown[i][j] = new Cell(null);
        else if(params[0] === 0 && cell.isUp() && cell.isSet()) d.drawdown[i][j] = new Cell(null);
        else d.drawdown[i][j] = new Cell(cell.getHeddle());
      });
    });
    
    // format.transferSystemsAndShuttles(d, [input], params, 'first');
    d.gen_name = formatName([input], "unset");
    return d;
  }
});

export const rotate = Pipe.AllRequired({
  name: 'rotate',
  displayname: 'rotate', 
  old_names:[],     
  dx: "this turns the draft by the amount specified",
  params: [
    <SelectParam> {
      name: 'amount',
      type: 'select',
      selectlist: [
        {name: '90', value: 0},
        {name: '180', value: 1},
        {name: '270', value: 2},
      ],
      value: 0,
      dx: 'corner to which this draft is rotated around 0 is top left, 1 top right, 2 bottom right, 3 bottom left'
    }, <BoolParam> {
      name: 'materials?',
      type: 'boolean',
      falsestate: 'no, don\'t rotate materials',
      truestate: 'yes, rotate materials',
      value: 1, 
      dx: 'if your draft has materials assigned, you can choose wether you want to rotate the draft or the materials only'
    }
  ],
  inlets: [{
    name: 'input draft', 
    type: 'static',
    value: null,
    dx: 'the draft you would like to modify',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<ParamValue>) => {
    const num_rots = <number> params[0];
    const rotate_mats = (params[1] === 0) ? false : true;
    const rotated_wefts = ( num_rots % 2 == 0) ? warps(input.drawdown) : wefts(input.drawdown);
    const rotated_warps = ( num_rots % 2 == 0) ? wefts(input.drawdown) : warps(input.drawdown);

    const d: Draft = initDraftWithParams({warps: rotated_warps, wefts:rotated_wefts});

    for(var i = 0; i < wefts(input.drawdown); i++){
      for(var j = 0; j < warps(input.drawdown); j++){
        const heddle_val = input.drawdown[i][j].getHeddle();
        switch (num_rots) {
          case 0: 
            d.drawdown[(warps(input.drawdown) - 1) - j][i].setHeddle(heddle_val);
            break;
          case 1: 
            d.drawdown[(wefts(input.drawdown) - 1) - i][(warps(input.drawdown) - 1) - j].setHeddle(heddle_val);            
            break;
          case 2: 
            d.drawdown[j][(wefts(input.drawdown) - 1)  - i].setHeddle(heddle_val);
            break;
        }
      }
    }

    if (rotate_mats) {
      for (var i = 0; i < wefts(input.drawdown); i++) {
        switch(num_rots) {
          case 0: 
            d.colShuttleMapping[i] = input.rowShuttleMapping[i];
            d.colSystemMapping[i] = input.rowSystemMapping[i];
            break;
          case 1: 
            d.rowShuttleMapping[(wefts(input.drawdown) - 1) - i] = input.rowShuttleMapping[i];
            d.rowSystemMapping[(wefts(input.drawdown) - 1) - i] = input.rowSystemMapping[i];         
            break;
          case 2: 
            d.colShuttleMapping[wefts(input.drawdown)-1-i] = input.rowShuttleMapping[i];
            d.colSystemMapping[wefts(input.drawdown)-1-i] = input.rowSystemMapping[i];
            break;
        }
          
        for(var j = 0; j < warps(input.drawdown); j++){
          switch(num_rots){
            case 0: 
              d.rowShuttleMapping[j] =  input.colShuttleMapping[j];
              d.rowSystemMapping[j] = input.colSystemMapping[j];
              break;
            case 1: 
              
              d.colShuttleMapping[(warps(input.drawdown) - 1) - j] =  input.colShuttleMapping[j];
              d.colSystemMapping[(warps(input.drawdown) - 1) - j] = input.colSystemMapping[j];

              break;
            case 2: 

              d.rowShuttleMapping[(warps(input.drawdown) - 1)  - j] =  input.colShuttleMapping[j];
              d.rowSystemMapping[(warps(input.drawdown) - 1)  - j] = input.colSystemMapping[j];
        
              break;

          }
        }
      }
    } else {
      for (var i = 0; i < wefts(d.drawdown); i++) {
        d.rowShuttleMapping[i] = input.rowShuttleMapping[i];
        d.rowSystemMapping[i] = input.rowSystemMapping[i];
      }
      for(var j = 0; j < warps(d.drawdown); j++){
        d.colShuttleMapping[j] = input.colShuttleMapping[j];
        d.colSystemMapping[j] = input.colSystemMapping[j];
      }
    }
    d.gen_name = formatName([input], "rot");
    return d;
  }
});

export const interlace = Merge.AllRequired({
  name: 'interlace',
  displayname: 'interlace',  
  old_names: [],
  dx: 'interlace the input drafts together in alternating lines',
  params: <Array<BoolParam>> [
    {name: 'repeat',
    type: 'boolean',
    falsestate: 'do not repeat inputs to match size',
    truestate: 'repeat inputs to match size',
    value: 1,
    dx: "controls if the inputs are interlaced in the exact format submitted (0) or repeated to fill evenly (1)"
  }],
  inlets: [
    {
      name: 'drafts', 
      type: 'static',
      value: null,
      dx: 'all the drafts you would like to interlace',
      num_drafts: -1
    },
    {
      name: 'warp system map', 
      type: 'static',
      value: null,
      dx: 'if you would like to specify the warp system or materials, you can do so by adding a draft here',
      num_drafts: 1
    }
  ],
  perform: (inputs: InletDrafts, params: Array<number>) => {
    const warp_system = inputs[1];
    const all_drafts = inputs[0];

    let warp_system_draft;
    if (warp_system.length == 0) warp_system_draft = initDraftWithParams({warps: 1, wefts: 1});
    else  warp_system_draft = warp_system[0];

    const factor_in_repeats = params[0];

    const d: Draft = utilInstance.interlace(all_drafts, factor_in_repeats, warp_system_draft);
  
    // format.transferSystemsAndShuttles(d, all_drafts,params, 'interlace');
    // d.gen_name = formatName(all_drafts, "ilace")
    return d;
  }     
});

export const selvedge = Merge.AllRequired({
  name: 'selvedge',
  old_names: [],
  displayname: 'selvedge',  
  dx: 'adds a selvedge of a user defined width (in ends) on both sides of the input draft. The second input functions as the selvedge pattern, and if none is selected, a selvedge is generated',
  params: <Array<NumParam>>[
    {name: 'width',
    type: 'number',
    min: 1,
    max: 100,
    value: 12,
    dx: "the width in warps of the selvedge"
    }
  ],
  inlets: [
    {
      name: 'draft',
      type: 'static',
      value: null,
      dx: "the draft that will have a selvedge added",
      num_drafts: 1
    },
    {
      name: 'selvedge',
      type: 'static',
      value: null,
      dx: "the pattern to use for the selvedge",
      num_drafts: 1
    }
  ],
  perform: (inputs: Array<Draft>, params: Array<number>)=> {

    const draft_input = inputs[0];
    const selvedge_input = inputs[1];

    if(selvedge_input === undefined) return draft_input;

    const num_systems = utilInstance.filterToUniqueValues(draft_input.rowSystemMapping).length;
    const height = 2 * num_systems;

    let pattern: Array<Array<Cell>> = [];

    if (selvedge_input !== undefined) {
      pattern = selvedge_input.drawdown;
    } else {
      for(let i = 0; i < height; i++){
        pattern.push([]);
        let alt: boolean =  i < num_systems;
        for (let j = 0; j < 2; j++) {
          pattern[i][j] = ((alt && j%2 ==0) || (!alt && j%2 ==1)) ? new Cell(true) : new Cell(false);
        }
      }
    }

    const input: Draft = inputs[0];
    const d: Draft = initDraftWithParams({warps: warps(input.drawdown) +params[0]*2, wefts: wefts(input.drawdown)});
        
    for (let i = 0; i < wefts(d.drawdown); i++) {
      for (let j = 0; j < warps(d.drawdown); j++) {
        if (j < params[0]) {
          //left selvedge
          d.drawdown[i][j].setHeddle(pattern[i%pattern.length][j%pattern[0].length].getHeddle());

        } else if (j < params[0]+warps(input.drawdown)) {
          //pattern
          d.drawdown[i][j].setHeddle(input.drawdown[i][j - params[0]].getHeddle());

        } else {
          //right selvedge
          d.drawdown[i][j].setHeddle(pattern[i%pattern.length][j%pattern[0].length].getHeddle());

        }
      }
    }
    // format.transferSystemsAndShuttles(d, inputs, params, 'first');
    d.gen_name = formatName(inputs, "sel");
    return d;
  }
});

export const overlay = Merge.AllRequired({
  name: 'overlay, (a,b) => (a OR b)',
  displayname: 'overlay, (a,b) => (a OR b)', 
  old_names:['overlay'], 
  dx: 'keeps any region that is marked as black/true in either draft',
  params: <Array<NumParam>>[
    {name: 'left offset',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: "the amount to offset b from the left"
    },
    {name: 'bottom offset',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: "the amount to offset the overlaying op_input.drafts from the bottom"
    }
  ],
  inlets: [{
    name: 'a', 
    type: 'static',
    value: null,
    dx: 'all the drafts you would like to overlay another onto',
    num_drafts: 1
  },
  {
    name: 'b', 
    type: 'static',
    value: null,
    dx: 'the draft you would like to overlay onto the base',
    num_drafts: 1
  }],
  perform: (inputs: Array<Draft>, params: Array<number>) => {
    const base = inputs[0];
    const top = inputs[1];

    if(top === undefined) return base;

    const alldrafts = [base, top];
    const inputs_divided = alldrafts.slice();
    const first: Draft = inputs_divided.shift();

    const outputs: Array<Draft> = [];


    let width: number = utilInstance.getMaxWarps(alldrafts) + params[0];
    let height: number = utilInstance.getMaxWefts(alldrafts) + params[1];
    if(warps(first.drawdown) > width) width = warps(first.drawdown);
    if(wefts(first.drawdown) > height) height = wefts(first.drawdown);

    //initialize the base container with the first draft at 0,0, unset for anythign wider
    const init_draft: Draft = initDraftWithParams({
      wefts: height, 
      warps: width, 
      colSystemMapping: first.colSystemMapping, 
      colShuttleMapping: first.colShuttleMapping,
      rowSystemMapping: first.rowSystemMapping,
      rowShuttleMapping: first.rowShuttleMapping
    });
      
    first.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
        init_draft.drawdown[i][j].setHeddle(cell.getHeddle());
      });
    });

    //now merge in all of the additional op_input.drafts offset by the op_input.drafts
    const d: Draft =inputs_divided.reduce((acc, input) => {
      input.drawdown.forEach((row, i) => {
        const adj_i: number = i+params[1];

        //if theinitDraftWithParams has only nulls on this row, set the value to the input value
        if(utilInstance.hasOnlyUnset(acc.drawdown[adj_i])){
          acc.rowSystemMapping[adj_i] = input.rowSystemMapping[i]
          acc.rowShuttleMapping[adj_i] = input.rowShuttleMapping[i]
        }
        row.forEach((cell, j) => {
          //if i or j is less than input params 
          const adj_j: number = j+params[0];
          acc.drawdown[adj_i][adj_j].setHeddle(utilInstance.computeFilter('or', cell.getHeddle(), acc.drawdown[adj_i][adj_j].getHeddle()));
        });
      });
      return acc;

    }, init_draft);

    // format.transferSystemsAndShuttles(d, inputs, params, 'first');
    d.gen_name = alldrafts.reduce((acc, el) => {
      return acc + "+"+getDraftName(el)
    }, "").substring(1);
    return d;
  }        
});

export const mask = Merge.AllRequired({
  name: 'mask, (a,b) => (a AND b)',
  displayname: 'mask, (a,b) => (a AND b)',
  old_names:['mask'],
  dx: 'only shows areas of the first draft in regions where the second draft has black/true cells',
  params: <Array<NumParam>>[
    {name: 'left offset',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: "the amount to offset the added op_input.drafts from the left"
    },
    {name: 'bottom offset',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: "the amount to offset the overlaying op_input.drafts from the bottom"
    }
  ],
  inlets: [{
    name: 'a', 
    type: 'static',
    value: null,
    dx: 'all the draft you would like to mask',
    num_drafts: 1
  },
  {
    name: 'b', 
    type: 'static',
    value: null,
    dx: 'the draft to use as the mask',
    num_drafts: 1
  }],
  perform: (inputs: Array<Draft>, params: Array<number>) => {
    const base = inputs[0];
    const top = inputs[1];

    if(top === undefined) return base;

    const first: Draft = inputs.shift();
    const outputs: Array<Draft> = [];

    let width: number = utilInstance.getMaxWarps(inputs) +params[0];
    let height: number = utilInstance.getMaxWefts(inputs) +params[1];
    if(warps(first.drawdown) > width) width = warps(first.drawdown);
    if(wefts(first.drawdown) > height) height = wefts(first.drawdown);

    //initialize the base container with the first draft at 0,0, unset for anythign wider
    const init_draft: Draft = initDraftWithParams({wefts: height, warps: width});
        
    first.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
        init_draft.drawdown[i][j].setHeddle(cell.getHeddle());
      });
    });

    //now merge in all of the additional op_input.drafts offset by theop_input.drafts
    const d: Draft = inputs.reduce((acc, input) => {
      input.drawdown.forEach((row, i) => {
        row.forEach((cell, j) => {
          //if i or j is less than input params 
          const adj_i: number = i+params[1];
          const adj_j: number = j+params[0];
          acc.drawdown[adj_i][adj_j].setHeddle(utilInstance.computeFilter('and', cell.getHeddle(), acc.drawdown[adj_i][adj_j].getHeddle()));
        });
      });
      return acc;

    }, init_draft);
    // format.transferSystemsAndShuttles(d, inputs, params, 'first');
    d.gen_name = formatName(inputs, "mask")
    return d;
  }        
});

export const atop = Merge.AllRequired({
  name: 'set atop, (a, b) => a',
  displayname: 'set atop, (a, b) => b', 
  old_names:['set atop'], 
  dx: 'sets cells of a on top of b, no matter the value of b',
  params: <Array<NumParam>>[
    {name: 'left offset',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: "the amount to offset the addedop_input.drafts from the left"
    },
    {name: 'bottom offset',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: "the amount to offset the overlayingop_input.drafts from the bottom"
    }
  ],
  inlets: [{
    name: 'a', 
    type: 'static',
    value: null,
    dx: 'all the drafts you would like to set another on top of',
    num_drafts: 1
  },
  {
    name: 'b', 
    type: 'static',
    value: null,
    dx: 'the draft you would like to set atop the base',
    num_drafts: 1
  }],
  perform: (inputs: Array<Draft>, params: Array<number>) => {
    const base = inputs[0];
    const top = inputs[1];

    if(top === undefined) return base;

    const first: Draft = inputs.shift();

    const outputs: Array<Draft> = [];


    let width: number = utilInstance.getMaxWarps(inputs) +params[0];
    let height: number = utilInstance.getMaxWefts(inputs) +params[1];
    if (warps(first.drawdown) > width) width = warps(first.drawdown);
    if (wefts(first.drawdown) > height) height = wefts(first.drawdown);

    //initialize the base container with the first draft at 0,0, unset for anythign wider
    const init_draft: Draft = initDraftWithParams({wefts: height, warps: width});
      
    first.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
        init_draft.drawdown[i][j].setHeddle(cell.getHeddle());
      });
    });

    //now merge in all of the additionalop_input.drafts offset by theop_input.drafts
    const d: Draft = inputs.reduce((acc, input) => {
      input.drawdown.forEach((row, i) => {
        row.forEach((cell, j) => {
          //if i or j is less than input params 
          const adj_i: number = i+params[1];
          const adj_j: number = j+params[0];
          acc.drawdown[adj_i][adj_j].setHeddle(utilInstance.computeFilter('up', cell.getHeddle(), acc.drawdown[adj_i][adj_j].getHeddle()));
        });
      });
      return acc;

    }, init_draft);
    // format.transferSystemsAndShuttles(d, inputs, params, 'first');
    d.gen_name = formatName(inputs, "atop")
    return d;
  }        
});

export const knockout = Merge.AllRequired({
  name: 'knockout, (a, b) => (a XOR b)',
  displayname: 'knockout, (a, b) => (a XOR b)', 
  old_names: ['knockout'], 
  dx: 'Flips the value of overlapping cells of the same value, effectively knocking out the image of the second draft upon the first',
  params: <Array<NumParam>>[
    {name: 'left offset',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: "the amount to offset the addedop_input.drafts from the left"
    },
    {name: 'bottom offset',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: "the amount to offset the overlayingop_input.drafts from the bottom"
    }
  ],
  inlets: [{
    name: 'a', 
    type: 'static',
    value: null,
    dx: 'all the drafts you would like to xor another onto',
    num_drafts: 1
  },
  {
    name: 'b', 
    type: 'static',
    value: null,
    dx: 'the draft you would like to xor over the base',
    num_drafts: 1
  }],
  perform: (inputs: Array<Draft>, params: Array<number>) => {
    const base = inputs[0];
    const top = inputs[1];

    if(top === undefined) return base;

    const first: Draft =inputs.shift();

    let width: number = utilInstance.getMaxWarps(inputs) +params[0];
    let height: number = utilInstance.getMaxWefts(inputs) +params[1];
    if (warps(first.drawdown) > width) width = warps(first.drawdown);
    if (wefts(first.drawdown) > height) height = wefts(first.drawdown);

    //initialize the base container with the first draft at 0,0, unset for anythign wider
    const init_draft: Draft = initDraftWithParams({wefts: height, warps: width});
        
    first.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
        init_draft.drawdown[i][j].setHeddle(cell.getHeddle());
      });
    });

    // now merge in all of the additional op_input.drafts offset by theop_input.drafts

    const d: Draft = inputs.reduce((acc, input) => {
      input.drawdown.forEach((row, i) => {
        row.forEach((cell, j) => {
          //if i or j is less than input params 
          const adj_i: number = i+params[1];
          const adj_j: number = j+params[0];
          acc.drawdown[adj_i][adj_j].setHeddle(utilInstance.computeFilter('neq', cell.getHeddle(), acc.drawdown[adj_i][adj_j].getHeddle()));
        });
      });
      return acc;

    }, init_draft);
    // format.transferSystemsAndShuttles(d,inputs,params, 'first');
    d.gen_name = formatName(inputs, "ko");
    return d;
  }        
});

export const fill = Merge.NoParams({
  name: 'fill',
  displayname: 'fill',
  old_names:[],
  dx: 'fills black cells of the first input with the pattern specified by the second input, white cells with third input',
  inlets: [{
    name: 'pattern', 
    type: 'static',
    value: null,
    dx: 'the draft you would like to fill',
    num_drafts: 1
  },
  {
    name: 'black cell structure', 
    type: 'static',
    value: null,
    dx: 'the structure you would like to repeat in in the black regions of the base draft',
    num_drafts: 1
  },
  {
    name: 'white cell structure', 
    type: 'static',
    value: null,
    dx: 'the structure you would like to repeat in in the white regions of the base draft',
    num_drafts: 1
  }],
  perform: (inputs: Array<Draft>) => {
    const base = inputs[0];
    const black = inputs[1];
    const white = inputs[2];

    if (!black && !white) return base;

    const alldrafts = [base, black, white];

    const d = initDraftWithParams ({ 
      warps: warps(alldrafts[0].drawdown), 
      wefts:wefts(alldrafts[0].drawdown), 
      pattern:alldrafts[0].drawdown,
      rowShuttleMapping:alldrafts[0].rowShuttleMapping,
      colShuttleMapping:alldrafts[0].colSystemMapping,
      rowSystemMapping:alldrafts[0].rowSystemMapping,
      colSystemMapping:alldrafts[0].colSystemMapping
    });

    for(let i = 0; i < wefts(d.drawdown); i++){
      for(let j = 0; j < warps(d.drawdown); j++){
        const val = d.drawdown[i][j].getHeddle();
        if(val !== null){
          if(val && black !== undefined){
            const adj_i = i%wefts(alldrafts[1].drawdown);
            const adj_j = j%warps(alldrafts[1].drawdown);
            d.drawdown[i][j].setHeddle(alldrafts[1].drawdown[adj_i][adj_j].getHeddle())
          } else if (!val && white !== undefined){
            const adj_i = i%wefts(alldrafts[2].drawdown);
            const adj_j = j%warps(alldrafts[2].drawdown);
            d.drawdown[i][j].setHeddle(alldrafts[2].drawdown[adj_i][adj_j].getHeddle())
          }
        }
      }
    }    
    return d;
  }        
});

export const stretch = Pipe.AllRequired({
  name: 'stretch',
  displayname: 'stretch',
  old_names:[],
  dx: 'repeats each warp and/or weft by theop_input.drafts',
  params: <Array<NumParam>>[
    {name: 'warp repeats',
    type: 'number',
    min: 1,
    max: 100,
    value: 1,
    dx: 'number of times to repeat each warp'
    },
    {name: 'weft repeats',
    type: 'number',
    min: 1,
    max: 100,
    value: 2,
    dx: 'number of weft overs in a pic'
    }
  ],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to stretch',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<number>) => {
    const d: Draft = initDraftWithParams({warps: params[0]*warps(input.drawdown), wefts:params[1]*wefts(input.drawdown)});
    input.drawdown.forEach((row, i) => {
      for (let p = 0; p < params[1]; p++) {
        let i_ndx = params[1] * i + p;
        row.forEach((cell, j) => {
          for (let r = 0; r < params[0]; r++) {
            let j_ndx =params[0] * j + r;
            d.drawdown[i_ndx][j_ndx].setHeddle(cell.getHeddle());
          }
        });
      }
    });
    // format.transferSystemsAndShuttles(d,[input], params, 'stretch');
    d.gen_name = formatName([input], "stretch")
    return d; 
  }
});

export const resize = Pipe.AllRequired({
  name: 'resize',
  displayname: 'resize',
  old_names:[],
  dx: 'stretches or squishes the draft to fit the boundary',
  params: <Array<NumParam>>[
    {name: 'warps',
    type: 'number',
    min: 1,
    max: 10000,
    value: 2,
    dx: 'number of warps to resize to'
    },
    {name: 'weft repeats',
    type: 'number',
    min: 1,
    max: 10000,
    value: 2,
    dx: 'number of wefts to resize to'
    }
  ],
  // (input: Draft, params: Array<number>) => {
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to resize',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<number>) => {
    const weft_factor = params[1] / wefts(input.drawdown);
    const warp_factor = params[0] / warps(input.drawdown);

    const d: Draft = initDraftWithParams({warps:params[0], wefts:params[1]});
    d.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
        const mapped_cell: Cell = input.drawdown[Math.floor(i/weft_factor)][Math.floor(j/warp_factor)];
        d.drawdown[i][j].setHeddle(mapped_cell.getHeddle());
      });
    });
    // format.transferSystemsAndShuttles(d,[input],params, 'stretch');
    d.gen_name = formatName([input], "resize")
    return d;
  }
});

export const margin = Merge.AllRequired({
  name: 'margin',
  displayname: 'add margins',
  old_names: [],
  dx: 'adds margins of unset cells, or a user defined draft, to the top, right, bottom, left of the draft',
  params: <Array<NumParam>>[
    {name: 'starting pics',
    min: 0,
    max: 10000,
    value: 12,
    type: 'number',
    dx: 'number of pics to add to the bottom of the draft'
    },
    {name: 'ending pics',
    min: 0,
    max: 10000,
    value: 12,
    type: 'number',
    dx: 'number of pics to add to the end of the draft'
    },
    {name: 'starting ends',
    min: 0,
    max: 10000,
    value: 12,
    type: 'number',
    dx: 'number of ends of padding to the start of the draft'
    },
    {name: 'ending ends',
    min: 0,
    max: 10000,
    value: 12,
    type: 'number',
    dx: 'number of ends to add to the end of the draft'
    }
  ],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to add margins to',
    num_drafts: 1
  },
  {
    name: 'margin', 
    type: 'static',
    value: null,
    dx: 'the draft to repeat within the margins',
    num_drafts: 1
  }],
  perform: (inputs: Array<Draft>, params: Array<number>) => {
    let main_draft: Draft = null;

    if(inputs[0] === undefined) main_draft = initDraftWithParams({wefts: 0, warps: 0, pattern: [[new Cell(null)]]});
    else main_draft = inputs[0];

    const margin_input = inputs[1];
    let margin_draft: Draft = null;

    if(margin_input === undefined) margin_draft = initDraftWithParams({wefts: 1, warps: 1, pattern: [[new Cell(null)]]});
    else margin_draft = inputs[1];

    const new_warps =params[2] +params[3] + warps(inputs[0].drawdown);
    const new_wefts =params[0] +params[1] + wefts(inputs[0].drawdown);

    const d: Draft =initDraftWithParams({warps: new_warps, wefts: new_wefts, pattern: margin_input.drawdown});


    inputs[0].drawdown.forEach((row, i) => {
        d.rowShuttleMapping[i+params[0]] = d.rowShuttleMapping[i];
        d.rowSystemMapping[i+params[0]] = d.rowSystemMapping[i];
        row.forEach((cell, j) => {
          d.drawdown[i+params[0]][j+params[3]].setHeddle(cell.getHeddle());
          d.colShuttleMapping[j+params[3]] = d.colShuttleMapping[j];
          d.colSystemMapping[j+params[3]] = d.colSystemMapping[j];
        });
        
    });
    d.gen_name = formatName(inputs, "margin");
    return d;
  }
});

export const crop = Pipe.AllRequired({
  name: 'crop',
  displayname: 'crop',
  old_names: [],
  dx: 'crops to a region of the input draft. The crop size and placement is given by the parameters',
  params: <Array<NumParam>>[
    {name: 'left',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: 'number of pics from the left to start the cut'
    },
    {name: 'bottom',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: 'number of pics from the bottom to start the cut'
    },
    {name: 'width',
    type: 'number',
    min: 1,
    max: 10000,
    value: 10,
    dx: 'total width of cut'
    },
    {name: 'height',
    type: 'number',
    min: 1,
    max: 10000,
    value: 10,
    dx: 'height of the cutting box'
    }
  ],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to crop',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<number>) => {
    const new_warps = params[2];
    const new_wefts = params[3];

    const d: Draft = initDraftWithParams({warps: new_warps, wefts: new_wefts});

    //unset all cells to default
    d.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {

        if((i+params[1] >= input.drawdown.length) || (j+params[0] >= input.drawdown[0].length)) cell.setHeddle(null);
        else cell.setHeddle(input.drawdown[i+params[1]][j+params[0]].getHeddle());
        
      });
    });
    // format.transferSystemsAndShuttles(d,[input],params, 'first');
    d.gen_name = formatName([input], "crop");
    return d;
  } 
});

export const trim = Pipe.AllRequired({
  name: 'trim',
  displayname: 'trim',
  old_names: [],
  dx: 'trims off the edges of an input draft',
  params: <Array<NumParam>>[
    {name: 'left',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: 'number of warps from the left to start the cut'
    },
    { name: 'top',
      type: 'number',
      min: 0,
      max: 10000,
      value: 0,
      dx: 'number of pics from the top to start the cut'
    },
    { name: 'right',
      type: 'number',
      min: 0,
      max: 10000,
      value: 0,
      dx: 'number of warps from the right to start the cut'
    },
    { name: 'bottom',
      type: 'number',
      min: 0,
      max: 10000,
      value: 0,
      dx: 'number of pics from the bottom to start the cut'
    }
  ],
  // perform: (input: Draft, params: Array<number>) => {
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to trim',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<number>) => {
    const left = params[0];
    const top = params[3];
    const right = params[2];
    const bottom = params[1];
    
    let new_warps = warps(input.drawdown) - right - left;
    if(new_warps < 0) new_warps = 0;

    let new_wefts = wefts(input.drawdown) - top - bottom;
    if(new_wefts < 0) new_wefts = 0;

    const d: Draft = initDraftWithParams({warps: new_warps, wefts: new_wefts});

    d.drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
        cell.setHeddle(input.drawdown[i+top][j+left].getHeddle());                             
      });
    });
    // format.transferSystemsAndShuttles(d,[input],params, 'first');
    d.gen_name = formatName([input], "trim");
    return d;
  }     
});

export const apply_mats = Merge.NoParams({
  name: 'apply materials',
  displayname: 'apply materials',  
  old_names:[],    
  dx: "applies the materials from the second draft onto the first draft. If they are uneven sizes, it will repeat the materials as a pattern",
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to which you would like to apply materials',
    num_drafts: 1 },
    {
    name: 'materials', 
    type: 'static',
    value: null,
    dx: 'a draft which has the materials youd like to apply',
    num_drafts: 1
    }
  ],
  perform: (inputs: Array<Draft>) => {
    // const parent_input = op_inputs.find(el => el.op_name == 'apply materials');
    // const child_input = op_inputs.find(el => el.op_name == 'child');
    // const materials = inputs[1];
    // const inputdraft = inputs[0];

    // if (child_input === undefined) return Promise.resolve([]);
    // if (materials === undefined) return Promise.resolve([inputs[0]])
    // if (inputdraft === undefined) return Promise.resolve([materials.drafts[0]])
    const d: Draft = initDraftWithParams({
      warps:warps(inputs[0].drawdown), 
      wefts:wefts(inputs[0].drawdown),
      rowShuttleMapping: inputs[1].rowShuttleMapping,
      rowSystemMapping: inputs[0].rowSystemMapping,
      colShuttleMapping: inputs[1].colShuttleMapping,
      colSystemMapping: inputs[0].colSystemMapping,
    });
    inputs[0].drawdown.forEach((row, i) => {
      row.forEach((cell, j) => {
        d.drawdown[i][j] = new Cell(cell.getHeddle());
      });
    });
    d.gen_name = formatName(inputs, 'materials')
    return d;
  }        
});

export const makesymmetric = Pipe.AllRequired({
  name: 'makesymmetric',
  old_names: [],
  displayname: 'make symmetric',
  dx: 'rotates the draft around a corner, creating rotational symmetry around the selected point',
  params: [
    <SelectParam> {name: 'corner',
    type: 'select',
    selectlist: [
      {name: 'top left corner', value: 0},
      {name: 'top right corner', value: 1},
      {name: 'bottom right corner', value: 2},
      {name: 'bottom left corner', value: 3}
    ],
    value: 0,
    dx: 'corner to which this draft is rotated around 0 is top left, 1 top right, 2 bottom right, 3 bottom left'
    },
    <BoolParam>{name: 'remove center repeat',
    type: 'boolean',
    falsestate: "center repeat kept",
    truestate: "center repeat removed",
    value: 0,
    dx: 'rotating drafts creates a repeated set of columns or rows extending from the center. Use this toggle to alternative the structure by either keeping or erasing those repeated cells'
    }

  ],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to make symmetric',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<ParamValue>) => {
    const corner = params[0];
    const even = params[1] === 0;

    const d = input;
    
    const pattern: Array<Array<Cell>> = [];

    let use_i = 0;
    let use_j = 0;

    let weft_num = wefts(d.drawdown) * 2;
    let warp_num = warps(d.drawdown) * 2;

    for(let i =0; i < weft_num; i++){
      pattern.push([]);
      for(let j = 0; j < warp_num; j++){
        switch(corner){
          case 0:
            use_i = (i >= wefts(d.drawdown)) ? wefts(d.drawdown) - (i - wefts(d.drawdown))-1: i;
            use_j = (j >= warps(d.drawdown)) ? j - warps(d.drawdown) : warps(d.drawdown)-1 - j; 
          break;

          case 1:
            use_i = (i >= wefts(d.drawdown)) ? wefts(d.drawdown) - (i - wefts(d.drawdown))-1: i;
            use_j = (j >= warps(d.drawdown)) ? warps(d.drawdown) - (j - warps(d.drawdown))-1  : j; 
          break;
          

          case 2:
            use_i = (i >= wefts(d.drawdown)) ? i - wefts(d.drawdown) : wefts(d.drawdown)-1 - i;
            use_j = (j >= warps(d.drawdown)) ? warps(d.drawdown) - (j - warps(d.drawdown))-1  : j; 
          break;

          case 3:
            use_i = (i >= wefts(d.drawdown)) ? i - wefts(d.drawdown) : wefts(d.drawdown)-1 - i;
            use_j = (j >= warps(d.drawdown)) ? j - warps(d.drawdown) : warps(d.drawdown)-1 - j; 
          break;              
        }
        
        const value: boolean = d.drawdown[use_i][use_j].getHeddle();
        pattern[i].push(new Cell(value));
      }
    }

    let usepattern; 
    //delete one of the central rows
    if(!even){
      const deletedweft = pattern.filter((el, i) => i !== wefts(d.drawdown));
      usepattern = deletedweft.map(row => row.filter((el, j) => j !== warps(d.drawdown)));
    }else{
      usepattern = pattern;
    }
  
    const draft: Draft = initDraftWithParams({warps: usepattern[0].length, wefts: usepattern.length, pattern: usepattern});
    draft.gen_name = formatName([input], "4-way");
    return draft;

  }        
});

export const invert = Pipe.NoParams({
  name: 'invert',
  displayname: 'invert',
  old_names:[],
  dx: 'generates an output that is the inverse or backside of the input',
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to invert',
    num_drafts: 1
  }],
  perform: (input: Draft) => {
    let d: Draft = initDraftWithParams({
      warps: warps(input.drawdown), 
      wefts: wefts(input.drawdown), 
      pattern: input.drawdown});
    d.drawdown = invertDrawdown(d.drawdown);
    // format.transferSystemsAndShuttles(d, [input], {}, 'first');
    d.gen_name = formatName([input], "invert");
    return d;
  }
});

export const flipx = Pipe.NoParams({
  name: 'flip horiz',
  displayname: 'flip horiz',
  old_names:[],
  dx: 'generates an output that is the left-right mirror of the input',
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to flip horizontally',
    num_drafts: 1
  }],
  perform: (input: Draft) => {
    let d: Draft = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
    d.drawdown = flipDrawdown(d.drawdown, true);
    // format.transferSystemsAndShuttles(d,[input], {}, 'first');
    d.gen_name = formatName([input], "fhoriz");
    return d;
  }
});

export const flipy = Pipe.NoParams({
  name: 'flip vert',
  displayname: 'flip vert',
  old_names:[],
  dx: 'generates an output that is the top-bottom mirror of the input',
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to flip vertically',
    num_drafts: 1
  }],
  perform: (input: Draft)=> {
    const d: Draft =initDraftWithParams({
      warps: warps(input.drawdown), 
      wefts: wefts(input.drawdown), 
      pattern: input.drawdown
    });
    d.drawdown = flipDrawdown(d.drawdown, false);
    // format.transferSystemsAndShuttles(d,[input], {}, 'first');
    d.gen_name = formatName([input], "fvert");
    return d;
  }
});

export const shiftx = Pipe.AllRequired({
  name: 'shift left',
  displayname: 'shift left',
  old_names:[],
  dx: 'generates an output that is shifted left by the number of warps specified in theop_input.drafts',
  params: <Array<NumParam>>[
    {name: 'amount',
    type: 'number',
    min: 1,
    max: 100,
    value: 1,
    dx: 'the amount of warps to shift by'
    }
  ],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to shift',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<number>) => {
    const d: Draft = initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
    d.drawdown = shiftDrawdown(d.drawdown, false, params[0]);
    // format.transferSystemsAndShuttles(d, [input], params, 'first');
    d.gen_name = formatName([input], "shiftx");
  
    return d;
  }
});

export const shifty = Pipe.AllRequired({
  name: 'shift up',
  displayname: 'shift up',
  old_names:[],
  dx: 'generates an output that is shifted up by the number of wefts specified in theop_input.drafts',
  params: <Array<NumParam>>[
    {name: 'amount',
    type: 'number',
    min: 1,
    max: 100,
    value: 1,
    dx: 'the number of wefts to shift by'
    }
  ],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to shift',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<number>) => {
    const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown), pattern: input.drawdown});
    d.drawdown = shiftDrawdown(d.drawdown, true, params[0]);
    // format.transferSystemsAndShuttles(d,[input],params, 'first');
    d.gen_name = formatName([input], "shifty");
  
    return d;
  }
});

export const slope = Pipe.AllRequired({
  name: 'slope',
  displayname: 'slope',
  old_names:[],
  dx: 'offsets every nth row by the vaule given in col',
  params: <Array<NumParam>>[
    {name: 'col shift',
    type: 'number',
    min: -100,
    max: 100,
    value: 1,
    dx: 'the amount to shift rows by'
    },
    {
    name: 'row shift (n)',
    type: 'number',
    min: 0,
    max: 100,
    value: 1,
    dx: 'describes how many rows we should apply the shift to'
    }
  ],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to slope',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<number>) => {
    const d: Draft =initDraftWithParams({warps: warps(input.drawdown), wefts: wefts(input.drawdown)});
    for(let i = 0; i < wefts(d.drawdown); i++){
      let i_shift: number = (params[1] === 0) ? 0 : Math.floor(i/params[1]);
      for(let j = 0; j <warps(d.drawdown); j++){
        let j_shift: number =params[0]*-1;
        let shift_total = (i_shift * j_shift)%warps(d.drawdown);
        if(shift_total < 0) shift_total += warps(d.drawdown);
        d.drawdown[i][j].setHeddle(input.drawdown[i][(j+shift_total)%warps(d.drawdown)].getHeddle());
      }
    }
    // format.transferSystemsAndShuttles(d,[input],params, 'first');
    d.gen_name = formatName([input], "slope");
    return d;
  }
});

export const replicate = Branch.AllRequired({
  name: 'mirror',
  displayname: 'mirror',
  old_names: [],
  dx: 'generates an linked copy of the input draft, changes to the input draft will then populate on the replicated draft',
  params: <Array<NumParam>> [{
    name: 'copies',
    type: 'number',
    min: 1,
    max: 100,
    value: 1,
    dx: 'the number of mirrors to produce'
  }],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to mirror',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<number>) => {
    let outputs: Array<Draft> = [];
    for(let i = 0; i < params[0]; i++){
      let d: Draft = initDraftWithParams({
          warps: warps(input.drawdown), 
          wefts: wefts(input.drawdown), 
          pattern: input.drawdown,
          rowShuttleMapping: input.rowShuttleMapping,
          rowSystemMapping: input.rowSystemMapping,
          colShuttleMapping: input.colShuttleMapping,
          colSystemMapping: input.colSystemMapping
      });
      d.gen_name = formatName([input], "mirror");
      outputs.push(d);
    }
    return outputs;
  }
});

export const variants = Branch.NoParams({
  name: 'variants',
  displayname: 'variants',
  old_names:[],
  dx: 'for any input draft, create the shifted and flipped values as well',
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to create varients of',
    num_drafts: 1
  }], 
  perform: (input: Draft) => {
    const functions: Array<Draft> = [
      flipx.perform(input),
      invert.perform(input)
    ];

    for (let i = 1; i < warps(input.drawdown); i += 2) {
      functions.push(shiftx.perform(input, [i]));
    }

    for (let i = 1; i < wefts(input.drawdown); i += 2) {
      functions.push(shifty.perform(input, [i]));
    }
    return functions;
  }
});

export const bindweftfloats = Pipe.AllRequired({
  name: 'bind weft floats',
  displayname: 'bind weft floats',
  old_names: [],
  dx: 'adds interlacements to weft floats over the user specified length',
  params: <Array<NumParam>>[
    {name: 'length',
    type: 'number',
    min: 1,
    max: 100,
    value: 10,
    dx: 'the maximum length of a weft float'
  }],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to bind',
    num_drafts: 1
  }],
  perform: (input: Draft, params: Array<number>) => {
    const d: Draft = initDraftWithParams({
      warps: warps(input.drawdown), 
      wefts: wefts(input.drawdown), 
      pattern: input.drawdown
    });
    let float: number = 0;
    let last: boolean = false;
    d.drawdown.forEach(row => {
      float = 0;
      last = null;
      row.forEach(c => {
        if(c.getHeddle == null) float = 0;
        if(last != null && c.getHeddle() == last) float++;

        if (float >= params[0]) {
          c.toggleHeddle();
          float = 0;
        }
        last = c.getHeddle();
      });
    });
  
    // format.transferSystemsAndShuttles(d, [input], params, 'first');
    d.gen_name = formatName([input], "bindweft");
    return d;
  }
});

export const bindwarpfloats = Pipe.AllRequired({
  name: 'bind warp floats',
  displayname: 'bind warp floats',
  old_names: [],
  dx: 'adds interlacements to warp floats over the user specified length',
  params: <Array<NumParam>> [
    {name: 'length',
    type: 'number',
    min: 1,
    max: 100,
    value: 10,
    dx: 'the maximum length of a warp float'
    }
  ],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to bind',
    num_drafts: 1
  }], 
  perform: (input: Draft, params: Array<number>) => {
    const d: Draft = initDraftWithParams({
      warps: warps(input.drawdown), 
      wefts: wefts(input.drawdown), 
      pattern: input.drawdown
    });

    let float: number = 0;
    let last: boolean = false;

    for (let j = 0; j < warps(d.drawdown); j++) {
      const col: Array<Cell> = d.drawdown.map(row => row[j]);
      float = 0;
      last = null;
      col.forEach(c => {
        if (c.getHeddle == null) float = 0;
        if (last != null && c.getHeddle() == last) float++;

        if (float >= params[0]){
          c.toggleHeddle();
          float = 0;
        }
        last = c.getHeddle();
      });
    }
    return d;
  }
});

export const layer = Merge.NoParams({
  name: 'layer',
  displayname: 'layer',
  old_names: [],
  dx: 'creates a draft in which each input is assigned to a layer in a multilayered structure, assigns 1 to top layer and so on',
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the drafts to layer (from top to bottom)',
    num_drafts: -1
  }],
  perform: (inputs: Array<Draft>) => {
    const layers = inputs.length;

    const all_wefts = inputs.map(el => wefts(el.drawdown)).filter(el => el > 0);
    const total_wefts = utilInstance.lcm(all_wefts);
  
    const all_warps = inputs.map(el => warps(el.drawdown)).filter(el => el > 0);
    const total_warps = utilInstance.lcm(all_warps);
  
    const d: Draft = initDraftWithParams({warps: total_warps*layers, wefts: total_wefts*layers});
    for (let i = 0; i < wefts(d.drawdown); i++) {
      const select_array = i % layers;
      const adj_i = (Math.floor(i/layers)) % wefts(inputs[select_array].drawdown);
      for(let j = 0; j < warps(d.drawdown); j++){
        const adj_j = (Math.floor(j/layers)) % warps(inputs[select_array].drawdown);
        if(select_array === j % layers){
          d.drawdown[i][j] = new Cell (inputs[select_array].drawdown[adj_i][adj_j].getHeddle());
        } else {
          const val = (j % layers < select_array) ? true : false;
          d.drawdown[i][j] = new Cell(val);
        }
      }
    }
  
    // format.transferSystemsAndShuttles(d, inputs, {}, 'layer');
    d.gen_name = formatName(inputs, "layer");
    return d;
  }     
});

export const tile = Merge.AllRequired({
  name: 'tile',
  displayname: 'tile',
  dx: 'repeats one or more input drafts along the warp and weft',
  old_names: [],
  params: <Array<NumParam>> [
    {name: 'warp-repeats',
    type: 'number',
    min: 1,
    max: 100,
    value: 2,
    dx: 'the number of times to repeat this time across the width'
    },
    {name: 'weft-repeats',
    type: 'number',
    min: 1,
    max: 100,
    value: 2,
    dx: 'the number of times to repeat this time across the length'
    }
  ],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the drafts to tile',
    num_drafts: -1
  }],
  perform: (inputs: Array<Draft>, params: Array<number>) => {
    const all_drafts = inputs;

    const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
    const total_warps = utilInstance.lcm(all_warps);

    const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
    const total_wefts = utilInstance.lcm(all_wefts);
    const num_inputs = all_drafts.length;

    const warp_repeats = params[0];
    const weft_repeats = params[1];

    const draft_indexing: Array<Array<number>> = [];
    let ndx = 0;
    for (let i = 0; i < weft_repeats; i++) {
      draft_indexing.push([]);
      for(let j = 0; j < warp_repeats; j++){
        draft_indexing[i].push(ndx);
        ndx = (ndx + 1 ) % num_inputs;
      }
    }

    const width: number = warp_repeats*total_warps;
    const height: number = weft_repeats*total_wefts;
    const output: Draft = initDraftWithParams({warps: width, wefts: height});

    output.drawdown.forEach((row, i) => {
      let draft_index_row  = Math.floor(i / total_wefts);
      let within_draft_row = i % total_wefts;
      row.forEach((cell, j) => {
        let draft_index_col  = Math.floor(j / total_warps);
        let within_draft_col  = j % total_warps;
        const select_draft_id = draft_indexing[draft_index_row][draft_index_col];

        const draft = all_drafts[select_draft_id];
        const w = warps(draft.drawdown);
        const h = wefts(draft.drawdown);
        cell.setHeddle(draft.drawdown[within_draft_row%w][within_draft_col%h].getHeddle()); 
      });
    });
    
    // format.transferSystemsAndShuttles(output, all_drafts, params, 'first');
    output.gen_name = formatName(all_drafts, "tile");
  
    return output;
  }   
});

export const chaos = Merge.AllRequired({
    name: 'chaos',
    displayname: 'chaos sequence',
    dx: 'tiles the input drafts, randomly selecting which draft to place at which position',
    old_names: [],
    params: <Array<NumParam>> [
      {name: 'warp-repeats',
      type: 'number',
      min: 1,
      max: 100,
      value: 2,
      dx: 'the number of times to repeat this time across the width'
      },
      {name: 'weft-repeats',
      type: 'number',
      min: 1,
      max: 100,
      value: 2,
      dx: 'the number of times to repeat this time across the length'
      }
    ],
    inlets: [{
      name: 'draft', 
      type: 'static',
      value: null,
      dx: 'the draft to tile in the chaos sequence',
      num_drafts: -1
    }],
    perform: (inputs: Array<Draft>, params: Array<number>) => {
      const all_drafts = inputs;

      const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
      const total_warps = utilInstance.lcm(all_warps);

      const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
      const total_wefts = utilInstance.lcm(all_wefts);
      const num_inputs = all_drafts.length;

      const warp_repeats = params[0];
      const weft_repeats = params[1];

      // generate a randomized array of the drafts to tile, flipping chaotically
      const draft_indexing: Array<Array<Draft>> = [];
      let ndx = Math.floor(Math.random()*num_inputs);
      for (let i = 0; i < weft_repeats; i++) {
        draft_indexing.push([]);
        for(let j = 0; j < warp_repeats; j++){
          let d = all_drafts[ndx];
          const x_flip = (Math.random() < 0.5) ? false: true; 
          const y_flip = (Math.random() < 0.5) ? false: true; 
          
          if (x_flip) d = flipx.perform(d);
          if (y_flip) d = flipy.perform(d);

          draft_indexing[i].push(d);
          ndx = Math.floor(Math.random()*num_inputs);
        }
      }

      const width: number = warp_repeats*total_warps;
      const height: number = weft_repeats*total_wefts;
      const output: Draft = initDraftWithParams({warps: width, wefts: height});

      output.drawdown.forEach((row, i) => {
        let draft_index_row  = Math.floor(i / total_wefts);
        let within_draft_row = i % total_wefts;
        row.forEach((cell, j) => {
          let draft_index_col  = Math.floor(j / total_warps);
          let within_draft_col  = j % total_warps;

          const draft = draft_indexing[draft_index_row][draft_index_col];

          const w = warps(draft.drawdown);
          const h = wefts(draft.drawdown);
          cell.setHeddle(draft.drawdown[within_draft_row%w][within_draft_col%h].getHeddle()); 

        });
      });
      

      // format.transferSystemsAndShuttles(output, all_drafts, params, 'first');
      output.gen_name = formatName(all_drafts, "chaos");
    
      return output;  
    }
});

export const erase_blank = Pipe.NoParams({
  name: 'erase blank rows',
  displayname: 'erase blank rows',
  old_names:[],
  dx: 'erases any rows that are entirely unset',
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to erase blank rows from',
    num_drafts: 1
  }],
  perform: (input: Draft) => {
    const rows_out =input.drawdown.reduce((acc, el, ndx) => {
      if(!utilInstance.hasOnlyUnset(el)) acc++;
      return acc;
    }, 0);

    const out = initDraftWithParams({
      wefts: rows_out, warps: warps(input.drawdown), 
      colShuttleMapping:input.colShuttleMapping, 
      colSystemMapping:input.colSystemMapping
    });

    let ndx = 0;
    input.drawdown.forEach((row, i) => {
      if(!utilInstance.hasOnlyUnset(row)){
        row.forEach((cell, j) => {
          out.drawdown[ndx][j].setHeddle(cell.getHeddle()); 
        });
        out.rowShuttleMapping[ndx] = input.rowShuttleMapping[i];
        out.rowSystemMapping[ndx] = input.rowSystemMapping[i];
        out.rowShuttleMapping[ndx] =input.rowShuttleMapping[i];
        out.rowSystemMapping[ndx] =input.rowSystemMapping[i];
        ndx++;
      }
    })
    return out;        
  }
});

export const jointop = Merge.AllRequired({
  name: 'join top',
  displayname: 'join top',
  old_names:[],
  dx: 'attachesop_input.drafts toether into one draft in a column orientation',
  params: [ 
    <BoolParam>{name: 'repeat',
    type: 'boolean',
    falsestate: 'do not repeat inputs to match size',
    truestate: 'repeat inputs to match size',
    value: 1,
    dx: "controls if the inputs are repeated along the width so they repeat in even intervals"
  }],
  inlets: [{
    name: 'drafts', 
    type: 'static',
    value: null,
    dx: 'the drafts you would like to join vertically',
    num_drafts: -1
  },
  {
    name: 'warp pattern', 
    type: 'static',
    value: null,
    dx: 'optional, define a custom warp material or system pattern here',
    num_drafts: -1
  }],
  perform: (inputs: InletDrafts, params: Array<number>) => {
    const drafts_in = inputs[0];
    const warp_system = inputs[1][0];
    const factor_in_repeats = params[0];
    
    let warp_mapping;
    if(warp_system === undefined) warp_mapping = initDraftWithParams({warps: 1, wefts:1});
    else warp_mapping = warp_system;

    const all_drafts = drafts_in;

    const total_wefts: number = all_drafts.reduce((acc, input)=>{
        return acc + wefts(input.drawdown);
    }, 0);

    let total_warps: number = 0;
    const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
    if (factor_in_repeats === 1) total_warps = utilInstance.lcm(all_warps);
    else  total_warps = utilInstance.getMaxWarps(all_drafts);

    const d: Draft = initDraftWithParams({
      warps: total_warps, 
      wefts: total_wefts,
      colSystemMapping: warp_mapping.colSystemMapping,
      colShuttleMapping: warp_mapping.colShuttleMapping
    });

    let i = 0;
    all_drafts.forEach((input) => {

      input.drawdown.forEach((row, row_ndx) => {
        for(let j = 0; j < total_warps; j++){
          const adj_j = j % warps(input.drawdown); 
          const repeats = Math.floor(j / warps(input.drawdown));
          d.rowShuttleMapping[i] = input.rowShuttleMapping[row_ndx];
          d.rowSystemMapping[i] = input.rowSystemMapping[row_ndx];
          if (factor_in_repeats) {
            d.drawdown[i][j] = new Cell(input.drawdown[row_ndx][adj_j].getHeddle());
          } else {
            if(repeats == 0) d.drawdown[i][j] = new Cell(input.drawdown[row_ndx][j].getHeddle());
            else d.drawdown[i][j] = new Cell(null);
          }
        }
        i++;
      });
    });
    // format.transferSystemsAndShuttles(d, all_drafts, params, 'jointop');
    d.gen_name = formatName(all_drafts, "top");
    return d;
  }
});

export const joinleft = Merge.AllRequired({
  name: 'join left',
  displayname: 'join left',
  old_names:[],
  dx: 'joins drafts together from left to right',
  params: [ 
    <BoolParam>{name: 'repeat',
    type: 'boolean',
    falsestate: 'do not repeat inputs to match size',
    truestate: 'repeat inputs to match size',
    value: 1,
    dx: "controls if the inputs are repeated along the width so they repeat in even intervals"
}],
  inlets: [{
    name: 'draft', 
    type: 'static',
    value: null,
    dx: 'the draft to join horizontally',
    num_drafts: -1
  },{
    name: 'weft pattern', 
    type: 'static',
    value: null,
    dx: 'optional, define a custom weft material or system pattern here',
    num_drafts: 1
  }],
  perform: (inputs: InletDrafts, params: Array<number>) => {
    const drafts_in = inputs[0];
    const warp_system = inputs[1];
    const factor_in_repeats = params[0];
    
    let weft_mapping;
    if(warp_system === undefined) weft_mapping = initDraftWithParams({warps: 1, wefts:1});
    else weft_mapping = warp_system[0];

    const all_drafts = drafts_in;

    const total_warps:number =all_drafts.reduce((acc, draft)=>{
        return acc + warps(draft.drawdown);
    }, 0);

    let total_wefts: number = 0;
    const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
    if(factor_in_repeats === 1) total_wefts = utilInstance.lcm(all_wefts);
    else  total_wefts = utilInstance.getMaxWefts(all_drafts);


    const d: Draft = initDraftWithParams({
      warps: total_warps, 
      wefts: total_wefts,
      rowSystemMapping: weft_mapping.rowSystemMapping,
      rowShuttleMapping: weft_mapping.rowShuttleMapping
    });

    for(let i = 0; i < total_wefts; i++){
      const combined_rows: Array<Cell> =all_drafts.reduce((acc, input) => {
          let  r: Array<Cell> = [];
          //if the draft doesn't have this row, just make a blank one
          if(i >= wefts(input.drawdown) && factor_in_repeats == 0){
            const nd =initDraftWithParams({warps: warps(input.drawdown), wefts: 1});
            nd.drawdown[0].forEach(el => el.setHeddle(null));
            r = nd.drawdown[0];
          }
          else {
            r =  input.drawdown[i%wefts(input.drawdown)];
          } 
          return acc.concat(r);
        }, []);
        combined_rows.forEach((cell,j) => {
          d.drawdown[i][j].setHeddle(cell.getHeddle());
        });
    }
  
    d.colSystemMapping =all_drafts.reduce((acc, draft) => {
      return acc.concat(draft.colSystemMapping);
    }, []);

    d.colShuttleMapping = all_drafts.reduce((acc, draft) => {
      return acc.concat(draft.colShuttleMapping);
    }, []);
          

    // format.transferSystemsAndShuttles(d, all_drafts, params, 'joinleft');
    d.gen_name = formatName(all_drafts, "left");
    
    return d;
  }
});


// const splicein = Merge.AllRequired({
//   name: 'splice in wefts',
//   displayname: 'splice in wefts',  
//   old_names: [],
//   dx: 'splices the second draft into the first every nth row',
//   params: <Array<NumParam>> [  
//     {name: 'pics between insertions',
//     type: 'number',
//     min: 1,
//     max: 100,
//     value: 1,
//     dx: "the number of pics to keep between each splice row"
//     },
//     {name: 'repeat',
//     type: 'boolean',
//     falsestate: 'do not repeat inputs to match size',
//     truestate: 'repeat inputs to match size',
//     value: 1,
//     dx: "controls if the inputs are repeated to make drafts of the same size or not"
//   },
//   {name: 'splice style',
//   type: 'boolean',
//   falsestate: 'line by line',
//   truestate: 'whole draft',
//   value: 0,
//   dx: "controls if the whole draft is spliced in every nth weft or just the next pic in the draft"
// }],
//     inlets: [{
//       name: 'receiving draft', 
//       type: 'static',
//       value: null,
//       dx: 'all the drafts you would like to interlace',
//       num_drafts: 1
//     },
//     {
//       name: 'splicing draft', 
//       type: 'static',
//       value: null,
//       dx: 'the draft you would like to splice into the recieving draft',
//       num_drafts: 1
//     }
//   ],
  
//   perform: (inputs: Array<Draft>, params: Array<ParamValue>) => {
//     const static_input = inputs[0];
//     const splicing_input = inputs[1];
//     const num_pics = <number> params[0];
//     const factor_in_repeats = params[1];
//     const whole_draft = params[2];

//     const all_drafts = [static_input, splicing_input];

//     let total_wefts: number = 0;
//     if (factor_in_repeats === 1) {
//       let factors = [];
//       if (whole_draft) {
//         factors = [wefts(static_input.drawdown), wefts(splicing_input.drawdown)*(num_pics + wefts(splicing_input.drawdown))];
//       }else{
//         factors = [wefts(static_input.drawdown), wefts(splicing_input.drawdown)*(num_pics + 1)];
//       }
//       total_wefts = utilInstance.lcm(factors);
//     }  
//     else {
//       //sums the wefts from all the drafts
//       total_wefts = all_drafts.reduce((acc, el) => {
//         return acc + wefts(el.drawdown);
//       }, 0);

//     }
  
//     let total_warps: number = 0;
//     const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
  
//     if(factor_in_repeats === 1)  total_warps = utilInstance.lcm(all_warps);
//     else  total_warps = utilInstance.getMaxWarps(all_drafts);
  

//     const uniqueSystemRows = ss.makeSystemsUnique(all_drafts.map(el => el.rowSystemMapping));

//     let array_a_ndx = 0;
//     let array_b_ndx = 0;
  
//     //create a draft to hold the merged values
//     const d: Draft = initDraftWithParams({warps: total_warps, wefts:total_wefts, colShuttleMapping:static_input.colShuttleMapping, colSystemMapping:static_input.colSystemMapping});

//     for (let i = 0; i < wefts(d.drawdown); i++) {
//       let select_array:number = 0;

//       if (whole_draft) {
//         const cycle = num_pics + wefts(splicing_input.drawdown);
//         select_array = (i % (cycle) >= params[0]) ? 1 : 0; 
//       } else {
//         select_array = (i % (num_pics+1) ===params[0]) ? 1 : 0; 
//       } 

//       if(!factor_in_repeats){
//         if(array_b_ndx >=wefts(splicing_input.drawdown)) select_array = 0;
//         if(array_a_ndx >=warps(static_input.drawdown)) select_array = 1;
//       }
      
//       let cur_weft_num = wefts(all_drafts[select_array].drawdown);
//       let ndx = (select_array === 0) ? array_a_ndx%cur_weft_num : array_b_ndx%cur_weft_num;

//       d.drawdown[i].forEach((cell, j) => {
//         let cur_warp_num = warps(all_drafts[select_array].drawdown);
//         cell.setHeddle(all_drafts[select_array].drawdown[ndx][j%cur_warp_num].getHeddle());
//         if(j >= cur_warp_num && !factor_in_repeats) cell.setHeddle(null);
//       });

//       d.rowSystemMapping[i] = uniqueSystemRows[select_array][ndx];
//       d.rowShuttleMapping[i] =all_drafts[select_array].rowShuttleMapping[ndx];

//       if (select_array === 0) {
//         array_a_ndx++;
//       } 
//       else {
//         array_b_ndx++;
//       } 

//     }
//     // format.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
//     d.gen_name = formatName(all_drafts, "splice")
//     return d;
//   }     
// });

// const spliceinwarps = Merge.AllRequired({
// name: 'splice in warps',
// displayname: 'splice in warps',  
// old_names: [],
// dx: 'splices the second draft into the first every nth warp',
// params: <Array<NumParam>> [  
//   {name: 'pics between insertions',
//   type: 'number',
//   min: 1,
//   max: 100,
//   value: 1,
//   dx: "the number of ends to keep between each splice "
//   },
//   {name: 'repeat',
//   type: 'boolean',
//   falsestate: 'do not repeat inputs to match size',
//   truestate: 'repeat inputs to match size',
//   value: 1,
//   dx: "controls if the inputs are repeated to make drafts of the same size or not"
//   },
//   {name: 'splice style',
//   type: 'boolean',
//   falsestate: 'line by line',
//   truestate: 'whole draft',
//   value: 0,
//   dx: "controls if the whole draft is spliced in every nth warp or just the next end in the draft"
// }],
// inlets: [{
//   name: 'receiving draft', 
//   type: 'static',
//   value: null,
//   dx: 'all the drafts you would like to interlace',
//   num_drafts: 1
// },
// {
//   name: 'splicing draft', 
//   type: 'static',
//   value: null,
//   dx: 'the draft you would like to splice into the recieving draft',
//   num_drafts: 1
// }],
// perform: (inputs: Array<Draft>, params: Array<number>) => {
//   const static_input = inputs[0];
//   const splicing_input = inputs[1];

//   const factor_in_repeats = params[1];
//   const whole_draft = params[2];

//   const all_drafts = [static_input, splicing_input];

//   let total_warps: number = 0;
//   let factors: Array<number> = [];
//   if(factor_in_repeats === 1){
//     if (whole_draft) {
//       factors = [warps(static_input.drawdown), (warps(splicing_input.drawdown)*(params[0]+warps(splicing_input.drawdown)))];
//     }else{
//       factors = [warps(static_input.drawdown), warps(splicing_input.drawdown)*(params[0]+1)];
//     }
//     total_warps = utilInstance.lcm(factors);
//   } else {
//     //sums the warps from all the drafts
//     total_warps = all_drafts.reduce((acc, el) => {
//       return acc + warps(el.drawdown);
//     }, 0);
//   }

//   let total_wefts: number = 0;
//   const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);

//   if (factor_in_repeats === 1)  total_wefts = utilInstance.lcm(all_wefts);
//   else  total_wefts = utilInstance.getMaxWefts(all_drafts);

//   // let the tree handle the system service globals
//   const uniqueSystemCols = ss.makeSystemsUnique(all_drafts.map(el => el.colSystemMapping));

//   let array_a_ndx = 0;
//   let array_b_ndx = 0;

//   //create a draft to hold the merged values
//   const d: Draft = initDraftWithParams({warps: total_warps, wefts:total_wefts, rowShuttleMapping:static_input.rowShuttleMapping, rowSystemMapping:static_input.rowSystemMapping});

//   for(let j = 0; j < warps(d.drawdown); j++){
//     let select_array: number;
//     if(whole_draft){
//       const cycle = params[0] + warps(splicing_input.drawdown);
//       select_array = (j % (cycle) >= params[0]) ? 1 : 0; 
//     }else{
//       select_array = (j % (params[0]+1) === params[0]) ? 1 : 0; 
//     } 


//     if(!factor_in_repeats){
//       if(array_b_ndx >=warps(splicing_input.drawdown)) select_array = 0;
//       if(array_a_ndx >=warps(static_input.drawdown)) select_array = 1;
//     }
    
//     let cur_warp_num = warps(all_drafts[select_array].drawdown)
//     let ndx = (select_array === 0) ? array_a_ndx % cur_warp_num : array_b_ndx % cur_warp_num;

//     const col:Array<Cell> = d.drawdown.reduce((acc, el) => {
//       acc.push(el[j]);
//       return acc;
//     }, [])


//     col.forEach((cell, i) => {
//       let cur_weft_num = wefts(all_drafts[select_array].drawdown);
//       cell.setHeddle(all_drafts[select_array].drawdown[i%cur_weft_num][ndx].getHeddle());
//       if(i >= cur_weft_num && !factor_in_repeats) cell.setHeddle(null);
//     });

//     d.colSystemMapping[j] = uniqueSystemCols[select_array][ndx];
//     d.colShuttleMapping[j] = all_drafts[select_array].colShuttleMapping[ndx];


//     if(select_array === 0){
//       array_a_ndx++;
//     } 
//     else{
//       array_b_ndx++;
//     } 

//   }
//   // format.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
//   d.gen_name = formatName(all_drafts, "splice")
//   return d;
// }     
// });

// const vertcut = Branch.AllRequired({
// name: 'vertical cut',
// displayname: 'vertical cut',  
// dx: 'make a vertical of this structure across two systems, representing the left and right side of an opening in the warp',
// old_names: [],
// params: <Array<NumParam>>[  
//   {name: 'systems',
//   type: 'number',
//   min: 2,
//   max: 100,
//   value: 2,
//   dx: "how many different systems you want to move this structure onto"
// }],
// inlets: [
//   {
//     name: 'draft',
//     type: 'static',
//     value: null,
//     dx: "the draft that will be assigned to a given system",
//     num_drafts: 1
//   }
// ],
// perform: (input: Draft, params: Array<number>) => {

//   const outputs: Array<Draft> = [];
//   const outwefts =params [0] * wefts(input.drawdown);

//   const rep_inputs = [];

//   for(let i = 0; i < params[0]; i++){
//     rep_inputs.push(_.cloneDeep(input));
//   }

//   const uniqueSystemRows = makeSystemsUnique(rep_inputs.map(el => el.rowSystemMapping));
//   for (let i = 0; i <params[0]; i++) {

//     const d: Draft = initDraftWithParams({wefts: outwefts, warps:warps(input.drawdown), colShuttleMapping:input.colShuttleMapping, colSystemMapping:input.colSystemMapping});
//     d.drawdown.forEach((row, row_ndx) => {
//       row.forEach((cell, j) => {

//         const use_row: boolean = row_ndx%params[0] === i;
//         const input_ndx: number = Math.floor(row_ndx /params[0]);
//         d.rowShuttleMapping[row_ndx] =input.rowShuttleMapping[input_ndx];


//         if(use_row){
//           cell.setHeddle(input.drawdown[input_ndx][j].getHeddle());
//           d.rowSystemMapping[row_ndx] = uniqueSystemRows[i][input_ndx]
//         } 
//         else {
//           cell.setHeddle(null);
//           d.rowSystemMapping[row_ndx] = uniqueSystemRows[row_ndx % params[0]][input_ndx]
//           d.rowSystemMapping[row_ndx] = uniqueSystemRows[row_ndx % params[0]][input_ndx]
//         }
//       });
//     });

//     d.gen_name = formatName([input], "cut+"+i)
//     outputs.push(d);
//   }
//   return outputs;
// }     
// });

// const dynamic_join_left: DynamicOperation = {
//     name: 'dynamicjoinleft',
//     displayname: 'subdivide width',
//     old_names:[],
//     dynamic_param_id: 0,
//     dynamic_param_type: "number",
//     dx: 'subdivides the width of the weave into equal sized sections, then, takes each input draft and assign it a division from left to right',
//     params: <Array<NumParam>>[   
//       {name: 'divisions',
//       type: 'number',
//       min: 1,
//       max: 100,
//       value: 1,
//       dx: 'the number of equally sized sections to include in the draft'
//       },
//   {name: 'width',
//     type: 'number',
//     min: 1,
//     max: 10000,
//     value: 100,
//     dx: 'the total width of the draft'
//   }],
//   inlets: [
//     {
//       name: 'weft pattern', 
//       type: 'static',
//       value: null,
//       dx: 'optional, define a custom weft material or system pattern here',
//       num_drafts: 1
//     }
//   ],
//     perform: (op_inputs: Array<OpInput>) => {
//     //split the inputs into the input associated with 
//     const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "dynamicjoinleft");
//     const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
//     const warp_system = op_inputs.find(el => el.inlet == 0);

//       console.log("child inputs", child_inputs);

//     let weft_mapping;
//     if(warp_system === undefined) weft_mapping = initDraftWithParams({warps: 1, wefts:1});
//     else weft_mapping = warp_system.drafts[0];
   
//     //parent param
//     const sections = parent_inputs[0].params[0];
//     const total_width = parent_inputs[0].params[1];
  
//     const warps_in_section = Math.ceil(total_width / sections);
  
//     //now just get all the drafts, in the order of their assigned inlet
//     const max_inlet = child_inputs.reduce((acc, el) => {
//       if(el.inlet > acc){
//         acc = el.inlet
//       } 
//       return acc;
//     }, 0);

//     const all_drafts: Array<Draft> = [];
//     for(let l = 0; l <= max_inlet; l++){
//       const inlet_inputs = child_inputs.filter(el => el.inlet == l);
//       inlet_inputs.forEach(el => {
//         all_drafts.push(el.drafts[0]);
//       })
//     };


//    if(all_drafts.length === 0) return Promise.resolve([]);
   
//    let total_warps: number = 0;
//    const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
//     total_warps = utilInstance.lcm(all_warps);


//     const section_draft_map: Array<any> = child_inputs.map(el => { return {section: el.params[0]-1, draft: el.drafts.shift()}}); 
//     const d:Draft =initDraftWithParams({
//       warps:total_width, 
//       wefts:total_warps,
//       rowShuttleMapping: weft_mapping.rowShuttleMapping,
//       rowSystemMapping: weft_mapping.rowSystemMapping
//      });

//      d.drawdown.forEach((row, i) => {
//       row.forEach((cell, j) => {
//           const use_section = Math.floor(j / warps_in_section);
//           const warp_in_section = j % warps_in_section;
//           const use_draft_map = section_draft_map.find(el => el.section === use_section);
//           if(use_draft_map !== undefined){
//             const use_draft = use_draft_map.draft;
//             cell.setHeddle(use_input.drawdown[i%wefts(use_input.drawdown)][warp_in_section%warps(use_input.drawdown)].getHeddle());
//           }
//       });
//      });

//      d.colShuttleMapping.forEach((val, j) => {
//           const use_section = Math.floor(j / warps_in_section);
//           const warp_in_section = j % warps_in_section;
//           const use_draft_map = section_draft_map.find(el => el.section === use_section);
//           if(use_draft_map !== undefined){
//             const use_draft = use_draft_map.draft;
//             val = use_draft.colShuttleMapping[warp_in_section%warps(use_input.drawdown)];
//             d.colSystemMapping = use_draft.colSystemMapping[warp_in_section%warps(use_input.drawdown)];
//           }
//      });



//     return Promise.resolve([d]);
   
//     }
// }

// const germanify: Operation = {
//     name: 'germanify',
//     displayname: 'germanify',
//     old_names:[],
//     dx: 'uses ML to edit the input based on patterns in a german drafts weave set',
//     params: <Array<NumParam>>[
//       {name: 'output selection',
//       type: 'number',
//       min: 1,
//       max: 10,
//       value: 1,
//       dx: 'which pattern to select from the variations'
//       }
//     ],
//     inlets: [{
//       name: 'draft', 
//       type: 'static',
//       value: null,
//       dx: 'the draft to germanify',
//       num_drafts: 1
//     }],
//     perform: (op_inputs: Array<OpInput>) => {
//       const parent_input = op_inputs.find(el => el.op_name === "gemanify");
//       const child_input= op_inputs.find(el => el.op_name === "child");
      
//       if(child_input === undefined) return Promise.resolve([]);
//       const inputDraft = input

//       const loom_settings:LoomSettings = {
//         type: 'frame',
//         epi: 10, 
//         units: 'in',
//         frames: 8,
//         treadles: 10
//       }
//       const utils = getLoomUtilByType('frame');
//       return utils.computeLoomFromDrawdown(inputDraft.drawdown, loom_settings, 0).then(loom => {
//         let pattern = this.pfs.computePatterns(loom.threading, loom.treadling, inputDraft.drawdown);
//         const draft_seed =  utilInstance.drawdownToSize(pattern, 48, 48);

  
//         return this.vae.generateFromSeed(draft_seed, 'german')
//           .then(suggestions => suggestions.map(suggestion => {
//                   const treadlingSuggest = this.pfs.getTreadlingFromArr(suggestion);
//                   const threadingSuggest = this.pfs.getThreadingFromArr(suggestion);
//                   const pattern = this.pfs.computePatterns(threadingSuggest, treadlingSuggest, suggestion)
//                   const draft:Draft =initDraftWithParams({warps: pattern[0].length, wefts: pattern.length});
//                     for (var i = 0; i < pattern.length; i++) {
//                       for (var j = 0; j < pattern[i].length; j++) {
//                           input.drawdown[i][j].setHeddle((pattern[i][j] == 1 ? true : false));
//                       }
//                     }

//                     format.transferSystemsAndShuttles(draft,[input],params, 'first');
//                     draft.gen_name = formatName([input], "germanify");
//                   return draft
                
//                 })
//               )

//       });

     
     
//       }
// }  

// const crackleify = Pipe.AllRequired({
//   name: 'crackle-ify',
//   displayname: 'crackle-ify',
//   old_names: [],
//   dx: 'uses ML to edit the input based on patterns in a german drafts weave set',
//   params: <Array<NumParam>>[
//     {name: 'output selection',
//     type: 'number',
//     min: 1,
//     max: 10,
//     value: 1,
//     dx: 'which pattern to select from the variations'
//     }
//   ],
//   inlets: [{
//     name: 'draft', 
//     type: 'static',
//     value: null,
//     dx: 'the draft to cracklify',
//     num_drafts: 1
//   }],
//   perform: (op_inputs: Array<OpInput>) => {
//     const parent_input = op_inputs.find(el => el.op_name === "crackle-ify");
//     const child_input= op_inputs.find(el => el.op_name === "child");
//     if(child_input === undefined) return Promise.resolve([]);

//     if(child_input.drafts.length === 0) return Promise.resolve([]);

//     const loom_settings: LoomSettings = {
//       type: 'frame',
//       epi: 10, 
//       units: 'in',
//       frames: 8,
//       treadles: 10
//     }
//     const utils = getLoomUtilByType('frame');
//     return utils.computeLoomFromDrawdown(inputDraft.drawdown, loom_settings,  0).then(loom => {
//       let pattern = this.pfs.computePatterns(loom.threading, loom.treadling, inputDraft.drawdown);

//       const draft_seed =  utilInstance.drawdownToSize(pattern, 52, 52);

//       return vae.generateFromSeed(draft_seed, 'crackle_weave')
//         .then(suggestions => suggestions.map(suggestion => {
          
//           const treadlingSuggest = this.pfs.getTreadlingFromArr(suggestion);
//           const threadingSuggest = this.pfs.getThreadingFromArr(suggestion);
//           const pattern = this.pfs.computePatterns(threadingSuggest, treadlingSuggest, suggestion)
//           const draft: Draft =initDraftWithParams({warps: pattern[0].length, wefts: pattern.length});
//             for (var i = 0; i < pattern.length; i++) {
//               for (var j = 0; j < pattern[i].length; j++) {
//                   input.drawdown[i][j].setHeddle((pattern[i][j] == 1 ? true : false));
//               }
//             }
//             // format.transferSystemsAndShuttles(draft,[input],params, 'first');
//             // draft.gen_name = formatName([input], "crackleify");
//           return draft
//       }));
//     }           
// });  
      
// const makeloom: Operation = {
//   name: 'floor loom',
//   displayname: 'shaft/treadle loom',
//   old_names:[],
//   dx: 'uses the input draft as drawdown and generates a threading, tieup and treadling pattern',
//   params: [],
//   inlets: [{
//     name: 'drawdown', 
//     type: 'static',
//     value: null,
//     dx: 'the drawdown from which to create threading, tieup and treadling data from',
//     num_drafts: 1
//   }],
//   perform: (op_inputs: Array<OpInput>) => {

//     const parent_input = op_inputs.find(el => el.op_name === "floor loom");
//     const child_input= op_inputs.find(el => el.op_name === "child");

//     if(child_input === undefined || child_input.drafts === undefined) return Promise.resolve([]);

  
//     const loom_settings: LoomSettings = {
//       type: 'frame',
//       epi: 10, 
//       units: 'in',
//       frames: 8,
//       treadles: 10
//     }
//     const utils = getLoomUtilByType(loom_settings.type);
//     return utils.computeLoomFromDrawdown(input.drawdown, loom_settings, this.ws.selected_origin_option)
//     .then(l => {

//       const frames = Math.max(numFrames(l), loom_settings.frames);
//       const treadles = Math.max(numTreadles(l), loom_settings.treadles);
    
//       const threading: Draft =initDraftWithParams({warps:warps(input.drawdown), wefts: frames});
//     l.threading.forEach((frame, j) =>{
//       if(frame !== -1) threading.drawdown[frame][j].setHeddle(true);
//     });
//     threading.gen_name = "threading"+getDraftName(input);

//     const treadling: Draft =initDraftWithParams({warps:treadles, wefts:wefts(input.drawdown)});   
//     l.treadling.forEach((treadle_row, i) =>{
//       treadle_row.forEach(treadle_num => {
//         treadling.drawdown[i][treadle_num].setHeddle(true);
//       })
//     });
//     treadling.gen_name = "treadling_"+getDraftName(input);


//     const tieup: Draft =initDraftWithParams({warps: treadles, wefts: frames});
//     l.tieup.forEach((row, i) => {
//       row.forEach((val, j) => {
//         tieup.drawdown[i][j].setHeddle(val);
//       })
//     });
//     tieup.gen_name = "tieup_"+getDraftName(input);
//     return Promise.resolve([threading, tieup, treadling]);



//     });

//   }


// }

// const drawdown: Operation = {
//   name: 'drawdown',
//   displayname: 'drawdown',
//   old_names:[],
//   dx: 'create a drawdown from the input drafts (order 1. threading, 2. tieup, 3.treadling)',
//   params: [],
//   inlets: [{
//     name: 'threading', 
//     type: 'static',
//     value: null,
//     dx: 'the draft to use as threading',
//     num_drafts: 1
//   }, {
//     name: 'tieup', 
//     type: 'static',
//     value: null,
//     dx: 'the draft to use as tieup',
//     num_drafts: 1
//   },
//   {
//     name: 'treadling', 
//     type: 'static',
//     value: null,
//     dx: 'the draft to use as treadling',
//     num_drafts: 1
//   }
//   ],
//   perform: (op_inputs: Array<OpInput>) => {

//     const parent_input = op_inputs.find(el => el.op_name === "floor loom");
//     const child_input= op_inputs.find(el => el.op_name === "child");
//     const threading_inlet = op_inputs.find(el => el.inlet === 0);
//     const tieup_inlet = op_inputs.find(el => el.inlet === 1);
//     const treadling_inlet = op_inputs.find(el => el.inlet === 2);



//     if(child_input === undefined 
//       || threading_inlet === undefined
//       || tieup_inlet === undefined
//       || treadling_inlet == undefined) return Promise.resolve([]);

//     const threading_draft = treadling_inlet.drafts[0];
//     const tieup_draft = tieup_inlet.drafts[0];
//     const treadling_draft = treadling_inlet.drafts[0];

    
//     const threading: Array<number> = [];
//     for(let j = 0; j < warps(threading_input.drawdown); j++){
//       const col: Array<Cell> = threading_input.drawdown.reduce((acc, row, ndx) => {
//         acc[ndx] = row[j];
//         return acc;
//       }, []);

//       threading[j] = col.findIndex(cell => cell.getHeddle());

//     }
  
//     const treadling: Array<Array<number>> =treadling_input.drawdown
//     .map(row => [row.findIndex(cell => cell.getHeddle())]);

//     const tieup = tieup_input.drawdown.map(row => {
//       return row.map(cell => cell.getHeddle());
//     });

//     const draft: Draft = initDraftWithParams({warps:warps(threading_input.drawdown), wefts:wefts(treadling_input.drawdown)});
//     const utils = getLoomUtilByType('frame');
//     const loom = {
//       threading: threading,
//       tieup: tieup,
//       treadling:treadling
//     }
//     return utils.computeDrawdownFromLoom(loom, 0).then(drawdown => {
//       input.drawdown = drawdown;
//       return Promise.resolve([draft]);

//     })
    

//     }



// }

// const combinatorics = Branch.NoDrafts({
//   name: 'combos',
//   displayname: 'all possible structures',
//   old_names: [],
//   dx: 'generates a list of all possible drafts of a given size for the user to explore',
//   params: [
//     <NumParam>{name: 'size',
//     type: 'number',
//       min: 2,
//       max: 4,
//     value: 3,
//     dx: 'the size of the structure'
//     },
//     <NumParam>{name: 'selection',
//     type: 'number',
//       min: 1,
//       max: 22874,
//     value: 1,
//     dx: 'the id of the generated structure you would like to view'
//     },
//     <BoolParam>{name: 'download all',
//     type: 'boolean',
//     falsestate: '',
//     truestate: 'downloading',
//     value: 0,
//     dx: "when this is set to true, it will trigger download of an image of the whole set everytime it recomputes, this may result in multiple downloads"
//     }
//   ],
//   perform: (params: Array<number>) => {
//     const size = params[0];
//     const show = params[1]-1;
//     const download = params[2];

//     //for larger set sizes, you must split up the download into multiple files
//     const divisor = (size - 3 > 0) ? Math.pow(2,(size-3)): 1;

//     return this.combos.getSet(size, size)
//     .then(alldrafts => { 

//       if(download){

//         for(let set_id = 0; set_id < divisor; set_id++){
          
//           const cc = 10;
//           const set_data = this.combos.getDrafts(set_id, divisor);

//           let b: HTMLCanvasElement = <HTMLCanvasElement>document.createElement('canvas'); 
//           let context = b.getContext('2d');
//           b.width = (cc*(size+5))*20;
//           b.height = Math.ceil(set_data.length  / 20)*((5+size)*cc);
//           context.fillStyle = "white";
//           context.fillRect(0,0,b.width,b.height);

//           set_data.forEach((set, ndx) => {
            
//             const top = Math.floor(ndx / 20) * (wefts(set.input.drawdown)+5)*cc + 10;
//             const left = ndx % 20 * (warps(set.input.drawdown)+5)*cc + 10; 
            
//             context.font = "8px Arial";
//             context.fillStyle = "#000000"
//             context.fillText((set.id+1).toString(),left, top-2,size*cc)
//             context.strokeRect(left,top,size*cc,size*cc);

//             for (let i = 0; i < wefts(set.input.drawdown); i++) {
//               for (let j = 0; j < warps(set.input.drawdown); j++) {
//                 this.drawCell(context, set.draft, cc, i, j, top, left);
//               }
//             }            
//           })

//           // console.log("b", b);
//           const a = document.createElement('a')
//           a.href = b.toDataURL("image/jpg")
//           a.download = "allvalid_"+size+"x"+size+"_drafts_"+set_id+".jpg";
//           a.click();
//         }

//       }
      
//       return Promise.resolve([this.combos.getDraft(show).draft]);

//     })

//   }

// }

    
// const assignlayers: DynamicOperation = {
//   name: 'assignlayers',
//   displayname: 'assign drafts to layers',
//   old_names:[],
//   dx: 'when given a number of layers, it creates inputs to assign one or more drafts to each the specified layer. You are allowed to specify a weft system with the input to each layer, this controls the ordering of the input drafts in the layers. For instance, if you give layer 1 system a, and layer 2 system b, your output draft will order the rows ababab.... If you give two inputs to layer 1 and assign them to system a, then one input layer 2, and give it system b, the output will order the rows aabaab. This essentially allows you to control weft systems at the same time as layers, aligning weft systems across multiple drafts. Systems will always be organized alphbetically, and blank rows will be inserted in place of unused systems. For instance, if you have two layers and you assign them to systems a and c, the code will insert a blank system b for the resulting pattern of abcabcabc....',
//   dynamic_param_type: 'system',
//   dynamic_param_id: 0,
//   inlets: [],
//   params: [
//     <NumParam> {name: 'layers',
//       type: 'number',
//       min: 1,
//       max: 100,
//       value: 2,
//       dx: 'the total number of layers in this cloth'
//     },
//     <BoolParam> {name: 'repeat',
//       type: 'boolean',
//       value: 1,
//       truestate: 'repeat inputs to matching size',
//       falsestate: 'do not repeat inputs to matching size',
//       dx: 'automatically adjust the width and height of draft to ensure equal repeats (checked) or just assign to layers directly as provided'
//     }
//   ],
//   perform: (inputs: Array<OpInput>)=> {
        
//       //split the inputs into the input associated with 
//       const parent_inputs: Array<OpInput> = inputs.filter(el => el.op_name === "assignlayers");
//       const child_inputs: Array<OpInput> = inputs.filter(el => el.op_name === "child");
      
//       //parent param
//       const num_layers = parent_inputs[0].params[0];
//       const factor_in_repeats = parent_inputs[0].params[1];


//       //now just get all the drafts
//       const all_drafts: Array<Draft> = child_inputs.reduce((acc, el) => {
//          el.drafts.forEach(draft => {acc.push(draft)});
//          return acc;
//       }, []);

    
//       if (all_drafts.length === 0) return Promise.resolve([]);
      
//       let total_wefts: number = 0;
//       const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
//       if(factor_in_repeats === 1)  total_wefts = utilInstance.lcm(all_wefts);
//       else  total_wefts = utilInstance.getMaxWefts(all_drafts);

//       let total_warps: number = 0;
//       const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
//       if(factor_in_repeats === 1)  total_warps = utilInstance.lcm(all_warps);
//       else  total_warps = utilInstance.getMaxWarps(all_drafts);

//       const layer_draft_map: Array<any> = child_inputs.map((el, ndx) => { return {layer: el.inlet, system: el.params[0], drafts: el.drafts}}); 

//         const max_system = layer_draft_map.reduce((acc, el) => {
//           if(el.system > acc) return el.system;
//           return acc;
//         }, 0);

      


//         const outputs = [];
//         const warp_systems = [];


//         //create a list of systems as large as the total number of layers
//         for(let n = 0;  n < num_layers; n++){
//           const sys = ss.getWarpSystem(n);
//           if(sys === undefined) ss.addWarpSystemFromId(n);
//           warp_systems[n] = n;
//         }

//         const layer_draft_map_sorted = [];
//         //sort the layer draft map by system, push empty drafts
//         for(let i = 0; i <= max_system; i++){
//           const ldms:Array<any> = layer_draft_map.filter(el => el.system == i);
//           if(ldms.length == 0){
//             layer_draft_map_sorted.push({layer: -1, system: i, drafts:[]})
//           }else{
//             ldms.forEach(ldm => {layer_draft_map_sorted.push(ldm);})
//           }
//         }


//         layer_draft_map_sorted.forEach(layer_map => {

//           const layer_num = layer_map.layer;
//           if(layer_num < 0){
//             outputs.push(initDraftWithParams(
//               {warps: total_warps*warp_systems.length, 
//                 wefts: total_wefts,
//                 rowSystemMapping: [layer_map.system]}));
//           }else{
//             layer_map.drafts.forEach(draft => {
//               const d:Draft =initDraftWithParams({
//                 warps:total_warps*warp_systems.length, 
//                 wefts:total_wefts, 
//                 rowShuttleMapping:draft.rowShuttleMapping, 
//                 rowSystemMapping: [layer_map.system],
//                 colShuttleMapping: draft.colShuttleMapping,
//                 colSystemMapping: warp_systems});
          
//                 d.drawdown.forEach((row, i) => {
//                   row.forEach((cell, j)=> {
//                     const sys_id = j % num_layers;
//                     const use_col = sys_id === layer_num;
//                     const use_index = Math.floor(j /num_layers);
//                     if(use_col){
//                         //handle non-repeating here if we want
//                         if(factor_in_repeats == 1){
//                           d.colShuttleMapping[j] =draft.colShuttleMapping[use_index%warps(input.drawdown)];
//                           cell.setHeddle(input.drawdown[i%wefts(input.drawdown)][use_index%warps(input.drawdown)].getHeddle());
//                         }else{
//                           if(i < wefts(input.drawdown) && use_index < warps(input.drawdown)) cell.setHeddle(input.drawdown[i][use_index].getHeddle());
//                           else cell.setHeddle(null);
//                         }
                      
//                     }else{
//                       if(sys_id < layer_num){
//                         cell.setHeddle(true);
//                       }else if(sys_id >=layer_num){
//                         cell.setHeddle(false);
//                       }
//                     }
//                   })
//                 });
//                 d.gen_name = formatName([draft], "");
//                 outputs.push(d);
//           });
//         }
//     });

//     //outputs has all the drafts now we need to interlace them (all layer 1's then all layer 2's)
//     const pattern: Array<Array<Cell>> = [];
//     const row_sys_mapping: Array<number> = [];
//     const row_shut_mapping: Array<number> = [];
//     for (let i = 0; i < total_wefts * outputs.length; i++) {
//       pattern.push([]);
//       const use_draft_id = i % outputs.length;
//       const use_row = Math.floor(i / outputs.length);
//       row_sys_mapping.push(outputs[use_draft_id].rowSystemMapping[use_row])
//       row_shut_mapping.push(outputs[use_draft_id].rowShuttleMapping[use_row])
//       for (let j = 0; j < total_warps * warp_systems.length; j++) {
//         const val:boolean = outputs[use_draft_id].drawdown[use_row][j].getHeddle();
//       for(let j = 0; j < total_warps * warp_systems.length; j++){
//         const val:boolean = outputs[use_draft_id].drawdown[use_row][j].getHeddle();
//         pattern[i].push(new Cell(val));
//       }
//     }

//     const interlaced = initDraftWithParams({
//       warps: total_warps * warp_systems.length,
//       wefts: total_wefts * outputs.length,
//       colShuttleMapping: outputs[0].colShuttleMapping,
//       colSystemMapping: warp_systems,
//       pattern: pattern,
//       rowSystemMapping: row_sys_mapping,
//       rowShuttleMapping: row_shut_mapping
//     })
   
      
//     interlaced.gen_name = formatName(outputs, "layer");
//     return Promise.resolve([interlaced]);
//     }      
// }};

// const imagemap: DynamicOperation = {
//     name: 'imagemap',
//     displayname: 'image map',
//     old_names:[],
//     dx: 'uploads an image and creates an input for each color found in the image. Assigning a draft to the color fills the color region with the selected draft',
//     dynamic_param_type: 'color',
//     dynamic_param_id: 0,
//     max_inputs: 0,
//     inlets: [],
//     params: <Array<NumParam>>[
//         {name: 'image file (.jpg or .png)',
//         type: 'file',
//         min: 1,
//         max: 100,
//         value: 'noinput',
//         dx: 'the total number of layers in this cloth'
//       },
//       {name: 'draft width',
//         type: 'number',
//         min: 1,
//         max: 10000,
//         value: 300,
//         dx: 'resize the input image to the width specified'
//       },
//       {name: 'draft height',
//         type: 'number',
//         min: 1,
//         max: 10000,
//         value: 200,
//         dx: 'resize the input image to the height specified'
//       }
//     ],
//     perform: (inputs: Array<OpInput>)=> {
        
//       //split the inputs into the input associated with 
//       const parent_inputs: Array<OpInput> = inputs.filter(el => el.op_name === "imagemap");
//       const child_inputs: Array<OpInput> = inputs.filter(el => el.op_name === "child");

//       const image_data = this.is.getImageData(parent_inputs[0].params[0]);
//       const res_w = parent_inputs[0].params[1];
//       const res_h = parent_inputs[0].params[2];

//       if (image_data === undefined) return Promise.resolve([]);
//       const data = image_data.data;

//       //we need to flip the image map here because it will be flipped back on return. 

//       const fliped_image = [];
//       data.image_map.forEach(row => {
//         fliped_image.unshift(row);
//       })

//       const color_to_drafts = data.colors.map((color, ndx) => {
//         const child_of_color = child_inputs.find(input => (input.params.findIndex(param => param === color) !== -1));
//         if (child_of_color === undefined) return {color: color, draft: null};
//         else return {color: color, draft: child_of_color.drafts[0]};
//       });

//       const pattern: Array<Array<Cell>> = [];
//       for (let i = 0; i < res_h; i++) {
//         pattern.push([]);
//         for (let j = 0; j < res_w; j++) {

//           const i_ratio = data.height / res_h;
//           const j_ratio = data.width / res_w;

//           const map_i = Math.floor(i * i_ratio);
//           const map_j = Math.floor(j * j_ratio);

//           const color_ndx = fliped_image[map_i][map_j]; //
//           const color_draft = color_to_drafts[color_ndx].draft;

//           if (color_draft === null) pattern[i].push(new Cell(false));
//           else {
//             const draft_i = i % wefts(color_input.drawdown);
//             const draft_j = j % warps(color_input.drawdown);
//             pattern[i].push(new Cell(color_input.drawdown[draft_i][draft_j].getHeddle()));
//           }
//         }
//       }

//       let first_draft: Draft = null;
//       child_inputs.forEach(el =>{
//         if (el.drafts.length > 0 && first_draft == null) first_draft = el.drafts[0];
//       });

//       if (first_draft == null) first_draft =  initDraftWithParams({warps: 1, wefts: 1, pattern: [[new Cell(null)]]})
//       if(first_draft == null) first_draft = initDraftWithParams({warps: 1, wefts: 1, pattern: [[new Cell(null)]]})

      

//       const draft: Draft = initDraftWithParams({
//         wefts: res_h, 
//         warps: res_w,
//         pattern: pattern,
//         rowSystemMapping: first_draft.rowSystemMapping,
//         rowShuttleMapping: first_draft.rowShuttleMapping,
//         colSystemMapping: first_draft.colSystemMapping,
//         colShuttleMapping: first_draft.colShuttleMapping});

//     return Promise.resolve([draft]);

//     }
    
//   }

// const assignwefts = Pipe.AllRequired({
//   name: 'assign weft systems',
//   displayname: 'assign weft systems', 
//   old_names: [], 
//   dx: 'splits each pic of the draft apart, allowing it to repeat at a specified interval and shift within that interval. Currently this will overwrite any system information that has been defined upstream',
//   params: <Array<NumParam>>[  
//     {name: 'total',
//     type: 'number',
//     min: 1,
//     max: 26,
//     value: 2,
//     dx: "how many systems total"
//     },
//     {name: 'shift',
//     type: 'number',
//     min: 0,
//     max: 26,
//     value: 0,
//     dx: "which posiiton to assign this draft"
//   }],
//   inlets: [
//     {
//       name: 'draft',
//       type: 'static',
//       value: null,
//       dx: "the draft that will be assigned to a given system",
//       num_drafts: 1
//     }
//   ],
//   perform: (input: Draft, params: Array<ParamValue>) => {
//     const outputs = [];
//     const systems = [];

//     //create a list of the systems
//     for (let n = 0;  n < params[0]; n++){
//       const sys = ss.getWeftSystem(n);
//       if (sys === undefined) ss.addWeftSystemFromId(n);
//       systems[n] = n;
//     }

//     let d: Draft;
//     // const system_maps = [inputs[0]];
//     // for (let i = 1; i <params[0] i++) {
//     //   system_maps.push( initDraftWithParams({wefts:inputs[0].wefts, warps:inputs[0].warps}));
//     // }

//     // const uniqueSystemRows = this.ss.makeSystemsUnique(system_maps.map(el => el.rowSystemMapping));

//     d = initDraftWithParams({
//       warps: input.warps, 
//       wefts: input.wefts * <number> params[0], 
//       colShuttleMapping: input.colShuttleMapping, 
//       colSystemMapping: input.colSystemMapping,
//       rowSystemMapping: systems
//     });


//     d.drawdown.forEach((row, i) => {
//       const use_row = i % params[0] === params[1];
//       const use_index = Math.floor(i /params[0]);
//       //this isn't working
//       //d.rowSystemMapping[i] = uniqueSystemRows[i % params[0][use_index];
//       row.forEach((cell, j) => {
//         if(use_row){
//           d.rowShuttleMapping[i] =input.rowShuttleMapping[use_index];
//           cell.setHeddle(input.drawdown[use_index][j].getHeddle());
//         } else {
//           cell.setHeddle(null);
//         }
//       });
//     });
    
//     // format.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
//     d.gen_name = formatName([input], "assign wefts")
//     const sys_char = String.fromCharCode(97 +params[1]);
//     d.gen_name = '-'+sys_char+':'+ d.gen_name;
//     return d;
//   }     
// }

// const assignwarps = Pipe.AllRequired({
//     name: 'assign warp systems',
//     displayname: 'assign warp systems', 
//     old_names: [], 
//     dx: 'splits each warp of the draft apart, allowing it to repeat at a specified interval and shift within that interval. An additional button is used to specify if these systems correspond to layers, and fills in draft accordingly',
//     params: <Array<NumParam>> [  
//       {name: 'total',
//       type: 'number',
//       min: 1,
//       max: 26,
//       value: 2,
//       dx: "how many warp systems (or layers) total"
//       },
//       {name: 'shift',
//       type: 'number',
//       min: 0,
//       max: 26,
//       value: 0,
//       dx: "which system/layer to assign this draft"
//       },
//       {name: 'map warp systems to layers?',
//       type: 'boolean',
//       min: 0,
//       max: 1,
//       value: 0,
//       dx: "fill in the draft such that each warp system corresponds to a layer (0 is top)"
//       }
//     ],
//     // perform: (inputs: Draft, params: Array<number>) => {
//     inlets: [
//       {
//         name: 'draft',
//         type: 'static',
//         value: null,
//         dx: "the draft that will be assigned to a given system",
//         num_drafts: 1
//       }
//     ],
//     perform: (op_inputs: Array<OpInput>) => {
//       const parent_input = op_inputs.find(el => el.op_name == 'assign warp systems');
//       const child_input = op_inputs.find(el => el.op_name == 'child');

//       if(child_input === undefined) return Promise.resolve([]);

//       const outputs = [];
//       const systems = [];
//       //create a list of the systems
//       for (let n = 0;  n < params[0]; n++) {
//       for(let n = 0;  n < params[0]; n++){
//         const sys = ss.getWarpSystem(n);
//         if (sys === undefined) ss.addWarpSystemFromId(n);
//         systems[n] = n;
//       }

//       const d:Draft =initDraftWithParams({
//         warps:warps(input.drawdown)*params[0], 
//         wefts:wefts(input.drawdown), 
//         rowShuttleMapping:input.rowShuttleMapping, 
//         rowSystemMapping:input.rowSystemMapping,
//         colSystemMapping: systems});


//       d.drawdown.forEach((row, i) => {
//         const row_is_null = utilInstance.hasOnlyUnset(input.drawdown[i]);
//         row.forEach((cell, j)=> {
//           const sys_id = j %params[0];
//           const use_col = sys_id ===params[1];
//           const use_index = Math.floor(j /params[0]);
//           //d.colSystemMapping[j] = uniqueSystemCols[sys_id][use_index];
//           if(use_col){
//             d.colShuttleMapping[j] =input.colShuttleMapping[use_index];
//             cell.setHeddle(input.drawdown[i][use_index].getHeddle());
//           }else{
//             if(params[2] == 1 && !row_is_null){
//               if(sys_id <params[1]){
//                 cell.setHeddle(true);
//               }else if(sys_id >=params[1]){
//                 cell.setHeddle(false);
//               }
//             } else {
//               cell.setHeddle(null);
//             }
//           }
//         })
//       });
      
//       // format.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
//       d.gen_name = formatName([input], "assign warps")
//       const sys_char = String.fromCharCode(97 +params[1]);
//       d.gen_name = '|'+sys_char+':'+d.gen_name;

//       outputs.push(d);
//       return outputs;
//     }     
// );

//   // const layernotation: DynamicOperation = {
//   //   name: 'notation',
//   //   displayname: 'layer notation',
//   //   old_names:[],
//   //   dynamic_param_id: 0,
//   //   dynamic_param_type: 'notation',
//   //   dx: 'uses a notation system to assign drafts to different warp and weft patterns on different layers. Layers are represented by () so (1a)(2b) puts warp1 and weft a on layer 1, warp 2 and weft b on layer 2',
//   //   params: <Array<StringParam>>[
//   //     {name: 'pattern',
//   //     type: 'string',
//   //     value: '(a1)(b2)',
//   //     regex: /.*?\((.*?[a-xA-Z]+[\d]+.*?)\).*?/i, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
//   //     error: 'invalid entry',
//   //     dx: 'all system pairs must be listed as letters followed by numbers, layers are created by enclosing those system lists in pararenthesis. For example, the following are valid: (a1b2)(c3) or (c1)(a2). The following are invalid: (1a)(2b) or (2b'
//   //     }
//   //   ],
//   //   inlets: [{
//   //     name: 'systems draft', 
//   //     type: 'static',
//   //     value: null,
//   //     dx: 'the draft that describes the system ordering we will add input structures within',
//   //     num_drafts: 1
//   //   }],
//   //   perform: (op_inputs: Array<OpInput>) => {


//   //     // //split the inputs into the input associated with 
//   //     const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "layernotation");
//   //     const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");


//   //     if(child_inputs.length == 0) return Promise.resolve([]);

//   //     //now just get all the drafts
//   //     const all_drafts: Array<Draft> = child_inputs.reduce((acc, el) => {
//   //       el.drafts.forEach(draft => {acc.push(draft)});
//   //       return acc;
//   //     }, []);



//   //     const system_map = child_inputs.find(el => el.inlet === 0);

//   //     if(system_map === undefined) return Promise.resolve([]); ;
     
      
//   //     const draft_inlets = child_inputs.filter(el => el.inlet > 0).map(el => el.drafts[0]);

//   //     let total_wefts: number = 0;
//   //     const all_wefts = draft_inlets.map(el => wefts(el.drawdown)).filter(el => el > 0);
//   //     total_wefts = utilInstance.lcm(all_wefts);

//   //     let total_warps: number = 0;
//   //     const all_warps = draft_inlets.map(el => warps(el.drawdown)).filter(el => el > 0);
//   //     total_warps = utilInstance.lcm(all_warps);



//   //     //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
//   //     //get the total number of layers
//   //     const system_draft_map = child_inputs
//   //     .filter(el => el.inlet > 0)
//   //     .map(el => {
//   //       return  {
//   //         wesy: el.params[0].match(/[a-zA-Z]+/g), //pull all the letters out into weft system ids
//   //         wasy: el.params[0].match(/\d/g).map(el => parseInt(el)), //pull out all the nubmers into warp systems
//   //         i: 0,
//   //         j: 0,
//   //         layer: el.inlet-1, //map layer order to the inlet id, all inlets must be ordered the same as the input
//   //         draft: el.drafts[0]
//   //       }
//   //     });
      

//   //     const d: Draft = initDraftWithParams({
//   //       warps: total_warps*warps(system_map.drafts[0].drawdown), 
//   //       wefts: total_wefts* wefts(system_map.drafts[0].drawdown),
//   //       rowShuttleMapping: system_map.drafts[0].rowShuttleMapping.slice(),
//   //       rowSystemMapping: system_map.drafts[0].rowSystemMapping.slice(),
//   //       colShuttleMapping: system_map.drafts[0].colShuttleMapping.slice(),
//   //       colSystemMapping: system_map.drafts[0].colSystemMapping.slice(),
//   //     });

//   //     d.drawdown = [];
//   //     for(let i = 0; i < wefts(d.drawdown); i++){
//   //       let active_wesy = this.ss.getWeftSystem(d.rowSystemMapping[i]).name;
//   //       const active_weft_entry = system_draft_map.find(el => el.wesy.findIndex(wesyel => wesyel === active_wesy) !== -1);
//   //       let increment_flag = false;

//   //       d.drawdown.push([]);
//   //       for(let j = 0; j < warps(d.drawdown); j++){
//   //         let active_wasy = parseInt(this.ss.getWarpSystem(d.colSystemMapping[j]).name);
//   //         const active_warp_entry = system_draft_map.find(el => el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1);
//   //         const entry = system_draft_map.find(el => (el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1 && el.wesy.findIndex(wesyel => wesyel === active_wesy)!== -1));

//   //         if(active_weft_entry === undefined || active_warp_entry === undefined){
//   //           //no input draft is assigned to this system, set all as undefined
//   //           d.drawdown[i][j] = new Cell(null);

//   //         }else if(entry === undefined){
//   //           //this is unassigned or its an an alternating layer. 
//   //           //find the term in the list assigned to this. 
//   //           //if this weft systems layer is > than the layer associted with this warp system, lower, if it is less, raise. 
//   //           const wesy_layer = active_weft_entry.layer;
//   //           const wasy_layer = active_warp_entry.layer;
//   //           if(wasy_layer < wesy_layer) d.drawdown[i][j] = new Cell(true);
//   //           else if(wasy_layer > wesy_layer) d.drawdown[i][j] = new Cell(false);
//   //           else d.drawdown[i][j] = new Cell(null);
//   //         }  
//   //         else{
//   //           d.drawdown[i][j] = new Cell(entry.input.drawdown[entry.i][entry.j].getHeddle());
//   //           entry.j = (entry.j+1)%warps(entry.input.drawdown);
//   //           increment_flag = true;
//   //         }

//   //       }

//   //       if(increment_flag){
//   //         active_weft_entry.i = (active_weft_entry.i+1) % wefts(active_weft_entry.input.drawdown);
//   //       } 


//   //     }
      
//   //     d.gen_name = formatName([], "notation");
//   //     return  Promise.resolve([d]);

     
//   //   }        
//   // }

// const layernotation: DynamicOperation = {
//     name: 'notation',
//     displayname: 'layer notation',
//     old_names:[],
//     dynamic_param_id: 0,
//     dynamic_param_type: 'notation',
//     dx: 'uses a notation system to assign drafts to different warp and weft patterns on different layers. Layers are represented by () so (1a)(2b) puts warp1 and weft a on layer 1, warp 2 and weft b on layer 2',
//     params: <Array<StringParam>>[
//       {name: 'pattern',
//       type: 'string',
//       value: '(a1)(b2)',
//       regex: /.*?\((.*?[a-xA-Z]*[\d]*.*?)\).*?/i, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
//       error: 'invalid entry',
//       dx: 'all system pairs must be listed as letters followed by numbers, layers are created by enclosing those system lists in pararenthesis. For example, the following are valid: (a1b2)(c3) or (c1)(a2). The following are invalid: (1a)(2b) or (2b'
//       }
//     ],
//     inlets: [{
//       name: 'systems draft', 
//       type: 'static',
//       value: null,
//       dx: 'the draft that describes the system ordering we will add input structures within',
//       num_drafts: 1
//     }],
//     perform: (op_inputs: Array<OpInput>) => {


//       // //split the inputs into the input associated with 
//       const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "notation");
//       const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");

//       if(child_inputs.length == 0) return Promise.resolve([]);

//       //now just get all the drafts
//       const all_drafts: Array<Draft> = child_inputs.reduce((acc, el) => {
//         el.drafts.forEach(draft => {acc.push(draft)});
//         return acc;
//       }, []);



//       const system_map = child_inputs.find(el => el.inlet === 0);

//       if(system_map === undefined) return Promise.resolve([]); ;
     
      
//       const draft_inlets = child_inputs.filter(el => el.inlet > 0).map(el => el.drafts[0]);

//       let total_wefts: number = 0;
//       const all_wefts = draft_inlets.map(el => wefts(el.drawdown)).filter(el => el > 0);
//       total_wefts = utilInstance.lcm(all_wefts);

//       let total_warps: number = 0;
//       const all_warps = draft_inlets.map(el => warps(el.drawdown)).filter(el => el > 0);
//       total_warps = utilInstance.lcm(all_warps);



//       //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
//       //get the total number of layers
//       const system_draft_map = child_inputs
//       .filter(el => el.inlet > 0)
//       .map(el => {
//         return  {
//           wesy: el.params[0].match(/[a-zA-Z]+/g), //pull all the letters out into weft system ids
//           wasy: el.params[0].match(/\d+/g), //pull out all the nubmers into warp systems
//           i: 0,
//           j: 0,
//           layer: el.inlet-1, //map layer order to the inlet id, all inlets must be ordered the same as the input
//           draft: el.drafts[0]
//         }
//       });


      
//       system_draft_map.forEach(sdm => {
//         if(sdm.wasy!== null) sdm.wasy = sdm.wasy.map(el => parseInt(el));
//         else sdm.wasy = [-1];
//         if(sdm.wesy === null) sdm.wesy = [''];
//       })


//       const d: Draft = initDraftWithParams({
//         warps: total_warps*warps(system_map.drafts[0].drawdown), 
//         wefts: total_wefts*wefts(system_map.drafts[0].drawdown),
//         rowShuttleMapping: system_map.drafts[0].rowShuttleMapping.slice(),
//         rowSystemMapping: system_map.drafts[0].rowSystemMapping.slice(),
//         colShuttleMapping: system_map.drafts[0].colShuttleMapping.slice(),
//         colSystemMapping: system_map.drafts[0].colSystemMapping.slice(),
//       });

//       for(let i = 0; i < wefts(d.drawdown); i++){
//         let active_wesy = this.ss.getWeftSystem(d.rowSystemMapping[i]).name;
//         const active_weft_entry = system_draft_map.find(el => el.wesy.findIndex(wesyel => wesyel === active_wesy) !== -1);
//         let increment_flag = false;

//         for(let j = 0; j < warps(d.drawdown); j++){
//           let active_wasy = parseInt(this.ss.getWarpSystem(d.colSystemMapping[j]).name);

          
//           const active_warp_entry = system_draft_map.find(el => el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1);
//           const entry = system_draft_map.find(el => (el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1 && el.wesy.findIndex(wesyel => wesyel === active_wesy)!== -1));

//           if(active_weft_entry === undefined || active_warp_entry === undefined){
//             //no input draft is assigned to this system, set all as undefined
//             d.drawdown[i][j] = new Cell(null);

//           }else if(entry === undefined){
//             //this is unassigned or its an an alternating layer. 
//             //find the term in the list assigned to this. 
//             //if this weft systems layer is > than the layer associted with this warp system, lower, if it is less, raise. 
//             const wesy_layer = active_weft_entry.layer;
//             const wasy_layer = active_warp_entry.layer;
//             if(wasy_layer < wesy_layer) d.drawdown[i][j] = new Cell(true);
//             else if(wasy_layer > wesy_layer) d.drawdown[i][j] = new Cell(false);
//             else d.drawdown[i][j] = new Cell(null);
//           }  
//           else{
//             d.drawdown[i][j] = new Cell(entry.input.drawdown[entry.i][entry.j].getHeddle());
//             entry.j = (entry.j+1) % warps(entry.input.drawdown);
//             increment_flag = true;
//           }

//         }

//         if(increment_flag){
//           active_weft_entry.i = (active_weft_entry.i+1) % wefts(active_weft_entry.input.drawdown);
//         } 


//       }
      
//       d.gen_name = formatName([], "notation");
//       return  Promise.resolve([d]);

//     }        
//   }

// const warp_profile: DynamicOperation = {
//     name: 'warp_profile',
//     displayname: 'pattern across width',
//     old_names: [],
//     dynamic_param_id: 0,
//     dynamic_param_type: 'profile',
//     dx: 'if you describe a numeric pattern, it will repeat the inputs in the same pattern',
//     params: <Array<StringParam>>[
//       {name: 'pattern',
//       type: 'string',
//       value: 'a b c a b c',
//       regex: /(?:[a-xA-Z][\ ]*).*?/, // NEVER USE THE GLOBAL FLAG - it will throw errors randomly
//       error: 'invalid entry',
//       dx: 'all entries must be numbers separated by a space'
//       }
//     ],
//     inlets: [{
//       name: 'weft pattern', 
//       type: 'static',
//       value: null,
//       dx: 'optional, define a custom weft material or system pattern here',
//       num_drafts: 1
//     }],
//     perform: (op_inputs: Array<OpInput>) => {

//       // //split the inputs into the input associated with 
//       const parent_input: OpInput = op_inputs.find(el => el.op_name === "warp_profile");
//       const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
//       const weft_system: OpInput = op_inputs.find(el => el.inlet == 0);


//       let weft_mapping;
//       if (weft_system === undefined) weft_mapping = initDraftWithParams({warps: 1, wefts:1});
//       else weft_mapping = weft_system.drafts[0];
  

//       //now just get all the drafts
//       const all_drafts: Array<Draft> = child_inputs
//       .filter(el => el.inlet > 0)
//       .reduce((acc, el) => {
//         el.drafts.forEach(draft => {acc.push(draft)});
//         return acc;
//       }, []);
     
    
//       let total_wefts: number = 0;
//       const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
//       total_wefts = utilInstance.lcm(all_wefts);


//       let pattern = params[0].split(' ');


//       //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
//       //get the total number of layers
//       const profile_draft_map = child_inputs
//       .map(el => {
//         return  {
//           id: el.inlet, 
//           val: (el.params[0]).toString(),
//           draft: el.drafts[0]
//         }
//       });


//       console.log(profile_draft_map);
//       let total_warps = 0;
//       const warp_map = [];
//       pattern.forEach(el => {
//         const d = profile_draft_map.find(dm => dm.val === el.toString());
//         if(d !== undefined){
//           warp_map.push({id: d.id, start: total_warps, end: total_warps+warps(d.input.drawdown)});
//           total_warps += warps(d.input.drawdown);
//         } 
//       })


  
//       const d: Draft =initDraftWithParams({
//         warps: total_warps, 
//         wefts: total_wefts,
//         rowShuttleMapping: weft_mapping.rowShuttleMapping,
//         rowSystemMapping: weft_mapping.rowSystemMapping,
//       });

//       for(let i = 0; i < wefts(d.drawdown); i++){
//         for(let j = 0; j < warps(d.drawdown); j++){


//           const pattern_ndx = warp_map.find(el => j >= el.start && j < el.end).id;
//           const select_draft = profile_draft_map.find(el => el.id === parseInt(pattern_ndx));
//           //console.log("Looking for ", pattern_ndx, "in", profile_draft_map);

//           if(select_draft === undefined){
//             d.drawdown[i][j] = new Cell(null);
//           }else{
//             const sd: Draft = select_draft.draft;
//             const sd_adj_j: number = j - warp_map.find(el => j >= el.start && j < el.end).start;
//             let val = sd.drawdown[i%wefts(sd.drawdown)][sd_adj_j%warps(sd.drawdown)].getHeddle();
//             d.drawdown[i][j] = new Cell(val);
//           }
//         }
//       }

//       d.gen_name = formatName([], "warp profile");
//       return  Promise.resolve([d]);

     
//     }        
//   }

// const sample_width: DynamicOperation = {
//     name: 'sample_width',
//     displayname: 'variable width sampler',
//     old_names:[],
//     dynamic_param_id: 0,
//     dynamic_param_type: 'profile',
//     dx: 'use a letter for each input pattern. Follow the letter by a number to describe how many ends upon which the designated structure should repeat. Separate by spaces. For example, a21 will place struture a across 21 ends. Height is determined by the inputs',
//     params: <Array<StringParam>> [
//       {name: 'pattern',
//       type: 'string',
//       value: 'a20 b20 a40 b40',
//       regex:/(?:[a-xA-Z][\d]*[\ ]*).*?/, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
//       error: 'invalid entry',
//       dx: 'all entries must be a single letter followed by a number, which each letter-number unit separated by a space'
//       }
//     ],
//     inlets: [],
//     perform: (op_inputs: Array<OpInput>) => {

              
//       // //split the inputs into the input associated with 
//       const parent_input: OpInput = op_inputs.find(el => el.op_name === "sample_width");
//       const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
//       const weft_system: OpInput = op_inputs.find(el => el.inlet == 0);


//       if(child_inputs.length == 0) return Promise.resolve([]);

//       let weft_mapping;
//       if(weft_system === undefined) weft_mapping = initDraftWithParams({warps: 1, wefts:1});
//       else weft_mapping = weft_system.drafts[0];
  

//       // now just get all the drafts
//       const all_drafts: Array<Draft> = child_inputs
//       .reduce((acc, el) => {
//         el.drafts.forEach(draft => {acc.push(draft)});
//         return acc;
//       }, []);
     
    
//       let total_wefts: number = 0;
//       const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
//       total_wefts = utilInstance.lcm(all_wefts);

//       let pattern = params[0].split(' ');

//       //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
//       //get the total number of layers
//       const profile_draft_map = child_inputs
//       .map(el => {
//         return  {
//           id: el.inlet, 
//           val: el.params[0].toString(),
//           draft: el.drafts[0]
//         }
//       });

//       let total_warps = 0;
//       const warp_map = [];
//       pattern.forEach(el => {
//         const label = el.charAt(0);
//         const qty =parseInt((<string>el).substring(1))
//         const d = profile_draft_map.find(dm => dm.val === label.toString());
//         if(d !== undefined){
//           warp_map.push({id: d.id, start: total_warps, end: total_warps+qty});
//           total_warps += qty;
//         } 
//       })


  
//       const d: Draft = initDraftWithParams({
//         warps: total_warps, 
//         wefts: total_wefts,
//         rowShuttleMapping: weft_mapping.rowShuttleMapping,
//         rowSystemMapping: weft_mapping.rowSystemMapping,
//       });

//       for(let i = 0; i < wefts(d.drawdown); i++){
//         for(let j = 0; j < warps(d.drawdown); j++){

//           const pattern_ndx = warp_map.find(el => j >= el.start && j < el.end).id;
//           const select_draft = profile_draft_map.find(el => el.id === parseInt(pattern_ndx));

//           if(select_draft === undefined){
//             d.drawdown[i][j] = new Cell(null);
//           }else{
//             const sd: Draft = select_draft.draft;
//             const sd_adj_j: number = j - warp_map.find(el => j >= el.start && j < el.end).start;
//             let val = sd.drawdown[i%wefts(sd.drawdown)][sd_adj_j%warps(sd.drawdown)].getHeddle();
//             d.drawdown[i][j] = new Cell(val);
//           }
//         }
//       }

//       d.gen_name = formatName([], "warp profile");
//       return  Promise.resolve([d]);
     
//     }        
//   }

// // const profile: DynamicOperation = {
// //   name: 'profile',
// //   displayname: 'profile draft',
// //   old_names:[],
// //   dynamic_param_id: 0,
// //   dynamic_param_type: 'draft',
// //   dx: 'if you describe a numeric pattern, it will repeat the inputs in the same pattern',
// //   params: <Array<DraftParam>>[
// //     {name: 'profile draft',
// //     type: 'draft',
// //     value: null,
// //     dx: '',
// //     id: -1
// //     }
// //   ],
// //   inlets: [{
// //     name: 'profile pattern', 
// //     type: 'static',
// //     value: null,
// //     dx: 'uses the threading and treadling on the input to generate inputs for the profile',
// //     num_drafts: 1
// //   }],
// //   perform: (op_inputs: Array<OpInput>) => {

            
// //     // // //split the inputs into the input associated with 
// //     const parent_input: OpInput = op_inputs.find(el => el.op_name === "profile");
// //     const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
// //     const profile_input: OpInput = op_inputs.find(el => el.inlet === 0);


// //      //now just get all the drafts
// //      const all_drafts: Array<Draft> = child_inputs
// //      .filter(el => el.inlet > 0)
// //      .reduce((acc, el) => {
// //        el.drafts.forEach(draft => {acc.push(draft)});
// //        return acc;
// //      }, []);


    
// //     if(child_inputs.length == 0) return Promise.resolve([]);
// //     if(profile_input === undefined || profile_input.drafts.length === 0) return Promise.resolve([]);

// //     //create an index of each row where there is a "true" for each warp
// //     const pd: Draft = profile_input.drafts[0];
// //     const warp_acrx_pattern:Array<number> = [];
// //     for(let j = 0; j < warps(pd.drawdown); j++){
// //       const col: Array<Cell> = pd.drawdown.map(el => el[j]);
// //       const found_ndx = col.findIndex(el => el.getHeddle()===true);
// //       if(found_ndx != -1) warp_acrx_pattern.push(found_ndx);
// //       else warp_acrx_pattern.push(0);
// //     }


    

// //     // //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
// //     const profile_draft_map = child_inputs
// //     .filter(el => el.inlet > 0)
// //     .map(el => {
// //       return  {
// //         id: el.inlet, 
// //         draft: el.drafts[0]
// //       }
// //     });

// //     let total_warps = 0;
// //     const warp_map = [];
// //     warp_acrx_pattern.forEach(el => {
// //       const d = profile_draft_map.find(dm => (dm.id) === el+1);
// //       if(d !== undefined){
// //         warp_map.push({id: el, start: total_warps, end: total_warps+warps(d.input.drawdown)});
// //         total_warps += warps(d.input.drawdown);
// //       } 
// //     })

// //     let total_wefts = utilInstance.getMaxWefts(all_drafts);
// //     const weft_map = [];
// //     // weft_acrx_pattern.forEach(el => {
// //     //   const d = profile_draft_map.find(dm => (dm.id) === el+1);
// //     //   if(d !== undefined){
// //     //     weft_map.push({id: el, start: total_wefts, end: total_wefts+wefts(d.drawdown)(input.drawdown)});
// //     //     total_wefts += warps(d.drawdown)(input.drawdown);
// //     //   } 
// //     // })

    
// //     const d: Draft =initDraftWithParams({
// //       warps: total_warps, 
// //       wefts: total_wefts,
// //     });

// //     for(let i = 0; i < wefts(d.drawdown); i++){
// //       for(let j = 0; j < warps(d.drawdown); j++){

// //         const warp_pattern_ndx = warp_map.find(el => j >= el.start && j < el.end).id;
// //         const select_draft = profile_draft_map.find(el => el.id === warp_pattern_ndx+1);
// //         if(select_draft === undefined){
// //           d.drawdown[i][j] = new Cell(null);
// //         }else{
// //           const sd: Draft = select_draft.draft;
// //           let val = sd.drawdown[i%wefts(sd.drawdown)][j%warps(sd.drawdown)].getHeddle();
// //           d.drawdown[i][j] = new Cell(val);
// //         }
// //       }
// //     }

// //     d.gen_name = formatName([], "profile");
// //     return  Promise.resolve([d]);

    
// //   }        
// // }

/** Do the same thing as in utilInstance w/ singleton */

