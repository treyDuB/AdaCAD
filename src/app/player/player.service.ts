import { Injectable} from '@angular/core';
import { EventEmitter } from 'events';
import { wefts } from '../core/model/drafts';
import { Draft } from '../core/model/datatypes';
import { BaseOp as Op, BuildableOperation as GenericOp, 
  TreeOperation as TreeOp,
  Seed, Pipe, DraftsOptional, AllRequired, getDefaultParams,
  SingleInlet, OpInput
} from '../mixer/model/operation';
import * as defs from '../mixer/model/op_definitions';
import { PlayerOp, playerOpFrom, 
  OpChain, OpRoulette, OpPairing, 
  makeOpPairing, makeOpChain, makeOpRoulette,
  forward, refresh, reverse
} from './model/op_mappings';
import { PlayerState, WeavingPick, copyState, initState } from './model/state';
import { PedalsService, PedalStatus, Pedal } from './services/pedals.service';
import { MappingsService } from './services/mappings.service';


export interface DraftOperationClassification {
  category: string,
  dx: string,
  ops: Array<PlayerOp> 
 }

interface LoomConfig {
  warps: number,
  draftTiling: boolean
}


/**
 * The Draft Player Service is in charge of updating the the global PlayerState and tracking where the weaver is in the draft.
 */
@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  state: PlayerState;
  loom: LoomConfig;
  redraw = new EventEmitter();
  draftClassification: Array<DraftOperationClassification> = [];

  constructor(
    public pedals: PedalsService,
    public mappings: MappingsService
  ) {
    // this.draft = null; 
    console.log("draft player constructor");
    // const startPattern = playerOpFrom(defs.tabby);
    // console.log(startPattern);
    // startPattern.perform(nullOpInput).then((result) => {
    //   console.log(result);
    //   this.setDraft(result[0]);
    // });

    this.state = initState();
    this.state.draft = defs.tabby.perform([1]);

    this.loom = { warps: 2640, draftTiling: true };

    // load the draft progress ops
    mappings.addOperation(forward);
    mappings.addOperation(refresh);
    mappings.addOperation(reverse);

    function addOp(op: GenericOp) {
      let p_op = playerOpFrom(op);
      mappings.addOperation(p_op);
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

    this.draftClassification.push(
      {category: 'structure',
      dx: "0-1 input, 1 output, algorithmically generates weave structures based on parameters",
      ops: [tabby, twill, satin, waffle, random]}
    );

    this.draftClassification.push(
      {category: 'transformation',
      dx: "1 input, 1 output, applies an operation to the input that transforms it in some way",
      ops: [invert, flipx, flipy, shiftx, shifty, rotate, slope, stretch, symm]}
    );

    // //test this
    // console.log(this.oss.getOp('germanify'));
    // const germanify = this.pedalOps.addOperation(playerOpFromTree(<PlayableTreeOp> this.oss.getOp('germanify')));
    
    console.log('pedal ops added');

    pedals.on('pedal-step', (id) => this.onPedal(id));

    pedals.on('pedal-added', (n) => {
      if (n == 1) {
        mappings.pair(0, 'forward');
        console.log("pedals mapping", mappings.index);
      } else if (n == 2) {
        if (mappings.pedalIsMapped(0)) mappings.unmap(0);
        mappings.makeOpRoulette(0, 1);
        console.log("pedals mapping", mappings.index);
      }
    })
  }

  get readyToWeave() {  // need either one pedal forward or one pedal reverse, in order to progress through draft
    return (this.pedals.readyToWeave && 
      (this.mappings.opIsMapped('forward') || this.mappings.opIsMapped('reverse'))
    );
  }

  get weaving() {
    return this.pedals.active_draft.val;
  }
  get draft() {
    return this.state.draft;
  }

  get roulette(): OpRoulette {
    return this.mappings.roulette;
  }

  addToRoulette(o: PlayerOp | OpChain) {
    if (this.roulette) {
      this.roulette.addOp(o);
    } else {
      console.log('no roulette to add to!');
    }
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
    if (this.mappings.pedalIsPaired(p.id)) {
      this.mappings.unmap(p.id);
    }
    this.mappings.pair(p.id, e);
    console.log("pedals map", this.mappings.map);
  }

  onPedal(id: number) {
    console.log('pedal ', id);
    let mapped = this.mappings.getMap(id);
    if (mapped) {
      console.log('mapping exists for pedal');
      mapped.perform(this.state, id)
      .then((state: PlayerState) => {
        this.state = state;
        console.log(this.state);
        this.redraw.emit('redraw');
        if (this.state.weaving) {
          console.log("draft player: sending row");
          this.pedals.sendDraftRow(this.currentRow());
        }
      });
    }
  }

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
    this.pedals.toggleWeaving();
    this.pedals.sendDraftRow(this.currentRow());
    // this.pedals.vacuum_on.once('change', (state) => {
    //   if (state) {
    //   }
    // });
  }
}
