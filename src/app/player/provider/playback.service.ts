import { Injectable } from '@angular/core';
import { Draft } from 'src/app/core/model/datatypes';
import { PlayerState, WeavingPick } from '../model/player';

@Injectable({
  providedIn: 'root'
})
export class PlaybackService {
  preview: Draft;
  current: Draft;
  history: Draft;

  constructor() { }
}
