import { Injectable } from '@angular/core';
import { Draft } from '../../core/model/datatypes';
import { initDraft, warps, wefts } from '../../core/model/drafts';
import { PlayerState, initState, copyState } from '../model/state';

import { tabby } from '../../mixer/model/op_definitions';
import { max } from 'lodash';

/**
 * @class
 * Keeps track of the weaver's session: what rows have been woven (history), and what rows are upcoming with the currently-selected draft (preview).
 */
@Injectable({
  providedIn: 'root'
})
export class PlaybackService {
  /** 
   * @property {Draft} preview 
   * The next few rows, given the current active Draft.
  */
  preview: Draft; 
  /**
   * @prop {Draft} history 
   * The compilation of all rows woven so far.
   */
  history: Draft;
  /**
   * @member {PlayerState} state 
   * State information for the Player, including current Draft, most recent Operation, most recent Pedal, whether or not the loom is weaving.
   */
  state: PlayerState;
  /**
   * @prop {Array<PlayerState>} prevStates 
   * An array of all previous PlayerStates (most recent first)
   */
  prevStates: Array<PlayerState>;
  /**
   * @property {number} max_width 
   * The largest width seen in this session. Used to make sure the history draft is wide enough to show everything.
   */
  max_width: number;

  get current(): Draft { return this.state.draft} /** The active draft. */

  /** TRUE if there is no active draft set. */
  get no_draft(): boolean { return this.state.draft == null; }
  /** TRUE if history is empty. */
  get no_history(): boolean { return this.history.drawdown.length == 0 }

  /** Number of rows in the preview draft. */
  get previewHeight(): number { return wefts(this.preview.drawdown); }
  /** Number of rows in the history draft. */
  get historyHeight(): number { return wefts(this.history.drawdown); }

  /** @constructor */
  constructor(
    // public pls: PlayerService
  ) { 
    this.preview = initDraft();
    this.history = initDraft();

    this.state = initState();
    this.prevStates = [];

    this.state.draft = tabby.perform([1]);
    this.max_width = 2;
    this.updatePreview();
  }

  setState(s: PlayerState) {
    const prev = copyState(this.state);
    this.prevStates.push(prev);
    this.logHistory(prev);

    this.state = copyState(s);
    this.updatePreview();
  }

  updatePreview() {
    const drawdown = this.state.draft.drawdown;
    this.preview.drawdown = drawdown.slice(this.state.row).concat(drawdown.slice(0, this.state.row));
    console.log(this.preview.drawdown);
  }

  logHistory(s: PlayerState) {
    let history = this.history.drawdown;
    this.max_width = max([warps(s.draft.drawdown), this.max_width]);
    history.unshift(s.draft.drawdown[s.row]); 
    console.log(this.history.drawdown);
  }
}
