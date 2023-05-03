import { Injectable, EventEmitter } from '@angular/core';
import { 
  Performable, CompoundPerformable, OpTemplate,
  OpInstance as SingleOp, forward, refresh, CustomStructOp
} from '../model/playerop';
import { ChainOp } from '../model/chainop';
import { PlayerState, copyState } from '../model/state';
// import { PlayerService } from '../player.service';
import { PedalsService } from './pedals.service';
import { MappingsService } from './mappings.service';

export type SequencerOp = ChainOp | SingleOp;
type OpInstanceID = number;

/**
 * Sequencer:
 *  - 1 or 2 pedal "select" pedals ->
 *    multiple operations in a circular queue
 *  - 1 "progress" pedal (forward)
 *  - if select pedal, go to next/previous operation in Sequencer
 */
 export class OpSequencer implements CompoundPerformable {
  name: string;
  p_select_a: number = -1;
  p_select_b?: number = -1;
  p_prog: number = -1;
  _pos: number = -1;
  ops: Array<SequencerOp> = [];
  selecting: boolean = false;

  onChangePosition = new EventEmitter <number>();

  get pos() { return this._pos; }

  set pos(x: number) {
    this._pos = x;
    // console.log("new seq position ", this.pos);
    this.onChangePosition.emit(this._pos);
  }

  /** 
   * @constructor Provide an array of pedals to initialize the 
   * OpSequencer, specifying the select pedal(s) and confirm 
   * pedal. Optionally, provide an array of Ops to load onto the
   * Sequencer.
   */
  constructor(pedals?: Array<number>, ops?: Array<SequencerOp>) {
    this.name = "sequencer";
    if (pedals) {
      this.p_prog = pedals[0];
      this.p_select_a = pedals[1];
      if (pedals.length > 2) {
        this.p_select_b = pedals[2];
      }
    }

    if (ops) {
      this.ops = ops;
    }
  }

  /** @method isMapped whether any pedals are mapped to the sequencer */
  get isMapped() {
    return !(this.p_prog >= 0 && this.p_select_a >= 0 && (<number> this.p_select_b) >= 0);
  }

  /** @method readyToWeave progress pedal and at least one select pedal mapped */
  get readyToWeave() {
    return (this.p_prog >= 0 && this.p_select_a >= 0);
  }

  get current(): Performable {
    if (this.pos == -1) return refresh;
    return this.ops[this.pos];
  }

  mapPedal(id: number, role: 'fwd' | 'sel-next' | 'sel-back') {
    switch (role) {
      case 'fwd':
        this.p_prog = id;
        break;
      case 'sel-next':
        this.p_select_a = id;
        break;
      case 'sel-back':
        this.p_select_b = id;
    }
  }

  /** Whether or not pedal `n` has been mapped to this OpSequencer. */
  hasPedal(n: number): boolean {
    if (this.p_prog == n || this.p_select_a == n || this.p_select_b == n) return true;
    else return false;
  }

  perform(init: PlayerState, n: number): Promise<PlayerState> {
    // console.log('sequencer perform');
    let res = copyState(init);
    if (n == this.p_prog) {
      res.weaving = true;
      return forward.perform(res);
    } else {
      res.weaving = false;
      if (this.ops.length > 0) {
        if (n == this.p_select_a) {
          this.pos = (this.pos + 1) % this.ops.length;
        } else if (n == this.p_select_b) {
          this.pos = (this.pos + this.ops.length - 1) % this.ops.length;
        }
        return this.current.perform(res);
      } else {
        return Promise.resolve(res); // we really can't do anything without any operations on the sequencer
      }
    }
  }

  /** Adds an operation to the end of the sequencer */
  addOp(o: SequencerOp) {
    this.ops.push(o);
    // if (this.pos < 0) this.pos = 0;
    // console.log(o);
    return this.ops.length - 1;
  }

  /** Removes the last operation in the sequencer */
  removeOp() {
    this.ops.pop();
    if (this.ops.length == 0) this.pos = -1;
    if (this.pos == this.ops.length) this.pos--;
  }

  /** Deletes the operation at position x and returns the removed operation. */
  delOpAt(x: number) {
    let rem = this.ops.splice(x, 1)[0];
    if (this.ops.length == 0) this.pos = -1;
    if (this.pos >= x) { this.pos--; }
    return rem;
  }

  /** Inserts operation at position `x` in the sequencer */
  insertOpAt(op: SequencerOp, x: number) {
    let arr: Array<any>;
    if (x > -1) {
      if (x == 0) {
        this.ops.unshift(op);
      } else if (x < this.ops.length) {
        arr = this.ops.splice(x);
        console.log(arr);
        this.ops.push(op);
        this.ops = this.ops.concat(arr);
      } else {
        this.ops.push(op);
      }
    }

    if (this.pos >= x) { this.pos++; }
  }
}

