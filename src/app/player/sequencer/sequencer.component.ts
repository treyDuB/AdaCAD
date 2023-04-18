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

  /**
   * A container that supports the automatic generation and removal of the components inside of it
   */
  // @ViewChild('vc', {read: ViewContainerRef, static: true}) vc: ViewContainerRef;

  /**
   * subscriptions to operation events in the sequencer
   */
  // sequencerSubscriptions: Array<Subscription> = [];
  // componentRefs: Array<SequencerRef> = [];

  constructor(
    public pls: PlayerService,
    public pds: PedalsService,
    public seq: SequencerService,
    public map: MappingsService,
  ) { 
    /** sequencer will emit an event (number) when the current op changes */
    // this.seq.onChangePosition.subscribe(this.highlightCurrent.bind(this));
  }

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
    // this.createOpComponent(inst);
  }

  addSingleOp(op: MenuOp) {
    // console.log(this.map);
    const inst = this.seq.addSingleOp(op);
    // console.log(inst);
    // this.createOpComponent(inst);
  }

  findOpIndex(id: number) {
    return this.seq.ops.findIndex((el) => el.id == id);
  }

  // callbacks for OperationComponent output events
  // NAMING CONVENTION (following mixer) parent component's methods are in past tense
  opDeleted(obj: OpComponentEvent) {
    this.seq.removeOpById(obj.id)
    this.map.deleteInstance(obj.id);
    
    // this.removeFromViewContainer(op.ref);
    // this.componentRefs = this.componentRefs.filter((el) => el.id != obj.id);
  }

  opDuplicated(obj: OpComponentEvent) {  }

  opShifted(obj: OpComponentEvent, x: number) {
    this.seq.shiftOp(x, obj.dir)
  }

  paramUpdated(obj: any) {
    this.map.updateInstanceParams(obj.id, obj.param, obj.val);
  }

  // avoided dynamic component stuff
  // highlightCurrent() {
  //   console.log("components in seq ", this.componentRefs);
  //   console.log("seq service ", this.seq.ops);
  //   console.log("current ", this.seq.pos);
  //   if (this.seq.ops.length > 0) {
  //     for (let i=0; i < this.seq.ops.length; i++) {
  //       const ref = this.componentRefs[i];
  //       if (i == this.seq.pos) {
  //         ref.comp.is_selected = true;
  //       } else { ref.comp.is_selected = false; }
  //     }
  //   }
  // }

  // /** reference palette.component.ts -> setOperationSubscriptions */
  // setSequencerSubscriptions(op: OperationComponent) {
  //   /** for each output of the OperationComponent, subscribe to the appropriate function */
  //   this.sequencerSubscriptions.push(op.onOperationParamChange.subscribe(this.paramUpdated.bind(this)));
  //   this.sequencerSubscriptions.push(op.onDeleteOp.subscribe(this.opDeleted.bind(this)));
  //   this.sequencerSubscriptions.push(op.onDuplicateOp.subscribe(this.opDuplicated.bind(this)));
  //   this.sequencerSubscriptions.push(op.onShiftOp.subscribe(this.opShifted.bind(this)));
  // }

  // /**
  //  * creates an operation component
  //  * @param name the name of the operation this component will perform
  //  * @returns the OperationComponent created
  //  */
  // createOpComponent(inst: SequencerOp): OperationComponent{
  //   const opRef = this.vc.createComponent<OperationComponent>(OperationComponent);
  //   console.log(inst);

  //   // const inst = this.map.createOpInstance(op);
  //   opRef.instance.op = inst;
  //   opRef.instance.seq_id = inst.id;
  //   this.setSequencerSubscriptions(opRef.instance);

  //   let o: SequencerRef = {
  //     id: inst.id,
  //     inst: inst,
  //     comp: opRef.instance,
  //     ref: opRef.hostView,
  //   }
  //   this.componentRefs.push(o);
  //   console.log(o);

  //   return opRef.instance;
  // }

  // getSequencerRef(id: number) {
  //   console.log(this.componentRefs);
  //   return this.componentRefs.filter((el) => el.id == id)[0];
  // }

  // removeFromViewContainer(ref: ViewRef){
  //   const ndx: number = this.vc.indexOf(ref);
  //   if(ndx !== -1) this.vc.remove(ndx);
  //   else console.log('Error: view ref not found for removal', ref);
  // }

  // ALL METHODS BELOW THIS IS FROM BEFORE DYNAMIC COMPONENTS, REPLACE EVENTUALLY
  // shiftOp(i: number, dir: boolean) { 
  //   this.seq.shiftOp(i, dir);
  // }

  // removeOp(i: number) {
  //   this.seq.delOpAt(i);
  // }

  // updateParam(id: string, value: any) {
  //   console.log("param updated", id, value);
  //   let splitStr = id.split("-");
  //   const op_id = parseInt(splitStr[1]);
  //   const param_id = parseInt(splitStr[2]);
  //   this.map.updateInstanceParams(op_id, param_id, parseInt(value));
  // }
}
