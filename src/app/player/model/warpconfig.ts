/** Data types for representing warp configurations */

type WarpDisabled = false;
type WarpEnabled = true;

export type WarpSegment = {
  start: number,
  end: number,
  en: boolean
}

export interface WarpConfig {
  segments: Array<WarpSegment>;
  width: number; /** total number of warps */
}

export function newWarpConfig(n?: number) {
  if (n > 0) {
    return { 
      segments: [{start: 0, end: n-1, en: true}], 
      width: n
    }
  }
  return {
    segments: [],
    width: 0
  }
}