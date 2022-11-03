import { Injectable} from '@angular/core';
import { wefts } from '../../core/model/drafts';
import { Draft } from '../../core/model/datatypes';
import { PedalsService, PedalStatus, Pedal } from './pedals.service';
import { BaseOp as Op, BuildableOperation as GenericOp, 
  TreeOperation as TreeOp,
  Seed, Pipe, DraftsOptional, AllRequired, getDefaultParams,
  SingleInlet, OpInput
} from '../model/operation';
import * as defs from '../model/op_definitions';
import { OpChain, OpRoulette, OpPairing, PedalOpMapping,
  makeOpPairing, makeOpChain
} from '../model/op_mappings';
import { OperationService } from '../provider/operation.service';
import { EventEmitter } from 'events';

// interface PedalsConfig {
//   numPedals: number,
//   ops: Array<PlayerOp>
// }

export interface PlayerOp {
  id?: number,
  name: string,
  dx?: string,
  op?: GenericOp,
  weavingOnly?: boolean,
  perform: (init: PlayerState) => Promise<PlayerState>;
}

interface LoomConfig {
  warps: number,
  draftTiling: boolean
}

export interface PlayerState {
  draft: Draft,
  row: number,
  numPicks: number,
}

export interface WeavingPick {
  pickNum: number,
  rowData: string
}

/**
 * @class PedalOpMapping
 * @desc Represents a set of two-way bindings between a set of Pedals
 * and a set of (Player)Operations. A pedal can only be bound to one
 * Action (a single Op, a chain of Ops, or to control an OpRoulette)
 * @todo The second restriction may change, it might make sense for pedals to
 * get bound to a sequence of operations.
 */
class PedalConfig {
  // numPedals: number;
  pedals: Array<Pedal>;
  ops: Array<PlayerOp>;
  availPedals: Array<number>;
  mapping: PedalOpMapping;  // pedal ID (number) <-> op (PlayerOp)

  constructor(pedalArray: Array<Pedal>, loadConfig = false) {
    this.pedals = pedalArray;
    this.ops = []
    this.availPedals = pedalArray.map((p) => p.id);
    this.mapping = [];
  }

  get numPedals() {
    return this.pedals.length;
  }

  get numMappings() {
    return Object.entries(this.mapping).length;
  }

  addPedal(p: Pedal) {
    // this.pedals.push(p);
    this.availPedals.push(p.id);
  }

  remPedal() {
    // this.pedals.pop();
    this.availPedals.filter((id) => id != this.pedals.length);
  }

  addOperation(o: PlayerOp) {
    o.id = this.ops.length;
    this.ops.push(o);
    // this.unpairedOps.push(o);
    // console.log(this.ops);
  }

  pair(pedalId: number, opName: string) {
    let o = this.ops.findIndex((op) => op.name == opName);
    // let thisOp = this.unpairedOps.splice(o, 1);
    let thisOp = this.ops;
    this.mapping[pedalId] = makeOpPairing(pedalId, thisOp[o]); 
  }

  opIsPaired(opName: string): boolean {
    // let opPairs = [];
    // console.log(this.pairs);
    if (this.mapping.filter((m) => m.name.includes(opName)).length > 0) {
      return true;
    } else return false;
  }
  //   }
  //   if (this.numMappings > 0) {
  //     opPairs = Object.values(this.mapping).map((x: PlayerOp) => x.name);
  //   }
  //   // console.log(opPairs);
  //   return (opPairs.indexOf(opName));
  // }

  pedalIsPaired(pedalId: number) {
    return (this.mapping[pedalId]);
  }

  unpairPedal(id: number) {
    console.log(`unpairing pedal ${id}`);
    // let op = this.pairs[id];
    // this.unpairedOps.splice(op.id, 0, op);
    delete this.mapping[id];
  }

  // unpairOp(name: string) {
  //   let pid = this.opIsPaired(name);
  //   this.unpairPedal(pid);
  // }
}

/** @const forward a player-specific function to progress through the draft */
const forward: PlayerOp = {
  name: 'forward',
  perform: (init: PlayerState) => { 
    let nextRow = (init.row+1) % wefts(init.draft.drawdown);
    return Promise.resolve({ draft: init.draft, row: nextRow, numPicks: init.numPicks+1 }); 
  }
}

