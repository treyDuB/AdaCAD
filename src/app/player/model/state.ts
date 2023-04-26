import { Draft } from "../../core/model/datatypes"
import { initDraft } from "../../core/model/drafts";

/** 
 * @interface PlayerState Represents the Draft Player as an FSM
 * @param draft The Draft currently loaded by the weaver
 * @param row which row of the draft the weaving is at
 * @param weaving whether or not the TC2 is actually running, or the weaver is just previewing the draft
 * @param numPicks the number of rows (picks) that have been sent to the loom so far (because the TC2 needs to receive this as part of the pick data)
 * @param pedal the name (mapped function) of the pedal that triggered this state change
 */
export interface PlayerState {
  /** The Draft currently loaded in the Player */
  draft: Draft, 
  /** Which row of the Draft will be sent to the loom. (-1) if not weaving. */
  row: number,
  /** The pedal (??) that triggered the state change. */
  pedal: string | number,
  /** The operation (??) that triggered the state change. */
  op?: string,
  /** Whether or not we are weaving; if picks are being sent to the loom. */
  weaving: boolean,
  /** The number of picks that have been sent to the loom so far */
  numPicks: number,
}

/** Helper function that returns a copy of a given PlayerState */
export function copyState(init: PlayerState): PlayerState {
  return Object.assign({}, init);
}

/** Returns a default starting state for the player with an empty Draft, and zero picks woven. */
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
  rowData: string
}