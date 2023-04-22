/** Data types for representing warp configurations */

type WarpDisabled = false;
type WarpEnabled = true;

type WarpSegment = {
  start: number,
  end: number,
  en: boolean
}

interface WarpConfig {
  segments: Array<WarpSegment>;
  width: number; /** total number of warps */
}