/** helper function to make a new sequencer */
export function makeOpSequencer(conf: number = 0, sel_fwd: number = 1, sel_back?: number, start_ops?: Array<SequencerOp>) {
  let pedals = [conf, sel_fwd];
  if (sel_back) pedals.push(sel_back);
  if (start_ops) return new OpSequencer(pedals, start_ops);
  return new OpSequencer(pedals);
}

/** 
 * I separated the sequencer into a generic object class
 * AND an Angular service that extends the class. Hopefully
 * that isn't clunky, but it does let me separate methods
 * that are useful to call in the HTML, from the methods
 * that are less often called in HTML
 * 
 * The SequencerService is in charge of tracking what 
 * operations are in the Sequencer, and where the 
 * position tracker is pointing. For what the actual 
 * operations are, the Sequencer's perform function 
 * updates position, then calls the Mapping service 
 * to perform the actual operation.
 */
@Injectable({
  providedIn: 'root'
})
export class SequencerService extends OpSequencer {
  // seq_array: OpSequencer;
  selecting: boolean = false;
  // chains: Array<ChainIndex> = []; // a number pointing to index in sequencer ops

  /** Whether the sequencer is active */
  get active() { return (this.readyToWeave ? true : false); }
  /** The chains added to the sequencer */
  get chains() { return this.map.chains; }
  /** Convenience getter for the last index */
  get lastOpIndex() { return this.ops.length - 1;}

  /** @constructor */
  constructor(
    public pedals: PedalsService,
    public map: MappingsService
  ) {
    super();
  }

  /** Associates given pedals with certain roles in the sequencer. */
  mapPedals(fwd_pedal: number, select_pedal_a: number, select_pedal_b?: number) {
    this.mapPedal(fwd_pedal, 'fwd');
    this.mapPedal(select_pedal_a, 'sel-next');
    if (select_pedal_b) {
      this.mapPedal(select_pedal_b, 'sel-back');
    }
  }

  nextOp() {
    if (this.ops.length > 0) {
      if (this.pos < 0) { this.pos = 0; }
      else { this.pos = (this.pos + 1) % this.ops.length; }
      console.log(this.current);
      return this.current;
    }
  }

  prevOp() {
    if (this.ops.length > 0) {
      if (this.pos < 0) { this.pos = this.ops.length - 1; }
      else { this.pos = (this.pos - 1) % this.ops.length; }
      return this.current;
    }
  }

  /** Moves the operation at position `a` to position `b` in the sequencer order. */
  moveOpTo(a: number, b: number) {
    if (this.ops[a] && this.ops[b] && a != b) {
      if (a > b) {
        this.insertOpAt(this.ops[a], b);
        this.delOpAt(a+1);
      } else {
        this.insertOpAt(this.ops[a], b+1);
        this.delOpAt(a);
      }
      if (this.pos == a) { this.pos = b; }
      if (this.pos == b) { this.pos++; }
    }
  }

  /** Shifts the operation at position `x` to an adjacent position by swapping places with its neighbor. If `dir = true`, operation swaps with its right neighbor. If `dir = false`, operation swaps with its left neighbor. */
  shiftOp(x: number, dir: boolean): boolean {
    console.log("moving op " + x + " in dir " + dir);
    let shift = dir? 1 : -1;
    if ((x==0 && shift < 0) || (x==this.lastOpIndex && shift > 0)) { 
      console.log("can't move out of bounds");
      return false;
    } else { 
      this.moveOpTo(x, x+shift); 
      return true;
    }
  }

  /** Add a single operation to the end of the sequencer. */
  addSingleOp(o: OpTemplate): SingleOp {
    // console.log(this.map);
    // console.log(o);
    const inst = this.map.createOpInstance(o);
    this.addOp(inst);
    return inst;
  }

  /** Add a new chain operation to the sequencer. */
  addChainOp(o: OpTemplate): ChainOp { 
    const ch = this.map.createChainOp(o);
    this.addOp(ch);
    return ch;
  }

  /** Add a single operation onto an existing chain op in the sequencer. */
  addToChain(ch_id: number, o: SingleOp) {
    const ch = this.map.getChain(ch_id);
    // const ch = this.ops[this.chains[ch_id].pos] as ChainOp;
    ch.addOp(o);
    console.log(this.ops);
  }

  /**
   * Update a parameter within an OpInstance.
   * @param op_id ID number of the operation instance being updated
   * @param param_id The ID of the parameter within the operation (index in params array)
   * @param value The new value of the parameter
   */
  updateParams(op_id: number, param_id: number, value: number | boolean) {
    // console.log(value);
    // console.log("updating op " + op_id + " at param " + param_id + " to val " + value);
    this.map.updateInstanceParams(op_id, param_id, value);
  }
    
  /** Returns the index of the operation whose ID matches `id`. */
  findOp(id: number) {
    return this.ops.findIndex((el) => el.id == id);
  }
 
  /** Removes operation from sequencer and deletes the instance. */
  removeOpById(id: number) {
    // console.log("removing op id: ", id);
    this.ops = this.ops.filter((el) => el.id != id);
    this.map.deleteInstance(id);
  }

}
