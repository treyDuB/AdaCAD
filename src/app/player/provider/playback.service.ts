import { Injectable } from '@angular/core';
import { Draft } from '../../core/model/datatypes';
import { initDraft, warps, wefts } from '../../core/model/drafts';
import { PlayerState, initState, copyState } from '../model/state';

import { tabby } from '../../mixer/model/op_definitions';
import { max } from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class PlaybackService {
  preview: Draft;
  history: Draft;

  state: PlayerState;
  prevStates: Array<PlayerState>;
  max_width: number;

  get current(): Draft { return this.state.draft}

  get no_draft(): boolean { return this.state.draft == null; }
  get no_history(): boolean { return this.history.drawdown.length == 0 }

  get previewHeight(): number { return wefts(this.preview.drawdown); }
  get historyHeight(): number { return wefts(this.history.drawdown); }

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