/** @const refresh a player-specific function to progress through the draft (re-sends the row to give more time) */
const refresh: PlayerOp = {
  name: 'refresh',
  perform: (init: PlayerState) => Promise.resolve(init)
}

/** @const reverse a player-specific function to progress backwards through the draft */
const reverse: PlayerOp = {
  name: 'reverse',
  perform: (init: PlayerState) => { 
    let nextRow = (init.row+wefts(init.draft.drawdown)-1) % wefts(init.draft.drawdown);
    return Promise.resolve({ draft: init.draft, row: nextRow, numPicks: init.numPicks+1});
  }
}

function playerOpFrom(op: GenericOp) {
  // use "rotate" op as an example
  let perform;
  if (op.classifier.type === 'pipe') {
    const pipeOp = op as Op<Pipe, AllRequired>;
    perform = function(init: PlayerState) {
      let d: Draft = pipeOp.perform(init.draft, getDefaultParams(pipeOp));
      return Promise.resolve({ draft: d, row: init.row, numPicks: init.numPicks });
    }
  } else if (op.classifier.type === 'seed') {
    const seedOp = op as Op<Seed, DraftsOptional>;
    perform = function(init: PlayerState) {
      let d: Draft = seedOp.perform(getDefaultParams(seedOp));
      return Promise.resolve({ draft: d, row: init.row, numPicks: init.numPicks });
    }
  }
  
  var p: PlayerOp = { 
    name: op.name,
    op: op,
    perform: perform
  }
  return p;
}

/** 
 * @type 
 * a TreeOperation is compatible with the player if it takes one or zero draft inputs 
 * and outputs one draft.
 */
type PlayableTreeOp = TreeOp & 
  ( { inlets: [ SingleInlet ] } | 
    { inlets: [] });

/** @function playerOpFromTree (untested) */
function playerOpFromTree(op: PlayableTreeOp) {
  let perform: PlayerOp["perform"];
  let param_input: OpInput = { op_name: op.name, drafts: [], params: getDefaultParams(op), inlet: -1 }
  if (op.inlets.length == 0) {
    perform = function(init: PlayerState) {
      return op.perform([param_input]).then((output) => {
        return { draft: output[0], row: init.row, numPicks: init.numPicks };
      });
    }
  } else {
    perform = function(init: PlayerState) {
      let draft_input: OpInput = { op_name: 'child', drafts: [init.draft], params: [], inlet: 0}
      return op.perform([param_input, draft_input]).then((output) => {
        return { draft: output[0], row: init.row, numPicks: init.numPicks };
      });
    }
  }

  var p: PlayerOp = { 
    name: op.name,
    perform: perform
  }
  return p;
}

/**
 * The Draft Player Service is in charge of 
 */
@Injectable({
  providedIn: 'root'
})
export class DraftPlayerService {
  state: PlayerState;
  loom: LoomConfig;
  pedalOps: PedalConfig;
  redraw = new EventEmitter();

  constructor(
    public pds: PedalsService,
    private oss: OperationService
  ) {
    // this.draft = null; 
    console.log("draft player constructor");
    // const startPattern = playerOpFrom(defs.tabby);
    // console.log(startPattern);
    // startPattern.perform(nullOpInput).then((result) => {
    //   console.log(result);
    //   this.setDraft(result[0]);
    // });

    this.state = { draft: defs.tabby.perform([1]), row: 0, numPicks: 0 };
    this.loom = { warps: 2640, draftTiling: true };

    this.pedalOps = new PedalConfig(this.pedals);

    // load the draft progress ops
    this.pedalOps.addOperation(forward);
    this.pedalOps.addOperation(refresh);
    this.pedalOps.addOperation(reverse);

    const ops = this.pedalOps;

    function addOp(op: GenericOp) {
      let p_op = playerOpFrom(op);
      ops.addOperation(p_op);
      return p_op;
    }

    // load ops from the main mixer
    const tabby = addOp(defs.tabby);
    const twill = addOp(defs.twill);
    const satin = addOp(defs.satin);
    const waffle = addOp(defs.waffle);
    const random = addOp(defs.random);
    const rotate = addOp(defs.rotate);
    const invert = addOp(defs.invert);
    const shiftx = addOp(defs.shiftx);
    const shifty = addOp(defs.shifty);
    const slope = addOp(defs.slope);
    const flipx = addOp(defs.flipx);
    const flipy = addOp(defs.flipy);
    const symm = addOp(defs.makesymmetric);
    const stretch = addOp(defs.stretch);

    // //test this
    // console.log(this.oss.getOp('germanify'));
    // const germanify = this.pedalOps.addOperation(playerOpFromTree(<PlayableTreeOp> this.oss.getOp('germanify')));
    
    
    // this.pedalOps.addOperation(rotate) 
    // this.pedalOps.addOperation(tabby);
    // this.pedalOps.addOperation(twill);
    // this.pedalOps.addOperation(random);
    // this.pedalOps.addOperation(invert); 
    // this.pedalOps.addOperation(shiftx); 
    // this.pedalOps.addOperation(flipx);
    // this.pedalOps.addOperation(slope); 
    // this.pedalOps.addOperation(stretch);

    // this.pds.pedal_array.on('pedal-added', (num) => {
    //   // console.log("automatically pairing first pedal", num);
    //   if (num == 1) {
    //     console.log(this.pedalOps);
    //     this.setPedalOp({value: 'forward'}, this.pedals[0]);
    //   }
    // });
    this.pds.on('pedal-step', (id) => this.onPedal(id));
  }

