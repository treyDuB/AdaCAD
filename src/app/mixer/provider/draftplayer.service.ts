import { Injectable} from '@angular/core';
import { PedalsService, PedalStatus, Pedal } from '../../core/provider/pedals.service';
import { Draft } from '../../core/model/draft';
import { Operation, OperationService } from '../provider/operation.service';
import { EventEmitter } from 'events';

interface PedalOp {
  id: number,
  name: string,
  op?: PlayerOp
}

interface PedalsConfig {
  numPedals: number,
  ops: Array<PedalOp>
}

class PedalOpMapping {
  num: number;
  pedals: Array<Pedal>;
  pairs: Array<PedalOp>;

  constructor(loadConfig: PedalsConfig) {
    if (loadConfig) {
      this.pedals = Array(loadConfig.numPedals);
      this.pairs = loadConfig.ops;
    } else {
      this.num = 0;
      this.pedals = [];
      this.pairs = [];
    }
  }

  loadPedals(array: Array<Pedal>) {
    this.pedals = array;
    for (var i in this.pedals) {
      if (this.pairs[i]) {
        this.pairs[i].id = this.pedals[i].id;
      } else {
        this.pairs[i] = {
          id: this.pedals[i].id,
          name: this.pedals[i].name,
          op: null
        }
      }
    }
  }

  assignPedal(id: number, op: PlayerOp) {
    this.pairs[id].op = op;
  }
}

interface PlayerOp {
  name: string,
  dx?: string,
  op?: Operation,
  perform: (init: PlayerState) => Promise<PlayerState>;
}

interface LoomConfig {
  warps: number,
  draftTiling: boolean
}

export interface PlayerState {
  draft: any,
  row: number
}

export interface WeavingPick {
  pickNum: number,
  rowData: string
}

const forward: PlayerOp = {
  name: 'forward',
  perform: (init) => { 
    return Promise.resolve({ draft: init.draft, row: init.row+1 }); 
  }
}

const refresh: PlayerOp = {
  name: 'refresh',
  perform: (init) => Promise.resolve(init)
}

const reverse: PlayerOp = {
  name: 'reverse',
  perform: (init) => { 
    return Promise.resolve({ draft: init.draft, row: init.row-1 });
  }
}

function playerOpFrom(op: Operation) {
  // use "invert" op as an example
  let perform = function(init: PlayerState) {
    // let resultDraft: Draft;
    let result = Promise.resolve(op.perform([init.draft], []));
    return result.then((p) => { return { draft: p[0], row: init.row };});
  }
  var p: PlayerOp = { 
    name: op.name,
    op: op,
    perform: perform
  }
  return p;
}

@Injectable({
  providedIn: 'root'
})
export class DraftPlayerService {
  state: PlayerState;
  pedalOps = {};
  // draft: Draft;
  loom: LoomConfig;
  options: Array<PlayerOp> = [];
  optionsDict = {};
  redraw = new EventEmitter();

  constructor(
    public pds: PedalsService,
    private oss: OperationService
  ) {
    // this.draft = null; 
    console.log("draft player constructor");
    // this.pedals = new PedalsService();
    this.state = { draft: null, row: -1 };
    this.loom = { warps: 1320, draftTiling: true };

    this.addPedalOption(forward);
    this.addPedalOption(refresh);
    this.addPedalOption(reverse);

    let invert = this.oss.getOp('invert');
    this.addPedalOption(playerOpFrom(invert)); 
    // pedal.on('change', this.perform(pedalOp));
    this.pds.pedal_array.on('child-change', (e) => this.onPedal(e.id));
  }

  get pedals() { return this.pds.pedals; }
  get readyToWeave() {
    return (this.pds.readyToWeave && (this.optionsDict['forward'].pedal > -1));
  }
  get weaving() {
    return this.pds.active_draft.val;
  }
  get draft() {
    return this.state.draft;
  }

  addPedalOption(op: PlayerOp) {
    this.options.push(op);
    this.optionsDict[op.name] = {operation: op, pedal: -1};
  }

  setDraft(d: Draft) {
    this.state.draft = d;
    this.state.row = 0;
    // console.log("player has active draft");
    console.log("draft is ", this.draft);
    console.log("state is ", this.state);
  }

  // e is from select event, with value = op name (string)
  setPedalOp(e: any, p: Pedal) {
    this.pedalOps[p.id] = this.optionsDict[e.value].operation;
    this.optionsDict[e.value].pedal = p.id;
    // console.log("event", e);
    // console.log("pedal", p);
    console.log("pedal ops ", this.pedalOps);
    // console.log("ready to weave? ",this.readyToWeave);
  }

  onPedal(id: number) {
    if (this.pedalOps[id]) {
      this.pedalOps[id].perform(this.state)
      .then((state: PlayerState) => {
        this.state = state;
        this.redraw.emit('redraw');
        if (this.weaving) {
          this.pds.sendDraftRow(this.currentRow());
        }
      });
    }
  }

  currentRow() {
    console.log(this.state);
    let {draft, row} = this.state;
    let draftRow = draft.pattern[row];
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
    console.log("draft tiling ", this.loom.draftTiling);
  }

  changeLoomWidth(e) {
    // console.log(e.target.value);
    this.loom.warps = e.target.value;
    console.log("warps", this.loom.warps);
  }

  toggleWeaving() {
    // don't let user start weaving until AT LEAST:
    // - 1 pedal connected AND
    // - 1 pedal configured with operation "forward"
    this.pds.toggleWeaving();
    if (this.weaving) {
      this.pds.sendDraftRow(this.currentRow());
    } else {

    }
  }
}
