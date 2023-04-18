import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../core/core.module';
import { HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { BrowserModule } from '@angular/platform-browser';

import { OpSequencerComponent } from './sequencer/sequencer.component';
import { WeavingStateComponent } from './weaving-state/weaving-state.component';
import { PlayerComponent } from './player.component';
import { VirtualPedalsComponent } from './weaving-state/virtual-pedals/virtual-pedals.component';
import { PlaybackComponent } from './playback/playback/playback.component';
import { OperationComponent } from './sequencer/operation/operation.component';
import { ChainOpMenuComponent } from './sequencer/operation/menu-chain/menu-chain.component';
import { SequencerService } from './provider/sequencer.service';
import { MappingsService } from './provider/mappings.service';
import { OpButtonComponent } from './sequencer/operation/op-button/op-button.component';
import { SingleOpMenuComponent } from './sequencer/operation/menu-single/menu-single.component';

@NgModule({
  declarations: [
    PlayerComponent,
    OpSequencerComponent,
    WeavingStateComponent,
    VirtualPedalsComponent,
    PlaybackComponent,
    OperationComponent,
    ChainOpMenuComponent,
    OpButtonComponent,
    SingleOpMenuComponent
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
