import { Injectable } from '@angular/core';
import { Cell } from '../../core/model/cell';
import { VaeService} from "../../core/provider/vae.service"
import { PatternfinderService} from "../../core/provider/patternfinder.service"
import utilInstance from '../../core/model/util';
import { SystemsService } from '../../core/provider/systems.service';
import { MaterialsService } from '../../core/provider/materials.service';
import * as _ from 'lodash';
import { ImageService } from '../../core/provider/image.service';
import { WorkspaceService } from '../../core/provider/workspace.service';
import { CombinatoricsService } from '../../core/provider/combinatorics.service';

import { applyMask, flipDraft, flipDrawdown, generateMappingFromPattern, getDraftName, initDraft, initDraftWithParams, invertDrawdown, isUp, pasteIntoDrawdown, shiftDrawdown, warps, wefts } from '../../core/model/drafts';
import { getLoomUtilByType, numFrames, numTreadles } from '../../core/model/looms';
import { Draft, Loom, LoomSettings } from '../../core/model/datatypes';

import * as defs from '../model/op_definitions';
import { BoolParam, DraftParam, NumParam, SelectParam, StringParam, 
  DynamicOperation, TreeOperation, buildTreeOp, format,
  OperationClassification, OpInput, BuildableOperation
} from '../model/operation';

export type Operation = TreeOperation | DynamicOperation ;
export { DynamicOperation, TreeOperation as ServiceOp } from '../model/operation';

@Injectable({
  providedIn: 'root'
})
export class OperationService {

  ops: Array<Operation> = [];
  dynamic_ops: Array<DynamicOperation> = [];
  classification: Array<OperationClassification> = [];

  constructor(
    private vae: VaeService, 
    private pfs: PatternfinderService,
    private ms: MaterialsService,
    private ss: SystemsService,
    private is: ImageService,
    private ws: WorkspaceService,
    private combos: CombinatoricsService
  ) { 

    function addOp(op: BuildableOperation) {
      let tree_op = buildTreeOp(op);
      this.ops.push(tree_op);
      return tree_op;
    }

    const rect = addOp(defs.rect);
    const clear = addOp(defs.clear);
    const set = addOp(defs.set);
    const unset = addOp(defs.unset);
    const apply_mats = addOp(defs.apply_mats);
    const rotate = addOp(defs.rotate);
    const interlace = addOp(defs.interlace);
    const selvedge = addOp(defs.selvedge);
    const overlay = addOp(defs.overlay);
    const mask = addOp(defs.mask);
    const atop = addOp(defs.atop);
    const knockout = addOp(defs.knockout);
    const fill = addOp(defs.fill);
    const tabby = addOp(defs.tabby);
    const basket = addOp(defs.basket);
    const tabby_der = addOp(defs.tabby_der);
    const stretch = addOp(defs.stretch);
    const resize = addOp(defs.resize);
    const margin = addOp(defs.margin);
    const crop = addOp(defs.crop);
    const trim = addOp(defs.trim);
    const rib = addOp(defs.rib);
    const twill = addOp(defs.twill);
    const complextwill = addOp(defs.complextwill);
    const waffle = addOp(defs.waffle);
    const satin = addOp(defs.satin);
    const random = addOp(defs.random);
    const shaded_satin = addOp(defs.shaded_satin);
    const makesymmetric = addOp(defs.makesymmetric);
    const invert = addOp(defs.invert);
    const flipx = addOp(defs.flipx);
    const flipy = addOp(defs.flipy);
    const shiftx = addOp(defs.shiftx);
    const shifty = addOp(defs.shifty);
    const slope = addOp(defs.slope);
    const replicate = addOp(defs.replicate);
    const variants = addOp(defs.variants);
    const bindweftfloats = addOp(defs.bindweftfloats);
    const bindwarpfloats = addOp(defs.bindwarpfloats);
    const layer = addOp(defs.layer);
    const tile = addOp(defs.tile);
    const chaos = addOp(defs.chaos);
    const erase_blank = addOp(defs.erase_blank);
    const jointop = addOp(defs.jointop);
    const joinleft = addOp(defs.joinleft);
    
    const splicein: Operation = {
      name: 'splice in wefts',
      displayname: 'splice in wefts',  
      old_names:[],
      dx: 'splices the second draft into the first every nth row',
      params: <Array<NumParam>>[  
        {name: 'pics between insertions',
        type: 'number',
        min: 1,
        max: 100,
        value: 1,
        dx: "the number of pics to keep between each splice row"
        },
        {name: 'repeat',
        type: 'boolean',
        falsestate: 'do not repeat inputs to match size',
        truestate: 'repeat inputs to match size',
        value: 1,
        dx: "controls if the inputs are repeated to make drafts of the same size or not"
      },
      {name: 'splice style',
      type: 'boolean',
      falsestate: 'line by line',
      truestate: 'whole draft',
      value: 0,
      dx: "controls if the whole draft is spliced in every nth weft or just the next pic in the draft"
    }],
        inlets: [{
          name: 'receiving draft', 
          type: 'static',
          value: null,
          dx: 'all the drafts you would like to interlace',
          num_drafts: 1
        },
        {
          name: 'splicing draft', 
          type: 'static',
          value: null,
          dx: 'the draft you would like to splice into the recieving draft',
          num_drafts: 1
        }
      ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'splice in wefts');
        const child_input = op_inputs.find(el => el.op_name == 'child');
        const static_inlet = op_inputs.find(el => el.inlet == 0);
        const splicing_inlet = op_inputs.find(el => el.inlet == 1);


        
        if(child_input === undefined) return Promise.resolve([]);
        if(static_inlet === undefined) return Promise.resolve([splicing_inlet.drafts[0]]);
        if(splicing_inlet === undefined) return Promise.resolve([static_inlet.drafts[0]]);
        const outputs: Array<Draft> = [];

        const static_input = static_inlet.drafts[0];
        const splicing_input = splicing_inlet.drafts[0];
        const factor_in_repeats = parent_input.params[1];
        const whole_draft = parent_input.params[2];

        const all_drafts = [static_input, splicing_input];

        let total_wefts: number = 0;
        if(factor_in_repeats === 1){
          let factors = [];
          if(whole_draft){
            factors = [wefts(static_input.drawdown), wefts(splicing_input.drawdown)*(parent_input.params[0]+wefts(splicing_input.drawdown))];
          }else{
            factors = [wefts(static_input.drawdown), wefts(splicing_input.drawdown)*(parent_input.params[0]+1)];
          }
          total_wefts = utilInstance.lcm(factors);
        }  
        else  {
          //sums the wefts from all the drafts
          total_wefts =all_drafts.reduce((acc, el) => {
            return acc + wefts(el.drawdown);
          }, 0);
  
        }
      
        let total_warps: number = 0;
        const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
      
        if(factor_in_repeats === 1)  total_warps = utilInstance.lcm(all_warps);
        else  total_warps = utilInstance.getMaxWarps(all_drafts);
      

        const uniqueSystemRows = this.ss.makeWeftSystemsUnique(all_drafts.map(el => el.rowSystemMapping));



        let array_a_ndx = 0;
        let array_b_ndx = 0;
      
        //create a draft to hold the merged values
        const d:Draft =initDraftWithParams({warps: total_warps, wefts:total_wefts, colShuttleMapping:static_input.colShuttleMapping, colSystemMapping:static_input.colSystemMapping});

        for(let i = 0; i < wefts(d.drawdown); i++){
          let select_array:number = 0;

          if(whole_draft){
            const cycle = parent_input.params[0] + wefts(splicing_input.drawdown);
            select_array = (i % (cycle) >= parent_input.params[0]) ? 1 : 0; 
          }else{
            select_array = (i % (parent_input.params[0]+1) ===parent_input.params[0]) ? 1 : 0; 
          } 


          if(!factor_in_repeats){
            if(array_b_ndx >=wefts(splicing_input.drawdown)) select_array = 0;
            if(array_a_ndx >=warps(static_input.drawdown)) select_array = 1;
          }
          
          let cur_weft_num = wefts(all_drafts[select_array].drawdown);
          let ndx = (select_array === 0) ? array_a_ndx%cur_weft_num : array_b_ndx%cur_weft_num;

          d.drawdown[i].forEach((cell, j) => {
            let cur_warp_num = warps(all_drafts[select_array].drawdown);
            cell.setHeddle(all_drafts[select_array].drawdown[ndx][j%cur_warp_num].getHeddle());
            if(j >= cur_warp_num && !factor_in_repeats) cell.setHeddle(null);
          });

          d.rowSystemMapping[i] = uniqueSystemRows[select_array][ndx];
          d.rowShuttleMapping[i] =all_drafts[select_array].rowShuttleMapping[ndx];


          if(select_array === 0){
            array_a_ndx++;
          } 
          else{
            array_b_ndx++;
          } 

        }
        // format.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
        d.gen_name = format.formatName(all_drafts, "splice")
        outputs.push(d);
        return Promise.resolve(outputs);
      }     
    }

