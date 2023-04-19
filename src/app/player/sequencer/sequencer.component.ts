import { Component, OnInit, ViewChild, Input, ViewContainerRef, ViewRef } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Subscription } from 'rxjs';

import { OperationComponent, OpComponentEvent } from './operation/operation.component';

import { MappingsService } from '../provider/mappings.service';
import { PlayerService } from '../player.service';
import { PedalsService } from '../provider/pedals.service';
import { SequencerOp, SequencerService } from '../provider/sequencer.service';
import { OpTemplate as MenuOp, OpInstance as SingleOp } from '../model/playerop';
import { ChainOp } from '../model/chainop';
 
interface SequencerRef {
  id: number,
  ref: ViewRef,
  comp: OperationComponent,
  inst: SequencerOp,
}

/** The OpSequencer component is analogous to the Mixer's Palette component since it hosts dynamically loaded Operation components */
@Component({
  selector: 'app-sequencer',
  templateUrl: './sequencer.component.html',
  styleUrls: ['./sequencer.component.scss']
})
export class OpSequencerComponent implements OnInit {
  @ViewChild('opMenuS') op_menu_s: MatExpansionPanel;
  @ViewChild('opMenuT') op_menu_t: MatExpansionPanel;

  @Input() isWeaving: boolean;

  constructor(
    public pls: PlayerService,
    public pds: PedalsService,
    public seq: SequencerService,
    public map: MappingsService,
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
  }

  closeMenus() {
    this.op_menu_s.close();
    this.op_menu_t.close();
  }

  addChainOp(op: MenuOp) {
    const inst = this.seq.addChainOp(op);
  }

  addSingleOp(op: MenuOp) {
    // console.log(this.map);
    const inst = this.seq.addSingleOp(op);
    // console.log(inst);
  }

  findOpIndex(id: number) {
    return this.seq.ops.findIndex((el) => el.id == id);
  }

  // callbacks for OperationComponent output events
  // NAMING CONVENTION (following mixer) parent component's methods are in past tense
  opDeleted(obj: OpComponentEvent) {
    this.seq.removeOpById(obj.id)
    this.map.deleteInstance(obj.id);
  }

  opDuplicated(obj: OpComponentEvent) {  }

  opShifted(obj: OpComponentEvent, x: number) {
    this.seq.shiftOp(x, obj.dir)
  }

  paramUpdated(obj: any) {
    this.map.updateInstanceParams(obj.id, obj.param, obj.val);
  }
  
}