  get pedals() { return this.pds.pedals; }
  get readyToWeave() {  // need either one pedal forward or one pedal reverse, in order to progress through draft
    return (this.pds.readyToWeave && 
      (this.pedalOps.opIsPaired('forward') || this.pedalOps.opIsPaired('reverse'))
    );
  }
  get weaving() {
    return this.pds.active_draft.val;
  }
  get draft() {
    return this.state.draft;
  }

  setDraft(d: Draft) {
    this.state.draft = d;
    this.state.row = 0;
    // console.log("player has active draft");
    // console.log("draft is ", this.draft);
    console.log("state is ", this.state);
  }

  // e is a string = op.name
  setPedalOp(e: any, p: Pedal) {
    console.log(e, p);
    if (this.pedalOps.pedalIsPaired(p.id)) {
      this.pedalOps.unpairPedal(p.id);
    }
    this.pedalOps.pair(p.id, e);
    console.log("pedals dict", this.pedalOps.mapping);
  }

  onPedal(id: number) {
    if (this.pedalOps.mapping[id]) {
      this.pedalOps.mapping[id].perform(this.state)
      .then((state: PlayerState) => {
        this.state = state;
        console.log(this.state);
        this.redraw.emit('redraw');
        if (this.weaving) {
          // this.pds.loom_ready.once('change', (state) => {
          //   if (state) {
              console.log("draft player: sending row");
              this.pds.sendDraftRow(this.currentRow());
            // }
          // })
        }
      });
    }
  }

  // compound pedal operations
  // normal pedal -> op
  // compound pedal -> Op sequence
  // if (compound pedal change) {
      // sequence of operations: [Op, Op, Op]
      // let finaldraft = starting Draft;
      // for op in sequence:
      //   finaldraft = finaldraft.perform(op);
      // }
      // do something with finaldraft
  // }


  currentRow() {
    let {draft, row} = this.state;
    let draftRow = draft.drawdown[row % wefts(draft.drawdown)];
    let data = "";

    let targetLength = (this.loom.draftTiling ? this.loom.warps : draftRow.length);
    while (data.length < targetLength) {
      for (var i in draftRow) {
        if (draftRow[i].is_up) {
          data += '1';
        } else {
          data += '0';
        }
      }
    }
    let pick: WeavingPick = { pickNum: row, rowData: data };
    return pick;
  }

  toggleDraftTiling(e) {
    // console.log("toggle ", e);
    this.loom.draftTiling = e.checked;
    // console.log("draft tiling ", this.loom.draftTiling);
  }

  changeLoomWidth(e) {
    // console.log(e.target.value);
    this.loom.warps = e.target.value;
    // console.log("warps", this.loom.warps);
  }

  toggleWeaving() {
    // don't let user start weaving until AT LEAST:
    // - 1 pedal connected AND
    // - 1 pedal configured with operation "forward" or "reverse"
    this.pds.toggleWeaving();
    this.pds.sendDraftRow(this.currentRow());
    // this.pds.vacuum_on.once('change', (state) => {
    //   if (state) {
    //   }
    // });
  }
}
