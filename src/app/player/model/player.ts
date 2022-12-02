import { Draft } from "../../core/model/datatypes"
import { initDraft } from "../../core/model/drafts";

/** @interface
 * PlayerState represents the Draft Player as an FSM
 * @param draft The Draft currently loaded by the weaver
 * @param row which row of the draft the weaving is at
 * @param weaving whether or not the TC2 is actually running, or the weaver is just previewing the draft
 * @param numPicks the number of rows (picks) that have been sent to the loom so far (because the TC2 needs to receive this as part of the pick data)
 * @param pedal the name (mapped function) of the pedal that triggered this state change
 */
export interface PlayerState {
  draft: Draft,
  row: number,
  pedal: string,
  weaving: boolean,
  numPicks: number,
}

export function copyState(init: PlayerState): PlayerState {
  return Object.assign({}, init);
}

export function initState(): PlayerState { 
  return {
    draft: initDraft(),
    row: 0,
    pedal: "",
    weaving: false,
    numPicks: 0
}};

export interface WeavingPick {
  pickNum: number,
  rowData: string,
}

export interface WeavingLog {
  draft: Draft,
  shortDraft: Draft,
  states: Array<PlayerState>,
}