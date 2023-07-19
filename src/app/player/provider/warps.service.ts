import { Injectable } from '@angular/core';
import { WarpSegment, WarpConfig, newWarpConfig } from '../model/warpconfig';

interface LoomConfig {
  warps: number,
  draftTiling: boolean
}

@Injectable({
  providedIn: 'root'
})
export class WarpsService {
  total_warps: number;
  config: WarpConfig;

  constructor(w: number = 2640) { 
    this.total_warps = w;
    this.config = newWarpConfig(this.total_warps);
  }
}
