import { Injectable, Query } from '@angular/core';
import { Draft } from "../../core/model/draft";
import { Operation, OperationService } from '../../mixer/provider/operation.service';
import { EventEmitter } from 'events';
import { getDatabase, child, ref, set, get, query, onValue, DatabaseReference, onChildAdded, onChildChanged, onChildRemoved} from "firebase/database";
import { Database } from '@angular/fire/database';
import { DBListener, OnlineStatus, DBWriter, DBListenerArray } from './dbnodes.service';
import { T } from '@angular/cdk/keycodes';

export interface Pedal {
  id: number,
  name: string,
  op: Operation,
}

export class PedalStatus extends EventEmitter {
  pi_online: OnlineStatus;     // is the pi online?
  loom_online: DBListener;   // is the loom online?
  vacuum_on: DBListener;     // is the loom running? (vacuum pump running)
  active_draft: DBWriter;
  num_pedals: DBListener;
  pedal_states: DBListener;
  loom_ready: DBListener;
  num_picks: DBWriter;
  pick_data: DBWriter;

  pedal_array: DBListenerArray;

  constructor(db: Database) {
    super();
    const defaults = {
      active_draft: false,
      num_picks: 0,
      pick_data: false
    }
    const listeners = {
      // pi_online: 'pi-online',
      loom_online: 'loom-online',
      vacuum_on: 'vacuum-on',
      num_pedals: 'num-pedals',
      pedal_states: 'pedal-states',
      loom_ready: 'loom-ready'
    }
    const writers = {
      active_draft: 'active-draft',
      num_picks: 'num-picks',
      pick_data: 'pick-data'
    }

    this.pi_online = new OnlineStatus({ db: db, root: 'pedals/', path: 'pi-online'});
    // this.pi_online.attach();
    // this.loom_online = new DBListener(this.db, 'loom-online');

    for (var l in listeners) {
      const newL = new DBListener({db: db, root: 'pedals/', path: listeners[l]});
      Object.defineProperty(this, l, { value: newL });
      // this[l].attach();
    }

    for (var w in writers) {
      const newW = new DBWriter({db: db, root: 'pedals/', path: writers[w], initVal: defaults[w]});
      // console.log('writer created');
      Object.defineProperty(this, w, { value: newW });
      // console.log('writer added to status');
      this[w].attach();
      // console.log('writer attached');
      this[w].setVal(defaults[w]);
    }

    this.pedal_array = new DBListenerArray(this.num_pedals, this.pedal_states);
  }

  toString() {
    var str = "";
    str += "'pi-online': " + this.pi_online.val + "\n";
    str += "'loom-online': " + this.loom_online.val + "\n\n";
    str += "'vacuum-on': " + this.vacuum_on.val + "\n";
    str += "'active-draft': " + this.active_draft.val + "\n";
    str += "'num-pedals': " + this.num_pedals.val + "\n";
    return str;
  }
}

/**
 * Definition of pedal provider
 * @class
 */
@Injectable({
  providedIn: 'root'
})
export class PedalsService {

  db: Database;
  dbNodes: Array<any>;

  // status data
  activeDraft: Draft;
  status: PedalStatus;
  //  default = {
  //     pi_online: false,     // is the pi online?
  //     loom_online: false,   // is the loom online?
  //     vacuum_on: false,     // is the loom running? (vacuum pump running)
  //     active_draft: false,
  //     num_pedals: 0,
  //     pedal_states: {},
  //     loom_ready: false     // is the loom requesting a draft row?
  // };

  constructor() { 
    // init: start listening to changes in Firebase DB from the Pi
    this.db = getDatabase();
    this.status = new PedalStatus(this.db);
    // console.log(this.status);
    
    // listens for changes in pi online status
    // if online, enable everything
    this.pi_online.on('change', (state) => {
      if (state) {
        this.enableLoomPedals();
      } else {
        this.disableLoomPedals();
      }
    });

    // other listeners
    this.loom_online.on('change', (state) => {
      if (state) {
        this.vacuum_on.attach();
        this.loom_ready.attach();
      } else {
        this.vacuum_on.detach();
        this.loom_ready.detach();
      }
      this.updateWeavingReady();
    });
  }

  get pi_online() { return this.status.pi_online; }
  get loom_online() { return this.status.loom_online; }
  get vacuum_on() { return this.status.vacuum_on; }
  get active_draft() { return this.status.active_draft; }
  get num_pedals() { return this.status.num_pedals; }
  get pedal_states() { return this.status.pedal_states; }
  get loom_ready() { return this.status.loom_ready; }
  get num_picks() { return this.status.num_picks; }
  get pick_data() { return this.status.pick_data; }
  get readyToWeave() { return (this.loom_online.val && this.num_pedals.val > 0); }

  // attach all listeners to other values in DB
  enableLoomPedals() {
    this.loom_online.attach();
    this.num_pedals.attach();
    this.pedal_states.attach();
  }

  disableLoomPedals() {
    this.loom_online.detach();
    this.num_pedals.detach();
    this.pedal_states.detach();
  }

  updateWeavingReady() {
    if (this.readyToWeave) {
      this.active_draft.attach();
      this.num_picks.attach();
      this.pick_data.attach();
    } else {
      this.active_draft.detach();
      this.num_picks.detach();
      this.pick_data.detach();
    }
  }

  toggleWeaving() {
    this.active_draft.attach();
    console.log("toggle weaving");
    let vac = !this.vacuum_on.val;
    console.log("vacuum is turning ", vac);
    this.status.active_draft.setVal(vac);
  }

  sendDraftRow() {

  }
}
