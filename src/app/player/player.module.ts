import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../core/core.module';

import { OpSequencerComponent } from './op-sequencer/op-sequencer.component';
import { WeavingStateComponent } from './weaving-state/weaving-state.component';
import { PlayerComponent } from './player.component';
import { VirtualPedalsComponent } from './virtual-pedals/virtual-pedals.component';

@NgModule({
  declarations: [
    PlayerComponent,
    OpSequencerComponent,
    WeavingStateComponent,
    VirtualPedalsComponent
  ],
  imports: [
    CommonModule,
    CoreModule
  ],
  exports: [
    PlayerComponent
  ],
})
export class PlayerModule { }
