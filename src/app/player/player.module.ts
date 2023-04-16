import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../core/core.module';
import { HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { BrowserModule } from '@angular/platform-browser';

import { OpSequencerComponent } from './op-sequencer/op-sequencer.component';
import { WeavingStateComponent } from './weaving-state/weaving-state.component';
import { PlayerComponent } from './player.component';
import { VirtualPedalsComponent } from './weaving-state/virtual-pedals/virtual-pedals.component';
import { PlaybackComponent } from './playback/playback/playback.component';
import { OperationComponent } from './op-sequencer/operation/operation.component';
import { ChainOpComponent } from './op-sequencer/operation/chain-op/chain-op.component';
import { SequencerService } from './provider/sequencer.service';
import { MappingsService } from './provider/mappings.service';

@NgModule({
  declarations: [
    PlayerComponent,
    OpSequencerComponent,
    WeavingStateComponent,
    VirtualPedalsComponent,
    PlaybackComponent,
    OperationComponent,
    ChainOpComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    HttpClientModule,
    BrowserModule,
    MatIconModule
  ],
  providers: [
    SequencerService,
    MappingsService
  ],
  exports: [
    PlayerComponent
  ],
})
export class PlayerModule { }
