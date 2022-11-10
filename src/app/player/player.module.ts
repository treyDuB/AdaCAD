import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../core/core.module';
import { MixerModule } from '../mixer/mixer.module';

import { OpSequencerComponent } from './op-sequencer/op-sequencer.component';
import { WeavingStateComponent } from './weaving-state/weaving-state.component';
import { PlayerComponent } from './player.component';

@NgModule({
  declarations: [
    PlayerComponent,
    OpSequencerComponent,
    WeavingStateComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    MixerModule
  ],
  exports: [
    PlayerComponent
  ],
})
export class PlayerModule { }