    const spliceinwarps:Operation = {
      name: 'splice in warps',
      displayname: 'splice in warps',  
      old_names:[],
      dx: 'splices the second draft into the first every nth warp',
      params: <Array<NumParam>>[  
        {name: 'pics between insertions',
        type: 'number',
        min: 1,
        max: 100,
        value: 1,
        dx: "the number of ends to keep between each splice "
        },
        {name: 'repeat',
        type: 'boolean',
        falsestate: 'do not repeat inputs to match size',
        truestate: 'repeat inputs to match size',
        value: 1,
        dx: "controls if the inputs are repeated to make drafts of the same size or not"
      },
      {name: 'splice style',
      type: 'boolean',
      falsestate: 'line by line',
      truestate: 'whole draft',
      value: 0,
      dx: "controls if the whole draft is spliced in every nth warp or just the next end in the draft"
    }],
        inlets: [{
          name: 'receiving draft', 
          type: 'static',
          value: null,
          dx: 'all the drafts you would like to interlace',
          num_drafts: 1
        },
        {
          name: 'splicing draft', 
          type: 'static',
          value: null,
          dx: 'the draft you would like to splice into the recieving draft',
          num_drafts: 1
        }
      ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'splice in warps');
        const child_input = op_inputs.find(el => el.op_name == 'child');
        const static_inlet = op_inputs.find(el => el.inlet == 0);
        const splicing_inlet = op_inputs.find(el => el.inlet == 1);
        
        if(child_input === undefined) return Promise.resolve([]);
        if(static_inlet === undefined) return Promise.resolve([splicing_inlet.drafts[0]]);
        if(splicing_inlet === undefined) return Promise.resolve([static_inlet.drafts[0]]);
        const outputs: Array<Draft> = [];

        const static_input = static_inlet.drafts[0];
        const splicing_input = splicing_inlet.drafts[0];
        const factor_in_repeats = parent_input.params[1];
        const whole_draft = parent_input.params[2];

        const all_drafts = [static_input, splicing_input];

        let total_warps: number = 0;
        let factors: Array<number> = [];
        if(factor_in_repeats === 1){
          if(whole_draft){
            factors = [warps(static_input.drawdown), (warps(splicing_input.drawdown)*(parent_input.params[0]+warps(splicing_input.drawdown)))];
          }else{
            factors = [warps(static_input.drawdown), warps(splicing_input.drawdown)*(parent_input.params[0]+1)];
          }
          total_warps = utilInstance.lcm(factors);
        }  
        else  {
          //sums the warps from all the drafts
          total_warps =all_drafts.reduce((acc, el) => {
            return acc + warps(el.drawdown);
          }, 0);
        }
      
        let total_wefts: number = 0;
        const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
      
        if(factor_in_repeats === 1)  total_wefts = utilInstance.lcm(all_wefts);
        else  total_wefts = utilInstance.getMaxWefts(all_drafts);
      

        const uniqueSystemCols = this.ss.makeWarpSystemsUnique(all_drafts.map(el => el.colSystemMapping));

        let array_a_ndx = 0;
        let array_b_ndx = 0;
      
        //create a draft to hold the merged values
        const d:Draft = initDraftWithParams({warps: total_warps, wefts:total_wefts, rowShuttleMapping:static_input.rowShuttleMapping, rowSystemMapping:static_input.rowSystemMapping});

        for(let j = 0; j < warps(d.drawdown); j++){
          let select_array: number;
          if(whole_draft){
            const cycle = parent_input.params[0] + warps(splicing_input.drawdown);
            select_array = (j % (cycle) >= parent_input.params[0]) ? 1 : 0; 
          }else{
            select_array = (j % (parent_input.params[0]+1) ===parent_input.params[0]) ? 1 : 0; 
          } 


          if(!factor_in_repeats){
            if(array_b_ndx >=warps(splicing_input.drawdown)) select_array = 0;
            if(array_a_ndx >=warps(static_input.drawdown)) select_array = 1;
          }
          
          let cur_warp_num = warps(all_drafts[select_array].drawdown)
          let ndx = (select_array === 0) ? array_a_ndx%cur_warp_num : array_b_ndx%cur_warp_num;

          const col:Array<Cell> = d.drawdown.reduce((acc, el) => {
            acc.push(el[j]);
            return acc;
          }, [])


          col.forEach((cell, i) => {
            let cur_weft_num = wefts(all_drafts[select_array].drawdown);
            cell.setHeddle(all_drafts[select_array].drawdown[i%cur_weft_num][ndx].getHeddle());
            if(i >= cur_weft_num && !factor_in_repeats) cell.setHeddle(null);
          });

          d.colSystemMapping[j] = uniqueSystemCols[select_array][ndx];
          d.colShuttleMapping[j] =all_drafts[select_array].colShuttleMapping[ndx];


          if(select_array === 0){
            array_a_ndx++;
          } 
          else{
            array_b_ndx++;
          } 

        }
        // format.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
        d.gen_name = format.formatName(all_drafts, "splice")
        outputs.push(d);
        return Promise.resolve(outputs);
      }     
    }


    const assignwefts:Operation = {
      name: 'assign weft systems',
      displayname: 'assign weft systems', 
      old_names:[], 
      dx: 'splits each pic of the draft apart, allowing it to repeat at a specified interval and shift within that interval. Currently this will overwrite any system information that has been defined upstream',
      params: <Array<NumParam>>[  
        {name: 'total',
        type: 'number',
        min: 1,
        max: 26,
        value: 2,
        dx: "how many systems total"
        },
        {name: 'shift',
        type: 'number',
        min: 0,
        max: 26,
        value: 0,
        dx: "which posiiton to assign this draft"
        }],
      inlets: [
        {
          name: 'draft',
          type: 'static',
          value: null,
          dx: "the draft that will be assigned to a given system",
          num_drafts: 1
        }
      ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'assign weft systems');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);
        const outputs = [];
        const systems = [];

        //create a list of the systems
        for(let n = 0;  n <parent_input.params[0]; n++){
          const sys = ss.getWeftSystem(n);
          if(sys === undefined) ss.addWeftSystemFromId(n);
          systems[n] = n;
        }

        // const system_maps = [inputs[0]];
        // for(let i = 1; i <op_input.params[0]; i++){
        //   system_maps.push(new Draft({wefts:op_input.drafts[0].wefts, warps:op_input.drafts[0].warps}));
        // }

        // const uniqueSystemRows = this.ss.makeWeftSystemsUnique(system_maps.map(el => el.rowSystemMapping));

        const d:Draft =initDraftWithParams({
          warps:warps(child_input.drafts[0].drawdown), 
          wefts:wefts(child_input.drafts[0].drawdown)*parent_input.params[0], 
          colShuttleMapping:child_input.drafts[0].colShuttleMapping, 
          colSystemMapping:child_input.drafts[0].colSystemMapping,
          rowSystemMapping: systems});


        d.drawdown.forEach((row, i) => {
          const use_row = i %parent_input.params[0] ===parent_input.params[1];
          const use_index = Math.floor(i /parent_input.params[0]);
          //this isn't working
          //d.rowSystemMapping[i] = uniqueSystemRows[i %op_input.params[0]][use_index];
          row.forEach((cell, j)=> {
            if(use_row){
              d.rowShuttleMapping[i] =child_input.drafts[0].rowShuttleMapping[use_index];
              cell.setHeddle(child_input.drafts[0].drawdown[use_index][j].getHeddle());
            }else{
              cell.setHeddle(null);
            }
          })
        });
        
        // format.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
        d.gen_name = format.formatName(child_input.drafts, "assign wefts")
        const sys_char = String.fromCharCode(97 +parent_input.params[1]);
        d.gen_name = '-'+sys_char+':'+d.gen_name;
        outputs.push(d);
        return Promise.resolve(outputs);
      }     
    }

    const assignwarps:Operation = {
      name: 'assign warp systems',
      displayname: 'assign warp systems', 
      old_names:[], 
      dx: 'splits each warp of the draft apart, allowing it to repeat at a specified interval and shift within that interval. An additional button is used to specify if these systems correspond to layers, and fills in draft accordingly',
      params: <Array<NumParam>>[  
        {name: 'total',
        type: 'number',
        min: 1,
        max: 26,
        value: 2,
        dx: "how many warp systems (or layers) total"
        },
        {name: 'shift',
        type: 'number',
        min: 0,
        max: 26,
        value: 0,
        dx: "which system/layer to assign this draft"
        },
        {name: 'map warp systems to layers?',
        type: 'boolean',
        min: 0,
        max: 1,
        value: 0,
        dx: "fill in the draft such that each warp system corresponds to a layer (0 is top)"
        }
      ],
      inlets: [
        {
          name: 'draft',
          type: 'static',
          value: null,
          dx: "the draft that will be assigned to a given system",
          num_drafts: 1
        }
      ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'assign warp systems');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);

        const outputs = [];
        const systems = [];

        //create a list of the systems
        for(let n = 0;  n < parent_input.params[0]; n++){
          const sys = ss.getWarpSystem(n);
          if(sys === undefined) ss.addWarpSystemFromId(n);
          systems[n] = n;
        }
        
        const d:Draft =initDraftWithParams({
          warps:warps(child_input.drafts[0].drawdown)*parent_input.params[0], 
          wefts:wefts(child_input.drafts[0].drawdown), 
          rowShuttleMapping:child_input.drafts[0].rowShuttleMapping, 
          rowSystemMapping:child_input.drafts[0].rowSystemMapping,
          colSystemMapping: systems});


        d.drawdown.forEach((row, i) => {
          const row_is_null = utilInstance.hasOnlyUnset(child_input.drafts[0].drawdown[i]);
          row.forEach((cell, j)=> {
            const sys_id = j %parent_input.params[0];
            const use_col = sys_id ===parent_input.params[1];
            const use_index = Math.floor(j /parent_input.params[0]);
            //d.colSystemMapping[j] = uniqueSystemCols[sys_id][use_index];
            if(use_col){
              d.colShuttleMapping[j] =child_input.drafts[0].colShuttleMapping[use_index];
              cell.setHeddle(child_input.drafts[0].drawdown[i][use_index].getHeddle());
            }else{
              if(parent_input.params[2] == 1 && !row_is_null){
                if(sys_id <parent_input.params[1]){
                  cell.setHeddle(true);
                }else if(sys_id >=parent_input.params[1]){
                  cell.setHeddle(false);
                }
              }else{
                cell.setHeddle(null);
              }
            }
          })
        });
        

        
        // format.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
        d.gen_name = format.formatName(child_input.drafts, "assign warps")
        const sys_char = String.fromCharCode(97 +parent_input.params[1]);
        d.gen_name = '|'+sys_char+':'+d.gen_name;

        outputs.push(d);
        return Promise.resolve(outputs);
      }     
    }

    


    const vertcut:Operation = {
      name: 'vertical cut',
      displayname: 'vertical cut',  
      dx: 'make a vertical of this structure across two systems, representing the left and right side of an opening in the warp',
      old_names:[],
      params: <Array<NumParam>>[  
        {name: 'systems',
        type: 'number',
        min: 2,
        max: 100,
        value: 2,
        dx: "how many different systems you want to move this structure onto"
        }],
        inlets: [
          {
            name: 'draft',
            type: 'static',
            value: null,
            dx: "the draft that will be assigned to a given system",
            num_drafts: 1
          }
        ],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'vertical cut');
        const child_input = op_inputs.find(el => el.op_name == 'child');

        if(child_input === undefined) return Promise.resolve([]);


        const outputs: Array<Draft> = [];
        const outwefts =parent_input.params[0]*wefts(child_input.drafts[0].drawdown);

        const rep_inputs = [];

        for(let i = 0; i <parent_input.params[0]; i++){
          rep_inputs.push(_.cloneDeep(child_input.drafts[0]));
        }

        const uniqueSystemRows = this.ss.makeWeftSystemsUnique(rep_inputs.map(el => el.rowSystemMapping));

        for(let i = 0; i <parent_input.params[0]; i++){

          const d: Draft =initDraftWithParams({wefts: outwefts, warps:warps(child_input.drafts[0].drawdown), colShuttleMapping:child_input.drafts[0].colShuttleMapping, colSystemMapping:child_input.drafts[0].colSystemMapping});
          d.drawdown.forEach((row, row_ndx) => {
            row.forEach((cell, j) => {

              const use_row: boolean = row_ndx%parent_input.params[0] === i;
              const input_ndx: number = Math.floor(row_ndx /parent_input.params[0]);
              d.rowShuttleMapping[row_ndx] =child_input.drafts[0].rowShuttleMapping[input_ndx];


              if(use_row){
                cell.setHeddle(child_input.drafts[0].drawdown[input_ndx][j].getHeddle());
                d.rowSystemMapping[row_ndx] = uniqueSystemRows[i][input_ndx]
              } 
              else{
                cell.setHeddle(null);
                d.rowSystemMapping[row_ndx] = uniqueSystemRows[row_ndx%parent_input.params[0]][input_ndx]
              }
            });
          });

          d.gen_name = format.formatName(child_input.drafts, "cut+"+i)
          outputs.push(d);
        }
        return Promise.resolve(outputs);
      }     
    }
    
    const layernotation: DynamicOperation = {
      name: 'notation',
      displayname: 'layer notation',
      old_names:[],
      dynamic_param_id: 0,
      dynamic_param_type: 'notation',
      dx: 'uses a notation system to assign drafts to different warp and weft patterns on different layers. Layers are represented by () so (1a)(2b) puts warp1 and weft a on layer 1, warp 2 and weft b on layer 2',
      params: <Array<StringParam>>[
        {name: 'pattern',
        type: 'string',
        value: '(a1)(b2)',
        regex: /.*?\((.*?[a-xA-Z]*[\d]*.*?)\).*?/i, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
        error: 'invalid entry',
        dx: 'all system pairs must be listed as letters followed by numbers, layers are created by enclosing those system lists in pararenthesis. For example, the following are valid: (a1b2)(c3) or (c1)(a2). The following are invalid: (1a)(2b) or (2b'
        }
      ],
      inlets: [{
        name: 'systems draft', 
        type: 'static',
        value: null,
        dx: 'the draft that describes the system ordering we will add input structures within',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {


        // //split the inputs into the input associated with 
        const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "notation");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");

        if(child_inputs.length == 0) return Promise.resolve([]);

        //now just get all the drafts
        const all_drafts: Array<Draft> = child_inputs.reduce((acc, el) => {
          el.drafts.forEach(draft => {acc.push(draft)});
          return acc;
        }, []);



        const system_map = child_inputs.find(el => el.inlet === 0);

        if(system_map === undefined) return Promise.resolve([]); ;
       
        
        const draft_inlets = child_inputs.filter(el => el.inlet > 0).map(el => el.drafts[0]);

        let total_wefts: number = 0;
        const all_wefts = draft_inlets.map(el => wefts(el.drawdown)).filter(el => el > 0);
        total_wefts = utilInstance.lcm(all_wefts);

        let total_warps: number = 0;
        const all_warps = draft_inlets.map(el => warps(el.drawdown)).filter(el => el > 0);
        total_warps = utilInstance.lcm(all_warps);



        //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
        //get the total number of layers
        const system_draft_map = child_inputs
        .filter(el => el.inlet > 0)
        .map(el => {
          return  {
            wesy: el.params[0].match(/[a-zA-Z]+/g), //pull all the letters out into weft system ids
            wasy: el.params[0].match(/\d+/g), //pull out all the nubmers into warp systems
            i: 0,
            j: 0,
            layer: el.inlet-1, //map layer order to the inlet id, all inlets must be ordered the same as the input
            draft: el.drafts[0]
          }
        });


        
        system_draft_map.forEach(sdm => {
          if(sdm.wasy!== null) sdm.wasy = sdm.wasy.map(el => parseInt(el));
          else sdm.wasy = [-1];
          if(sdm.wesy === null) sdm.wesy = [''];
        })


        const d: Draft =initDraftWithParams({
          warps: total_warps*warps(system_map.drafts[0].drawdown), 
          wefts: total_wefts*wefts(system_map.drafts[0].drawdown),
          rowShuttleMapping: system_map.drafts[0].rowShuttleMapping.slice(),
          rowSystemMapping: system_map.drafts[0].rowSystemMapping.slice(),
          colShuttleMapping: system_map.drafts[0].colShuttleMapping.slice(),
          colSystemMapping: system_map.drafts[0].colSystemMapping.slice(),
        });

        for(let i = 0; i < wefts(d.drawdown); i++){
          let active_wesy = this.ss.getWeftSystem(d.rowSystemMapping[i]).name;
          const active_weft_entry = system_draft_map.find(el => el.wesy.findIndex(wesyel => wesyel === active_wesy) !== -1);
          let increment_flag = false;

          for(let j = 0; j < warps(d.drawdown); j++){
            let active_wasy = parseInt(this.ss.getWarpSystem(d.colSystemMapping[j]).name);

            
            const active_warp_entry = system_draft_map.find(el => el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1);
            const entry = system_draft_map.find(el => (el.wasy.findIndex(wasyel => wasyel === active_wasy) !== -1 && el.wesy.findIndex(wesyel => wesyel === active_wesy)!== -1));

            if(active_weft_entry === undefined || active_warp_entry === undefined){
              //no input draft is assigned to this system, set all as undefined
              d.drawdown[i][j] = new Cell(null);

            }else if(entry === undefined){
              //this is unassigned or its an an alternating layer. 
              //find the term in the list assigned to this. 
              //if this weft systems layer is > than the layer associted with this warp system, lower, if it is less, raise. 
              const wesy_layer = active_weft_entry.layer;
              const wasy_layer = active_warp_entry.layer;
              if(wasy_layer < wesy_layer) d.drawdown[i][j] = new Cell(true);
              else if(wasy_layer > wesy_layer) d.drawdown[i][j] = new Cell(false);
              else d.drawdown[i][j] = new Cell(null);
            }  
            else{
              d.drawdown[i][j] = new Cell(entry.draft.drawdown[entry.i][entry.j].getHeddle());
              entry.j = (entry.j+1)%warps(entry.draft.drawdown);
              increment_flag = true;
            }

          }

          if(increment_flag){
            active_weft_entry.i = (active_weft_entry.i+1) % wefts(active_weft_entry.draft.drawdown);
          } 


        }
        
        d.gen_name = format.formatName([], "notation");
        return  Promise.resolve([d]);

       
      }        
    }

    const warp_profile: DynamicOperation = {
      name: 'warp_profile',
      displayname: 'pattern across width',
      old_names:[],
      dynamic_param_id: 0,
      dynamic_param_type: 'profile',
      dx: 'if you describe a numeric pattern, it will repeat the inputs in the same pattern',
      params: <Array<StringParam>>[
        {name: 'pattern',
        type: 'string',
        value: 'a b c a b c',
        regex: /(?:[a-xA-Z][\ ]*).*?/, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
        error: 'invalid entry',
        dx: 'all entries must be numbers separated by a space'
        }
      ],
      inlets: [{
        name: 'weft pattern', 
        type: 'static',
        value: null,
        dx: 'optional, define a custom weft material or system pattern here',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

                
        // //split the inputs into the input associated with 
        const parent_input: OpInput = op_inputs.find(el => el.op_name === "warp_profile");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
        const weft_system: OpInput = op_inputs.find(el => el.inlet == 0);
  
        if(child_inputs.length == 0) return Promise.resolve([]);

        let weft_mapping;
        if(weft_system === undefined) weft_mapping =initDraftWithParams({warps: 1, wefts:1});
        else weft_mapping = weft_system.drafts[0];
    

        //now just get all the drafts
        const all_drafts: Array<Draft> = child_inputs
        .filter(el => el.inlet > 0)
        .reduce((acc, el) => {
          el.drafts.forEach(draft => {acc.push(draft)});
          return acc;
        }, []);
       
      
        let total_wefts: number = 0;
        const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
        total_wefts = utilInstance.lcm(all_wefts);


        let pattern = parent_input.params[0].split(' ');

  
        //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
        //get the total number of layers
        const profile_draft_map = child_inputs
        .map(el => {
          return  {
            id: el.inlet, 
            val: (el.params[0]).toString(),
            draft: el.drafts[0]
          }
        });


        console.log(profile_draft_map);
        let total_warps = 0;
        const warp_map = [];
        pattern.forEach(el => {
          const d = profile_draft_map.find(dm => dm.val === el.toString());
          if(d !== undefined){
            warp_map.push({id: d.id, start: total_warps, end: total_warps+warps(d.draft.drawdown)});
            total_warps += warps(d.draft.drawdown);
          } 
        })


    
        const d: Draft =initDraftWithParams({
          warps: total_warps, 
          wefts: total_wefts,
          rowShuttleMapping: weft_mapping.rowShuttleMapping,
          rowSystemMapping: weft_mapping.rowSystemMapping,
        });

        for(let i = 0; i < wefts(d.drawdown); i++){
          for(let j = 0; j < warps(d.drawdown); j++){


            const pattern_ndx = warp_map.find(el => j >= el.start && j < el.end).id;
            const select_draft = profile_draft_map.find(el => el.id === parseInt(pattern_ndx));
            //console.log("Looking for ", pattern_ndx, "in", profile_draft_map);

            if(select_draft === undefined){
              d.drawdown[i][j] = new Cell(null);
            }else{
              const sd: Draft = select_draft.draft;
              const sd_adj_j: number = j - warp_map.find(el => j >= el.start && j < el.end).start;
              let val = sd.drawdown[i%wefts(sd.drawdown)][sd_adj_j%warps(sd.drawdown)].getHeddle();
              d.drawdown[i][j] = new Cell(val);
            }
          }
        }

        d.gen_name = format.formatName([], "warp profile");
        return  Promise.resolve([d]);

       
      }        
    }

    const sample_width: DynamicOperation = {
      name: 'sample_width',
      displayname: 'variable width sampler',
      old_names:[],
      dynamic_param_id: 0,
      dynamic_param_type: 'profile',
      dx: 'use a letter for each input pattern. Follow the letter by a number to describe how many ends upon which the designated structure should repeat. Separate by spaces. For example, a21 will place struture a across 21 ends. Height is determined by the inputs',
      params: <Array<StringParam>>[
        {name: 'pattern',
        type: 'string',
        value: 'a20 b20 a40 b40',
        regex:/(?:[a-xA-Z][\d]*[\ ]*).*?/, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
        error: 'invalid entry',
        dx: 'all entries must be a single letter followed by a number, which each letter-number unit separated by a space'
        }
      ],
      inlets: [],
      perform: (op_inputs: Array<OpInput>) => {

                
        // //split the inputs into the input associated with 
        const parent_input: OpInput = op_inputs.find(el => el.op_name === "sample_width");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
        const weft_system: OpInput = op_inputs.find(el => el.inlet == 0);
  

        if(child_inputs.length == 0) return Promise.resolve([]);

        let weft_mapping;
        if(weft_system === undefined) weft_mapping =initDraftWithParams({warps: 1, wefts:1});
        else weft_mapping = weft_system.drafts[0];
    

        //now just get all the drafts
        const all_drafts: Array<Draft> = child_inputs
        .reduce((acc, el) => {
          el.drafts.forEach(draft => {acc.push(draft)});
          return acc;
        }, []);
       
      
        let total_wefts: number = 0;
        const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
        total_wefts = utilInstance.lcm(all_wefts);


        let pattern = parent_input.params[0].split(' ');

  
        //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
        //get the total number of layers
        const profile_draft_map = child_inputs
        .map(el => {
          return  {
            id: el.inlet, 
            val: el.params[0].toString(),
            draft: el.drafts[0]
          }
        });

        let total_warps = 0;
        const warp_map = [];
        pattern.forEach(el => {
          const label = el.charAt(0);
          const qty =parseInt((<string>el).substring(1))
          const d = profile_draft_map.find(dm => dm.val === label.toString());
          if(d !== undefined){
            warp_map.push({id: d.id, start: total_warps, end: total_warps+qty});
            total_warps += qty;
          } 
        })


    
        const d: Draft =initDraftWithParams({
          warps: total_warps, 
          wefts: total_wefts,
          rowShuttleMapping: weft_mapping.rowShuttleMapping,
          rowSystemMapping: weft_mapping.rowSystemMapping,
        });

        for(let i = 0; i < wefts(d.drawdown); i++){
          for(let j = 0; j < warps(d.drawdown); j++){

            const pattern_ndx = warp_map.find(el => j >= el.start && j < el.end).id;
            const select_draft = profile_draft_map.find(el => el.id === parseInt(pattern_ndx));

            if(select_draft === undefined){
              d.drawdown[i][j] = new Cell(null);
            }else{
              const sd: Draft = select_draft.draft;
              const sd_adj_j: number = j - warp_map.find(el => j >= el.start && j < el.end).start;
              let val = sd.drawdown[i%wefts(sd.drawdown)][sd_adj_j%warps(sd.drawdown)].getHeddle();
              d.drawdown[i][j] = new Cell(val);
            }
          }
        }

        d.gen_name = format.formatName([], "warp profile");
        return  Promise.resolve([d]);

       
      }        
    }

    // const profile: DynamicOperation = {
    //   name: 'profile',
    //   displayname: 'profile draft',
    //   old_names:[],
    //   dynamic_param_id: 0,
    //   dynamic_param_type: 'draft',
    //   dx: 'if you describe a numeric pattern, it will repeat the inputs in the same pattern',
    //   params: <Array<DraftParam>>[
    //     {name: 'profile draft',
    //     type: 'draft',
    //     value: null,
    //     dx: '',
    //     id: -1
    //     }
    //   ],
    //   inlets: [{
    //     name: 'profile pattern', 
    //     type: 'static',
    //     value: null,
    //     dx: 'uses the threading and treadling on the input to generate inputs for the profile',
    //     num_drafts: 1
    //   }],
    //   perform: (op_inputs: Array<OpInput>) => {

                
    //     // // //split the inputs into the input associated with 
    //     const parent_input: OpInput = op_inputs.find(el => el.op_name === "profile");
    //     const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
    //     const profile_input: OpInput = op_inputs.find(el => el.inlet === 0);


    //      //now just get all the drafts
    //      const all_drafts: Array<Draft> = child_inputs
    //      .filter(el => el.inlet > 0)
    //      .reduce((acc, el) => {
    //        el.drafts.forEach(draft => {acc.push(draft)});
    //        return acc;
    //      }, []);

        
    //     if(child_inputs.length == 0) return Promise.resolve([]);
    //     if(profile_input === undefined || profile_input.drafts.length === 0) return Promise.resolve([]);

    //     //create an index of each row where there is a "true" for each warp
    //     const pd: Draft = profile_input.drafts[0];
    //     const warp_acrx_pattern:Array<number> = [];
    //     for(let j = 0; j < warps(pd.drawdown); j++){
    //       const col: Array<Cell> = pd.drawdown.map(el => el[j]);
    //       const found_ndx = col.findIndex(el => el.getHeddle()===true);
    //       if(found_ndx != -1) warp_acrx_pattern.push(found_ndx);
    //       else warp_acrx_pattern.push(0);
    //     }
  
    //     // //create a map that associates each warp and weft system with a draft, keeps and index, and stores a layer. 
    //     const profile_draft_map = child_inputs
    //     .filter(el => el.inlet > 0)
    //     .map(el => {
    //       return  {
    //         id: el.inlet, 
    //         draft: el.drafts[0]
    //       }
    //     });

    //     let total_warps = 0;
    //     const warp_map = [];
    //     warp_acrx_pattern.forEach(el => {
    //       const d = profile_draft_map.find(dm => (dm.id) === el+1);
    //       if(d !== undefined){
    //         warp_map.push({id: el, start: total_warps, end: total_warps+warps(d.draft.drawdown)});
    //         total_warps += warps(d.draft.drawdown);
    //       } 
    //     })

    //     let total_wefts = utilInstance.getMaxWefts(all_drafts);
    //     const weft_map = [];
    //     // weft_acrx_pattern.forEach(el => {
    //     //   const d = profile_draft_map.find(dm => (dm.id) === el+1);
    //     //   if(d !== undefined){
    //     //     weft_map.push({id: el, start: total_wefts, end: total_wefts+wefts(d.drawdown)(draft.drawdown)});
    //     //     total_wefts += warps(d.drawdown)(draft.drawdown);
    //     //   } 
    //     // })

        
    //     const d: Draft =initDraftWithParams({
    //       warps: total_warps, 
    //       wefts: total_wefts,
    //     });

    //     for(let i = 0; i < wefts(d.drawdown); i++){
    //       for(let j = 0; j < warps(d.drawdown); j++){

    //         const warp_pattern_ndx = warp_map.find(el => j >= el.start && j < el.end).id;
    //         const select_draft = profile_draft_map.find(el => el.id === warp_pattern_ndx+1);
    //         if(select_draft === undefined){
    //           d.drawdown[i][j] = new Cell(null);
    //         }else{
    //           const sd: Draft = select_draft.draft;
    //           let val = sd.drawdown[i%wefts(sd.drawdown)][j%warps(sd.drawdown)].getHeddle();
    //           d.drawdown[i][j] = new Cell(val);
    //         }
    //       }
    //     }

    //     d.gen_name = format.formatName([], "profile");
    //     return  Promise.resolve([d]);

       
    //   }        
    // }
   
    const assignlayers: DynamicOperation = {
      name: 'assignlayers',
      displayname: 'assign drafts to layers',
      old_names:[],
      dx: 'when given a number of layers, it creates inputs to assign one or more drafts to each the specified layer. You are allowed to specify a weft system with the input to each layer, this controls the ordering of the input drafts in the layers. For instance, if you give layer 1 system a, and layer 2 system b, your output draft will order the rows ababab.... If you give two inputs to layer 1 and assign them to system a, then one input layer 2, and give it system b, the output will order the rows aabaab. This essentially allows you to control weft systems at the same time as layers, aligning weft systems across multiple drafts. Systems will always be organized alphbetically, and blank rows will be inserted in place of unused systems. For instance, if you have two layers and you assign them to systems a and c, the code will insert a blank system b for the resulting pattern of abcabcabc....',
      dynamic_param_type: 'system',
      dynamic_param_id: 0,
      inlets: [],
      params: [
        <NumParam> {name: 'layers',
          type: 'number',
          min: 1,
          max: 100,
          value: 2,
          dx: 'the total number of layers in this cloth'
        },
        <BoolParam> {name: 'repeat',
          type: 'boolean',
          value: 1,
          truestate: 'repeat inputs to matching size',
          falsestate: 'do not repeat inputs to matching size',
          dx: 'automatically adjust the width and height of draft to ensure equal repeats (checked) or just assign to layers directly as provided'
        }
      ],
      perform: (inputs: Array<OpInput>) => {
        
        //split the inputs into the input associated with 
        const parent_inputs: Array<OpInput> = inputs.filter(el => el.op_name === "assignlayers");
        const child_inputs: Array<OpInput> = inputs.filter(el => el.op_name === "child");
        
        //parent param
        const num_layers = parent_inputs[0].params[0];
        const factor_in_repeats = parent_inputs[0].params[1];
  
  
        //now just get all the drafts
        const all_drafts: Array<Draft> = child_inputs.reduce((acc, el) => {
           el.drafts.forEach(draft => {acc.push(draft)});
           return acc;
        }, []);
      
        if (all_drafts.length === 0) return Promise.resolve([]);
        
        let total_wefts: number = 0;
        const all_wefts = all_drafts.map(el => wefts(el.drawdown)).filter(el => el > 0);
        if(factor_in_repeats === 1)  total_wefts = utilInstance.lcm(all_wefts);
        else  total_wefts = utilInstance.getMaxWefts(all_drafts);
  
        let total_warps: number = 0;
        const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
        if(factor_in_repeats === 1)  total_warps = utilInstance.lcm(all_warps);
        else  total_warps = utilInstance.getMaxWarps(all_drafts);
  
        const layer_draft_map: Array<any> = child_inputs.map((el, ndx) => { return {layer: el.inlet, system: el.params[0], drafts: el.drafts}}); 
  
        const max_system = layer_draft_map.reduce((acc, el) => {
          if(el.system > acc) return el.system;
          return acc;
        }, 0);
  
        const outputs = [];
        const warp_systems = [];  

        //create a list of systems as large as the total number of layers
        for(let n = 0;  n < num_layers; n++){
          const sys = ss.getWarpSystem(n);
          if(sys === undefined) ss.addWarpSystemFromId(n);
          warp_systems[n] = n;
        }
  
        const layer_draft_map_sorted = [];
        //sort the layer draft map by system, push empty drafts
        for(let i = 0; i <= max_system; i++){
          const ldms:Array<any> = layer_draft_map.filter(el => el.system == i);
          if(ldms.length == 0){
            layer_draft_map_sorted.push({layer: -1, system: i, drafts:[]})
          }else{
            ldms.forEach(ldm => {layer_draft_map_sorted.push(ldm);})
          }
        }
  
        layer_draft_map_sorted.forEach(layer_map => {

        const layer_num = layer_map.layer;
        if (layer_num < 0) {
          outputs.push(initDraftWithParams(
            {warps: total_warps*warp_systems.length, 
              wefts: total_wefts,
              rowSystemMapping: [layer_map.system]}));
        } else {
          layer_map.drafts.forEach(draft => {
            const d:Draft =initDraftWithParams({
              warps:total_warps*warp_systems.length, 
              wefts:total_wefts, 
              rowShuttleMapping:draft.rowShuttleMapping, 
              rowSystemMapping: [layer_map.system],
              colShuttleMapping: draft.colShuttleMapping,
              colSystemMapping: warp_systems
            });
          
            d.drawdown.forEach((row, i) => {
              row.forEach((cell, j)=> {
                const sys_id = j % num_layers;
                const use_col = sys_id === layer_num;
                const use_index = Math.floor(j /num_layers);
                if(use_col){
                  //handle non-repeating here if we want
                  if (factor_in_repeats == 1) {
                    d.colShuttleMapping[j] = draft.colShuttleMapping[use_index%warps(draft.drawdown)];
                    cell.setHeddle(draft.drawdown[i%wefts(draft.drawdown)][use_index%warps(draft.drawdown)].getHeddle());
                  } else {
                    if(i < wefts(draft.drawdown) && use_index < warps(draft.drawdown)) cell.setHeddle(draft.drawdown[i][use_index].getHeddle());
                    else cell.setHeddle(null);
                  }
                
                } else {
                  if(sys_id < layer_num){
                    cell.setHeddle(true);
                  } else if(sys_id >=layer_num) {
                    cell.setHeddle(false);
                  }
                }
              })
            });
            d.gen_name = format.formatName([draft], "");
            outputs.push(d);
          });
        }
      });
  
      //outputs has all the drafts now we need to interlace them (all layer 1's then all layer 2's)
      const pattern: Array<Array<Cell>> = [];
      const row_sys_mapping: Array<number> = [];
      const row_shut_mapping: Array<number> = [];
      for (let i = 0; i < total_wefts * outputs.length; i++) {
        pattern.push([]);
        const use_draft_id = i % outputs.length;
        const use_row = Math.floor(i / outputs.length);
        row_sys_mapping.push(outputs[use_draft_id].rowSystemMapping[use_row])
        row_shut_mapping.push(outputs[use_draft_id].rowShuttleMapping[use_row])
        for (let j = 0; j < total_warps * warp_systems.length; j++) {
          const val:boolean = outputs[use_draft_id].drawdown[use_row][j].getHeddle();
          pattern[i].push(new Cell(val));
        }
      }
  
      const interlaced = initDraftWithParams({
        warps: total_warps * warp_systems.length,
        wefts: total_wefts * outputs.length,
        colShuttleMapping: outputs[0].colShuttleMapping,
        colSystemMapping: warp_systems,
        pattern: pattern,
        rowSystemMapping: row_sys_mapping,
        rowShuttleMapping: row_shut_mapping
      });
     
      interlaced.gen_name = format.formatName(outputs, "layer");
      return Promise.resolve([interlaced]);
      }      
    }      
    
    const imagemap: DynamicOperation = {
      name: 'imagemap',
      displayname: 'image map',
      old_names:[],
      dx: 'uploads an image and creates an input for each color found in the image. Assigning a draft to the color fills the color region with the selected draft',
      dynamic_param_type: 'color',
      dynamic_param_id: 0,
      inlets: [],
      params: <Array<NumParam>>[
          {name: 'image file (.jpg or .png)',
          type: 'file',
          min: 1,
          max: 100,
          value: 'noinput',
          dx: 'the total number of layers in this cloth'
        },
        {name: 'draft width',
        type: 'number',
        min: 1,
        max: 10000,
        value: 300,
        dx: 'resize the input image to the width specified'
      },
        {name: 'draft height',
        type: 'number',
        min: 1,
        max: 10000,
        value: 200,
        dx: 'resize the input image to the height specified'
    }
      ],
      perform: (op_inputs: Array<OpInput>)=> {
          
        //split the inputs into the input associated with 
        const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "imagemap");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");

        const image_data = this.is.getImageData(parent_inputs[0].params[0]);
        const res_w = parent_inputs[0].params[1];
        const res_h = parent_inputs[0].params[2];


        if(image_data === undefined) return Promise.resolve([]);
        const data = image_data.data;

        //we need to flip the image map here because it will be flipped back on return. 

        const fliped_image = [];
        data.image_map.forEach(row => {
          fliped_image.unshift(row);
        })


        const color_to_drafts = data.colors.map((color, ndx) => {
          const child_of_color = child_inputs.find(input => (input.params.findIndex(param => param === color) !== -1));
          if(child_of_color === undefined) return {color: color, draft: null};
          else return {color: color, draft: child_of_color.drafts[0]};
        });


        const pattern: Array<Array<Cell>> = [];
        for(let i = 0; i < res_h; i++){
          pattern.push([]);
          for(let j = 0; j < res_w; j++){

            const i_ratio = data.height / res_h;
            const j_ratio = data.width / res_w;

            const map_i = Math.floor(i * i_ratio);
            const map_j = Math.floor(j * j_ratio);

            const color_ndx = fliped_image[map_i][map_j]; //
            const color_draft = color_to_drafts[color_ndx].draft;

            if(color_draft === null) pattern[i].push(new Cell(false));
            else {
              const draft_i = i % wefts(color_draft.drawdown);
              const draft_j = j % warps(color_draft.drawdown);
              pattern[i].push(new Cell(color_draft.drawdown[draft_i][draft_j].getHeddle()));
            }

          }
        }

        

        let first_draft: Draft = null;
        child_inputs.forEach(el =>{
          if(el.drafts.length > 0 && first_draft == null) first_draft = el.drafts[0];
        });

        if(first_draft == null) first_draft =initDraftWithParams({warps: 1, wefts: 1, pattern: [[new Cell(null)]]})

        

        const draft: Draft =initDraftWithParams({
          wefts: res_h, 
          warps: res_w,
           pattern: pattern,
          rowSystemMapping: first_draft.rowSystemMapping,
          rowShuttleMapping: first_draft.rowShuttleMapping,
          colSystemMapping: first_draft.colSystemMapping,
          colShuttleMapping: first_draft.colShuttleMapping});

      return Promise.resolve([draft]);

      }
      
    }

    const dynamic_join_left: DynamicOperation = {
      name: 'dynamicjoinleft',
      displayname: 'subdivide width',
      old_names:[],
      dynamic_param_id: 0,
      dynamic_param_type: "number",
      dx: 'subdivides the width of the weave into equal sized sections, then, takes each input draft and assign it a division from left to right',
      params: <Array<NumParam>>[   
        {name: 'divisions',
        type: 'number',
        min: 1,
        max: 100,
        value: 3,
        dx: 'the number of equally sized divisions to include in the draft'
    },
    {name: 'width',
      type: 'number',
      min: 1,
      max: 10000,
      value: 100,
      dx: 'the total width of the draft'
    }],
    inlets: [
      {
        name: 'weft pattern', 
        type: 'static',
        value: null,
        dx: 'optional, define a custom weft material or system pattern here',
        num_drafts: 1
      }
    ],
      perform: (op_inputs: Array<OpInput>) => {
      
        //split the inputs into the input associated with 
        const parent_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "dynamicjoinleft");
        const child_inputs: Array<OpInput> = op_inputs.filter(el => el.op_name === "child");
        const warp_system = op_inputs.find(el => el.inlet == 0);

          console.log("child inputs", child_inputs);

        let weft_mapping;
        if(warp_system === undefined) weft_mapping =initDraftWithParams({warps: 1, wefts:1});
        else weft_mapping = warp_system.drafts[0];
       
        //parent param
        const sections = parent_inputs[0].params[0];
        const total_width = parent_inputs[0].params[1];
      
        const warps_in_section = Math.ceil(total_width / sections);
      
        //now just get all the drafts, in the order of their assigned inlet
        const max_inlet = child_inputs.reduce((acc, el) => {
          if(el.inlet > acc){
            acc = el.inlet
          } 
          return acc;
        }, 0);

        const all_drafts: Array<Draft> = [];
        for(let l = 0; l <= max_inlet; l++){
          const inlet_inputs = child_inputs.filter(el => el.inlet == l);
          inlet_inputs.forEach(el => {
            all_drafts.push(el.drafts[0]);
          })
        };


       if(all_drafts.length === 0) return Promise.resolve([]);
       
       let total_warps: number = 0;
       const all_warps = all_drafts.map(el => warps(el.drawdown)).filter(el => el > 0);
        total_warps = utilInstance.lcm(all_warps);


        const section_draft_map: Array<any> = child_inputs.map(el => { return {section: el.params[0]-1, draft: el.drafts.shift()}}); 
        const d:Draft =initDraftWithParams({
          warps:total_width, 
          wefts:total_warps,
          rowShuttleMapping: weft_mapping.rowShuttleMapping,
          rowSystemMapping: weft_mapping.rowSystemMapping
         });

         d.drawdown.forEach((row, i) => {
          row.forEach((cell, j) => {
              const use_section = Math.floor(j / warps_in_section);
              const warp_in_section = j % warps_in_section;
              const use_draft_map = section_draft_map.find(el => el.section === use_section);
              if(use_draft_map !== undefined){
                const use_draft = use_draft_map.draft;
                cell.setHeddle(use_draft.drawdown[i%wefts(use_draft.drawdown)][warp_in_section%warps(use_draft.drawdown)].getHeddle());
              }
          });
         });

         d.colShuttleMapping.forEach((val, j) => {
              const use_section = Math.floor(j / warps_in_section);
              const warp_in_section = j % warps_in_section;
              const use_draft_map = section_draft_map.find(el => el.section === use_section);
              if(use_draft_map !== undefined){
                const use_draft = use_draft_map.draft;
                val = use_draft.colShuttleMapping[warp_in_section%warps(use_draft.drawdown)];
                d.colSystemMapping = use_draft.colSystemMapping[warp_in_section%warps(use_draft.drawdown)];
              }
         });



        return Promise.resolve([d]);
        
      }
    }

    const germanify: Operation = {
      name: 'gemanify',
      displayname: 'germanify',
      old_names:[],
      dx: 'uses ML to edit the input based on patterns in a german drafts weave set',
      params: <Array<NumParam>>[
        {name: 'output selection',
        type: 'number',
        min: 1,
        max: 10,
        value: 1,
        dx: 'which pattern to select from the variations'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to germanify',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name === "gemanify");
        const child_input= op_inputs.find(el => el.op_name === "child");
        
        if(child_input === undefined) return Promise.resolve([]);
        const inputDraft =child_input.drafts[0]

        const loom_settings:LoomSettings = {
          type: 'frame',
          epi: 10, 
          units: 'in',
          frames: 8,
          treadles: 10
        }
        const utils = getLoomUtilByType('frame');
        return utils.computeLoomFromDrawdown(inputDraft.drawdown, loom_settings, 0).then(loom => {
          let pattern = this.pfs.computePatterns(loom.threading, loom.treadling, inputDraft.drawdown);
          const draft_seed =  utilInstance.patternToSize(pattern, 48, 48);
  
    
          return this.vae.generateFromSeed(draft_seed, 'german')
            .then(suggestions => suggestions.map(suggestion => {
                    const treadlingSuggest = this.pfs.getTreadlingFromArr(suggestion);
                    const threadingSuggest = this.pfs.getThreadingFromArr(suggestion);
                    const pattern = this.pfs.computePatterns(threadingSuggest, treadlingSuggest, suggestion)
                    const draft:Draft =initDraftWithParams({warps: pattern[0].length, wefts: pattern.length});
                      for (var i = 0; i < pattern.length; i++) {
                        for (var j = 0; j < pattern[i].length; j++) {
                            draft.drawdown[i][j].setHeddle((pattern[i][j] == 1 ? true : false));
                        }
                      }
  
                      format.transferSystemsAndShuttles(draft,child_input.drafts,parent_input.params, 'first');
                      draft.gen_name = format.formatName(child_input.drafts, "germanify");
                    return draft
                  
                  })
                )

        });

       
       
        }
    }  

    const crackleify: Operation = {
      name: 'crackle-ify',
      displayname: 'crackle-ify',
      old_names:[],
      dx: 'uses ML to edit the input based on patterns in a german drafts weave set',
      params: <Array<NumParam>>[
        {name: 'output selection',
        type: 'number',
        min: 1,
        max: 10,
        value: 1,
        dx: 'which pattern to select from the variations'
        }
      ],
      inlets: [{
        name: 'draft', 
        type: 'static',
        value: null,
        dx: 'the draft to craclify',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name === "crackle-ify");
        const child_input= op_inputs.find(el => el.op_name === "child");
        if(child_input === undefined) return Promise.resolve([]);

        if(child_input.drafts.length === 0) return Promise.resolve([]);
        const inputDraft =child_input.drafts[0]

        const loom_settings:LoomSettings = {
          type: 'frame',
          epi: 10, 
          units: 'in',
          frames: 8,
          treadles: 10
        }
        const utils = getLoomUtilByType('frame');
        return utils.computeLoomFromDrawdown(inputDraft.drawdown, loom_settings,  0).then(loom => {
          let pattern = this.pfs.computePatterns(loom.threading, loom.treadling, inputDraft.drawdown);
      
          const draft_seed =  utilInstance.patternToSize(pattern, 52, 52);
    
          return this.vae.generateFromSeed(draft_seed, 'crackle_weave')
            .then(suggestions => suggestions.map(suggestion => {
              
              const treadlingSuggest = this.pfs.getTreadlingFromArr(suggestion);
              const threadingSuggest = this.pfs.getThreadingFromArr(suggestion);
              const pattern = this.pfs.computePatterns(threadingSuggest, treadlingSuggest, suggestion)
              const draft:Draft =initDraftWithParams({warps: pattern[0].length, wefts: pattern.length});
                for (var i = 0; i < pattern.length; i++) {
                  for (var j = 0; j < pattern[i].length; j++) {
                      draft.drawdown[i][j].setHeddle((pattern[i][j] == 1 ? true : false));
                  }
                }
                // format.transferSystemsAndShuttles(draft,child_input.drafts,parent_input.params, 'first');
                // draft.gen_name = format.formatName(child_input.drafts, "crackleify");
              return draft
            }));
                  
              
          });  
      }
    }  
      
    const makedirectloom: Operation = {
      name: 'direct loom',
      displayname: 'generate direct tie loom threading and lift plan',
      old_names:[],
      dx: 'uses the input draft as drawdown and generates a threading and lift plan pattern',
      params: [],
      inlets: [{
        name: 'drawdown', 
        type: 'static',
        value: null,
        dx: 'the drawdown from which to create threading, tieup and treadling data from',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name === "direct loom");
        const child_input= op_inputs.find(el => el.op_name === "child");

        if(child_input === undefined || child_input.drafts === undefined) return Promise.resolve([]);

      
        const loom_settings:LoomSettings = {
          type: 'direct',
          epi: 10, 
          units: 'in',
          frames: 8,
          treadles: 8
        }
        const utils = getLoomUtilByType(loom_settings.type);
        return utils.computeLoomFromDrawdown(child_input.drafts[0].drawdown, loom_settings, this.ws.selected_origin_option)
        .then(l => {

          const frames = Math.max(numFrames(l), loom_settings.frames);
          const treadles = Math.max(numTreadles(l), loom_settings.treadles);
        
          const threading: Draft =initDraftWithParams({warps:warps(child_input.drafts[0].drawdown), wefts: frames});
        l.threading.forEach((frame, j) =>{
          if(frame !== -1) threading.drawdown[frame][j].setHeddle(true);
        });
        threading.gen_name = "threading"+getDraftName(child_input.drafts[0]);

        const treadling: Draft =initDraftWithParams({warps:treadles, wefts:wefts(child_input.drafts[0].drawdown)});   
        l.treadling.forEach((treadle_row, i) =>{
          treadle_row.forEach(treadle_num => {
            treadling.drawdown[i][treadle_num].setHeddle(true);
          })
        });
        treadling.gen_name = "treadling_"+getDraftName(child_input.drafts[0]);


        const tieup: Draft =initDraftWithParams({warps: treadles, wefts: frames});
        l.tieup.forEach((row, i) => {
          row.forEach((val, j) => {
            tieup.drawdown[i][j].setHeddle(val);
          })
        });
        tieup.gen_name = "tieup_"+getDraftName(child_input.drafts[0]);
        return Promise.resolve([threading, tieup, treadling]);



        });

      }


    }   

    const makeloom: Operation = {
      name: 'floor loom',
      displayname: 'generate floor loom threading and treadling',
      old_names:[],
      dx: 'uses the input draft as drawdown and generates a threading, tieup and treadling pattern',
      params: [],
      inlets: [{
        name: 'drawdown', 
        type: 'static',
        value: null,
        dx: 'the drawdown from which to create threading, tieup and treadling data from',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {

        const parent_input = op_inputs.find(el => el.op_name === "floor loom");
        const child_input= op_inputs.find(el => el.op_name === "child");

        if(child_input === undefined || child_input.drafts === undefined) return Promise.resolve([]);

        const loom_settings:LoomSettings = {
          type: 'frame',
          epi: 10, 
          units: 'in',
          frames: 8,
          treadles: 10
        }
        const utils = getLoomUtilByType(loom_settings.type);
        return utils.computeLoomFromDrawdown(child_input.drafts[0].drawdown, loom_settings, this.ws.selected_origin_option)
        .then(l => {

          const frames = Math.max(numFrames(l), loom_settings.frames);
          const treadles = Math.max(numTreadles(l), loom_settings.treadles);
       
          const threading: Draft =initDraftWithParams({warps:warps(child_input.drafts[0].drawdown), wefts: frames});
        l.threading.forEach((frame, j) =>{
          if(frame !== -1) threading.drawdown[frame][j].setHeddle(true);
        });
        threading.gen_name = "threading"+getDraftName(child_input.drafts[0]);

        const treadling: Draft =initDraftWithParams({warps:treadles, wefts:wefts(child_input.drafts[0].drawdown)});   
        l.treadling.forEach((treadle_row, i) =>{
          treadle_row.forEach(treadle_num => {
            treadling.drawdown[i][treadle_num].setHeddle(true);
          })
        });
        treadling.gen_name = "treadling_"+getDraftName(child_input.drafts[0]);

        const tieup: Draft =initDraftWithParams({warps: treadles, wefts: frames});
        l.tieup.forEach((row, i) => {
          row.forEach((val, j) => {
            tieup.drawdown[i][j].setHeddle(val);
          })
        });
        tieup.gen_name = "tieup_"+getDraftName(child_input.drafts[0]);
        return Promise.resolve([threading, tieup, treadling]);
        });
      }
    }

    const drawdown: Operation = {
      name: 'drawdown',
      displayname: 'make drawdown from threading, tieup, and treadling',
      old_names:[],
      dx: 'create a drawdown from the input drafts (order 1. threading, 2. tieup, 3.treadling)',
      params: [
  
      ],
      inlets: [{
        name: 'threading', 
        type: 'static',
        value: null,
        dx: 'the draft to use as threading',
        num_drafts: 1
      }, {
        name: 'tieup', 
        type: 'static',
        value: null,
        dx: 'the draft to use as tieup',
        num_drafts: 1
      },
      {
        name: 'treadling', 
        type: 'static',
        value: null,
        dx: 'the draft to use as treadling',
        num_drafts: 1
      }
      ],
      perform: (op_inputs: Array<OpInput>) => {
  
        const parent_input = op_inputs.find(el => el.op_name === "floor loom");
        const child_input= op_inputs.find(el => el.op_name === "child");
        const threading_inlet = op_inputs.find(el => el.inlet === 0);
        const tieup_inlet = op_inputs.find(el => el.inlet === 1);
        const treadling_inlet = op_inputs.find(el => el.inlet === 2);
  
  
  
        if(child_input === undefined 
          || threading_inlet === undefined
          || tieup_inlet === undefined
          || treadling_inlet == undefined) return Promise.resolve([]);
  
        const threading_draft = threading_inlet.drafts[0];
        const tieup_draft = tieup_inlet.drafts[0];
        const treadling_draft = treadling_inlet.drafts[0];
     
        const threading: Array<number> = [];
        for(let j = 0; j < warps(threading_draft.drawdown); j++){
          const col: Array<Cell> = threading_draft.drawdown.reduce((acc, row, ndx) => {
            acc[ndx] = row[j];
            return acc;
          }, []);
  
          threading[j] = col.findIndex(cell => cell.getHeddle());
  
        }
      
        const treadling: Array<Array<number>> =treadling_draft.drawdown
        .map(row => [row.findIndex(cell => cell.getHeddle())]);
  
        const tieup =tieup_draft.drawdown.map(row => {
          return row.map(cell => cell.getHeddle());
        });
  
        console.log(threading_draft, treadling_draft)
        const draft: Draft = initDraftWithParams({warps:warps(threading_draft.drawdown), wefts:wefts(treadling_draft.drawdown)});
        const utils = getLoomUtilByType('frame');
        const loom = {
          threading: threading,
          tieup: tieup,
          treadling:treadling
        }
        return utils.computeDrawdownFromLoom(loom, 0).then(drawdown => {
          draft.drawdown = drawdown;
          return Promise.resolve([draft]);
        });
      }
    }
      
    const directdrawdown: Operation = {
      name: 'directdrawdown',
      displayname: 'make drawdown from threading and lift plan',
      old_names:[],
      dx: 'create a drawdown from the input drafts (order 1. threading, 2. tieup, 3.lift plan)',
      params: [],
      inlets: [{
        name: 'threading', 
        type: 'static',
        value: null,
        dx: 'the draft to use as threading',
        num_drafts: 1
      }, {
        name: 'tieup', 
        type: 'static',
        value: null,
        dx: 'the draft to use as tieup',
        num_drafts: 1
      },
      {
        name: 'lift plan', 
        type: 'static',
        value: null,
        dx: 'the draft to use as the lift plan',
        num_drafts: 1
      }],
      perform: (op_inputs: Array<OpInput>) => {
  
        const parent_input = op_inputs.find(el => el.op_name === "directdrawdown");
        const child_input= op_inputs.find(el => el.op_name === "child");
        const threading_inlet = op_inputs.find(el => el.inlet === 0);
        const tieup_inlet = op_inputs.find(el => el.inlet === 1);
        const treadling_inlet = op_inputs.find(el => el.inlet === 2);
    
        if(child_input === undefined 
          || threading_inlet === undefined
          || tieup_inlet === undefined
          || treadling_inlet == undefined) return Promise.resolve([]);
  
        const threading_draft = threading_inlet.drafts[0];
        const tieup_draft = tieup_inlet.drafts[0];
        const treadling_draft = treadling_inlet.drafts[0];
          
        const threading: Array<number> = [];
        for(let j = 0; j < warps(threading_draft.drawdown); j++){
          const col: Array<Cell> = threading_draft.drawdown.reduce((acc, row, ndx) => {
            acc[ndx] = row[j];
            return acc;
          }, []);
          threading[j] = col.findIndex(cell => cell.getHeddle());
        }
        
        const treadling: Array<Array<number>> =treadling_draft.drawdown
        .map(row => [row.findIndex(cell => cell.getHeddle())]);
    
        const tieup =tieup_draft.drawdown.map(row => {
          return row.map(cell => cell.getHeddle());
        });
    
        const draft: Draft = initDraftWithParams({warps:warps(threading_draft.drawdown), wefts:wefts(treadling_draft.drawdown)});
        const utils = getLoomUtilByType('frame');
        const loom = {
          threading: threading,
          tieup: tieup,
          treadling:treadling
        }
        return utils.computeDrawdownFromLoom(loom, 0).then(drawdown => {
          draft.drawdown = drawdown;
          return Promise.resolve([draft]);
        });   
      }
    }

    const combinatorics: Operation = {
      name: 'combos',
      displayname: 'all possible structures',
      old_names:[],
      dx: 'generates a list of all possible drafts of a given size for the user to explore',
      params: [
        <NumParam>{name: 'size',
        type: 'number',
          min: 2,
          max: 4,
        value: 3,
        dx: 'the size of the structure'
        },
        <NumParam>{name: 'selection',
        type: 'number',
          min: 1,
          max: 22874,
        value: 1,
        dx: 'the id of the generated structure you would like to view'
        },
        <BoolParam>{name: 'download all',
        type: 'boolean',
        falsestate: '',
        truestate: 'downloading',
        value: 0,
        dx: "when this is set to true, it will trigger download of an image of the whole set everytime it recomputes, this may result in multiple downloads"
        }
      ],
      inlets: [],
      perform: (op_inputs: Array<OpInput>) => {
  
        const parent_input = op_inputs.find(el => el.op_name === "combos");
        const child_input= op_inputs.find(el => el.op_name === "child");
        const size = parent_input.params[0];
        const show = parent_input.params[1]-1;
        const download = parent_input.params[2];

        //for larger set sizes, you must split up the download into multiple files
        const divisor = (size - 3 > 0) ? Math.pow(2,(size-3)): 1;

        return this.combos.getSet(size, size)
        .then(alldrafts => { 

          if(download){

            for(let set_id = 0; set_id < divisor; set_id++){
              
              const cc = 10;
              const set_data = this.combos.getDrafts(set_id, divisor);
  
              let b:HTMLCanvasElement = <HTMLCanvasElement>document.createElement('canvas'); 
              let context = b.getContext('2d');
              b.width = (cc*(size+5))*20;
              b.height = Math.ceil(set_data.length  / 20)*((5+size)*cc);
              context.fillStyle = "white";
              context.fillRect(0,0,b.width,b.height);
  
              set_data.forEach((set, ndx) => {
                
                const top = Math.floor(ndx / 20) * (wefts(set.draft.drawdown)+5)*cc + 10;
                const left = ndx % 20 * (warps(set.draft.drawdown)+5)*cc + 10; 
                
                context.font = "8px Arial";
                context.fillStyle = "#000000"
                context.fillText((set.id+1).toString(),left, top-2,size*cc)
                context.strokeRect(left,top,size*cc,size*cc);
  
                for (let i = 0; i < wefts(set.draft.drawdown); i++) {
                  for (let j = 0; j < warps(set.draft.drawdown); j++) {
                    this.drawCell(context, set.draft, cc, i, j, top, left);
                  }
                }            
              })
  
              // console.log("b", b);
              const a = document.createElement('a')
              a.href = b.toDataURL("image/jpg")
              a.download = "allvalid_"+size+"x"+size+"_drafts_"+set_id+".jpg";
              a.click();
            }
          }      
          return Promise.resolve([this.combos.getDraft(show).draft]);
        })     
      }
    }

    const sinewave: Operation = {
      name: 'sine',
      displayname: 'sine wave sample', 
      old_names:[], 
      dx: 'samples a sin wave at a rate accordinging to the interval, and stretches it to the size of amplitude',
      params: <Array<NumParam>>[
        {name: 'ends',
        type: 'number',
        min: 1,
        max: 10000,
        value: 100,
        dx: "the total ends of the draft"
        },
        {name: 'amplitude',
        type: 'number',
        min: 0,
        max: 10000,
        value: 20,
        dx: "the total number of pics for the sin wave to move through"
        },
        {name: 'frequency',
        type: 'number',
        min: 0,
        max: 10000,
        value: 1,
        dx: "controls number of waves to include "
        }
      ],
      inlets: [],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'sine');
        const child_input = op_inputs.find(el => el.op_name == 'child');
        const warpnum =  parent_input.params[0];
        const amps =  parent_input.params[1];
        const inc =  parent_input.params[2];
        console.log(parent_input);
       

        //initialize the base container with the first draft at 0,0, unset for anythign wider
        const draft: Draft =initDraftWithParams({warps: warpnum, wefts:amps});
          
        for(let j = 0; j < warps(draft.drawdown); j++){
          let i = Math.floor((amps/2)*Math.sin(j * inc) + (amps/2));
          draft.drawdown[i][j].setHeddle(true);
        }
      
        return Promise.resolve([draft]);
      }        
    }

    const sawtooth: Operation = {
      name: 'sawtooth',
      displayname: 'sawtooth', 
      old_names:[], 
      dx: 'samples a sin wave at a rate accordinging to the interval, and stretches it to the size of amplitude',
      params: <Array<NumParam>>[
        {name: 'ends',
        type: 'number',
        min: 1,
        max: 10000,
        value: 100,
        dx: "the total ends of the draft"
        },
        {name: 'pics',
        type: 'number',
        min: 0,
        max: 10000,
        value: 20,
        dx: "the total number of pics for the saw path to move through"
        },
        {name: 'segments',
        type: 'number',
        min: 0,
        max: 10000,
        value: 1,
        dx: "the total number of segments, each segment represents one half of the saw tooth's path "
        }
      ],
      inlets: [],
      perform: (op_inputs: Array<OpInput>) => {
        const parent_input = op_inputs.find(el => el.op_name == 'sawtooth');
        const child_input = op_inputs.find(el => el.op_name == 'child');
        const warpnum =  parent_input.params[0];
        const pics =  parent_input.params[1];
        const peaks =  parent_input.params[2];
       

        //initialize the base container with the first draft at 0,0, unset for anythign wider
        const draft: Draft =initDraftWithParams({warps: warpnum, wefts:pics});
        const run = (warpnum/peaks);
        const slope = pics /run;

          
        for(let j = 0; j < warps(draft.drawdown); j++){
          let x = j % Math.floor(run*2);
          let i = Math.floor(slope * x);
          if(i < pics)  draft.drawdown[i][j].setHeddle(true);
          else draft.drawdown[(pics-1)-(i-pics)][j].setHeddle(true);
        }
      
        return Promise.resolve([draft]);
      }        
    }

    this.dynamic_ops.push(assignlayers);
    this.dynamic_ops.push(dynamic_join_left);
    this.dynamic_ops.push(imagemap);
    this.dynamic_ops.push(layernotation);
    this.dynamic_ops.push(warp_profile);
    this.dynamic_ops.push(sample_width);

    //**push operations that you want the UI to show as options here */
    this.ops.push(splicein);
    this.ops.push(spliceinwarps);
    this.ops.push(assignwefts);
    this.ops.push(assignwarps);
    this.ops.push(vertcut);
    this.ops.push(germanify);
    this.ops.push(crackleify);
    this.ops.push(makeloom);
    this.ops.push(drawdown);
    this.ops.push(combinatorics);
    this.ops.push(sinewave);
    this.ops.push(sawtooth);
    // console.log(this.ops);

    //** Give it a classification here */
    this.classification.push(
      {category: 'structure',
      dx: "0-1 input, 1 output, algorithmically generates weave structures based on parameters",
      ops: [tabby_der, twill, satin, shaded_satin, waffle, complextwill, random, combinatorics]}
    );

    this.classification.push(
      {category: 'block design',
      dx: "1 input, 1 output, describes the arragements of regions in a weave. Fills region with input draft",
      ops: [rect, crop, trim, margin, tile, chaos, warp_profile, sample_width]
    });

    this.classification.push(
      {category: 'transformations',
      dx: "1 input, 1 output, applies an operation to the input that transforms it in some way",
      ops: [invert, flipx, flipy, shiftx, shifty, rotate, makesymmetric, slope, stretch, resize, clear, set, unset]}
      );

    this.classification.push(
        {category: 'combine',
        dx: "2 inputs, 1 output, operations take more than one input and integrate them into a single draft in some way",
        ops: [imagemap, interlace, splicein, spliceinwarps, assignlayers, layer, layernotation,  fill, joinleft, dynamic_join_left, jointop]}
        );
    
     this.classification.push(
          {category: 'binary',
          dx: "2 inputs, 1 output, operations take two inputs and perform binary operations on the interlacements",
          ops: [atop, overlay, mask, knockout]}
          );
    
      this.classification.push(
        {category: 'math',
        dx: "0 or more inputs, 1 output, generates drafts from mathmatical functions",
        ops: [sinewave, sawtooth]}
        );
      

      this.classification.push(
        {category: 'helper',
        dx: "variable inputs, variable outputs, supports common drafting requirements to ensure good woven structure",
        ops: [selvedge, bindweftfloats, bindwarpfloats]}
        );


      this.classification.push(
        {category: 'machine learning',
        dx: "1 input, 1 output, experimental functions that attempt to apply a style from one genre of weaving to your draft. Currently, we have trained models on German Weave Drafts and Crackle Weave Drafts ",
        ops: [germanify, crackleify]}
      );

      this.classification.push(
        {category: 'jacquard',
        dx: "1 input, 1 output, functions designed specifically for working with jacquard-style drafting",
        ops: [assignwarps, assignwefts, erase_blank]}
      );

    this.classification.push(
      {category: 'frame loom support',
      dx: "variable input drafts, variable outputs, offer specific supports for working with frame looms",
      ops: [makeloom, makedirectloom, drawdown, directdrawdown]}
    );

    this.classification.push(
      {category: 'color effects',
      dx: "2 inputs, 1 output: applys pattern information from second draft onto the first. To be used for specifiying color repeats",
      ops: [apply_mats]}
    );
  }


 /**
   * transfers data about systems and shuttles from input drafts to output drafts. 
   * @param d the output draft
   * @param op_input.drafts the input drafts
   * @param type how to handle the transfer (first - use the first input data, interlace, layer)
   * @returns 
   */
  transferSystemsAndShuttles(d: Draft, drafts: Array<Draft>, params: any, type: string){
    if (drafts.length === 0) return;

    let rowSystems: Array<Array<number>> =[];
    let colSystems: Array<Array<number>> =[];
    let uniqueSystemRows: Array<Array<number>> = [];
    let uniqueSystemCols: Array<Array<number>> = [];

    let rowShuttles: Array<Array<number>> =[];
    let colShuttles: Array<Array<number>> =[];
    let standardShuttleRows: Array<Array<number>> = [];
    let standardShuttleCols: Array<Array<number>> = [];


    switch (type) {
      case 'first':
        // if there are multiple op_input.drafts, 
        d.colShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[0].colShuttleMapping,'col', 3);
        d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[0].rowShuttleMapping,'row', 3);
        d.colSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].colSystemMapping,'col', 3);
        d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].rowSystemMapping,'row', 3);
        
        break;

      case 'jointop':
        // if there are multipleop_input.drafts, 
        d.colShuttleMapping = generateMappingFromPattern(d.drawdown, drafts[0].colShuttleMapping, 'col', 3);
        d.colSystemMapping = generateMappingFromPattern(d.drawdown, drafts[0].colSystemMapping, 'col', 3);

        break;

      case 'joinleft':
        //if there are multiple op_input.drafts, 
        d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[0].rowShuttleMapping,'row', 3);
        d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].rowSystemMapping,'row', 3);

        break;

      case 'second':

        const input_to_use = (drafts.length < 2) ? drafts[0] : drafts[1];

        d.colShuttleMapping =  generateMappingFromPattern(d.drawdown, input_to_use.colShuttleMapping,'col',3);
        d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, input_to_use.rowShuttleMapping,'row',3);
        d.colSystemMapping =  generateMappingFromPattern(d.drawdown, input_to_use.colSystemMapping,'col',3);
        d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, input_to_use.rowSystemMapping,'row',3);

        break;
        
      case 'materialsonly':

        d.colShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[1].colShuttleMapping,'col',3);
        d.rowShuttleMapping =  generateMappingFromPattern(d.drawdown, drafts[1].rowShuttleMapping,'row',3);
        d.colSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].colSystemMapping,'col',3);
        d.rowSystemMapping =  generateMappingFromPattern(d.drawdown, drafts[0].rowSystemMapping,'row',3);
       
        break;

      case 'interlace':
        rowSystems =drafts.map(el => el.rowSystemMapping);
        uniqueSystemRows = this.ss.makeWeftSystemsUnique(rowSystems);

        rowShuttles =drafts.map(el => el.rowShuttleMapping);
        standardShuttleRows = this.ms.standardizeLists(rowShuttles);

        d.drawdown.forEach((row, ndx) => {

          const select_array: number = ndx % drafts.length; 
          const select_row: number = Math.floor(ndx / drafts.length) % wefts(drafts[select_array].drawdown);
          d.rowSystemMapping[ndx] = uniqueSystemRows[select_array][select_row];
          d.rowShuttleMapping[ndx] = standardShuttleRows[select_array][select_row];

        });
     
        break;

      case 'layer':
        rowSystems=drafts.map(el => el.rowSystemMapping);
        colSystems =drafts.map(el => el.colSystemMapping);
        uniqueSystemRows = this.ss.makeWeftSystemsUnique(rowSystems);
        uniqueSystemCols= this.ss.makeWarpSystemsUnique(colSystems);
  
        rowShuttles = drafts.map(el => el.rowShuttleMapping);
        colShuttles = drafts.map(el => el.colShuttleMapping);
        standardShuttleRows = this.ms.standardizeLists(rowShuttles);
        standardShuttleCols = this.ms.standardizeLists(colShuttles);
  
        d.drawdown.forEach((row, ndx) => {
  
          const select_array: number = ndx %drafts.length; 
          const select_row: number = Math.floor(ndx /drafts.length)%wefts(drafts[select_array].drawdown);
        
          d.rowSystemMapping[ndx] = uniqueSystemRows[select_array][select_row];
          d.rowShuttleMapping[ndx] = standardShuttleRows[select_array][select_row];

        });
  
        for (let i = 0; i < wefts(d.drawdown); i++) {
          const select_array: number = i % drafts.length; 
          const select_col: number = Math.floor(i /drafts.length) % warps(drafts[select_array].drawdown);
          d.colSystemMapping[i] = uniqueSystemCols[select_array][select_col];
          d.colShuttleMapping[i] = standardShuttleCols[select_array][select_col];
        }     
       
        break;
  
      case 'stretch':
          d.colShuttleMapping =  generateMappingFromPattern(drafts[0].drawdown, drafts[0].colShuttleMapping,'col', 3);
          d.rowShuttleMapping =  generateMappingFromPattern(drafts[0].drawdown, drafts[0].rowShuttleMapping,'row', 3);
          d.colSystemMapping =  generateMappingFromPattern(drafts[0].drawdown, drafts[0].colSystemMapping,'col', 3);
          d.rowSystemMapping =  generateMappingFromPattern(drafts[0].drawdown, drafts[0].rowSystemMapping,'row', 3);
          
          //need to determine how to handle this - should it stretch the existing information or copy it over
      break; 
    }
  }

  formatName(drafts: Array<Draft>, op_name: string) : string {
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

  isDynamic(name: string) : boolean {
    const parent_ndx: number = this.dynamic_ops.findIndex(el => el.name === name);
    if (parent_ndx == -1) return false;
    return true;
  }

  drawCell(cx, draft, cell_size, i, j, top,  left){
    let is_up = isUp(draft.drawdown, i, j);
    let color = "#ffffff"
   
    if (is_up) {
      color = '#000000';
    } else{
      color = '#ffffff';
    }
    cx.fillStyle = color;
    cx.strokeStyle = '#000000';

    //hack, draw upside down to account for later flip
    i = (wefts(draft.drawdown) - 1) - i;

    cx.strokeRect(left+j*cell_size, top+i*cell_size, cell_size, cell_size);
    cx.fillRect(left+j*cell_size, top+i*cell_size, cell_size, cell_size);
  }

  getOp(name: string): Operation {
    const op_ndx: number = this.ops.findIndex(el => el.name === name);
    const parent_ndx: number = this.dynamic_ops.findIndex(el => el.name === name);
    if (op_ndx !== -1) return this.ops[op_ndx];
    if (parent_ndx !== -1) return this.dynamic_ops[parent_ndx];
    return null;
  }

  hasOldName(op: Operation | DynamicOperation, name: string) : boolean {
    return (op.old_names.find(el => el === name) !== undefined );
  }

  getOpByOldName(name: string): Operation | DynamicOperation{
    const allops = this.ops.concat(this.dynamic_ops);
    const old_name = allops.filter(el => this.hasOldName(el, name));

    if(old_name.length == 0){
      return this.getOp('rectangle');
    }else{
      return old_name[0]; 
    }
  }
}
