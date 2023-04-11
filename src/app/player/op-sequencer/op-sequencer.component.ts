import { Component, OnInit, ViewChild, Input, ViewContainerRef, Type, ViewRef } from '@angular/core';
import { PlayerService } from '../player.service';
import { PedalsService } from '../provider/pedals.service';
import { SequencerOp, SequencerService } from '../provider/sequencer.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { OperationComponent, OpComponentEvent } from './operation/operation.component';
import { MappingsService } from '../provider/mappings.service';
import { MenuOp } from '../model/mapping';
import { Subscription } from 'rxjs';
import { SingleOp } from '../model/playerop';

interface SequencerRef {
  id: number,
  ref: ViewRef,
  comp: OperationComponent,
  inst: SequencerOp,
}

/** The OpSequencer component is analogous to the Mixer's Palette component since it hosts dynamically loaded Operation components */
@Component({
  selector: 'app-op-sequencer',
  templateUrl: './op-sequencer.component.html',
  styleUrls: ['./op-sequencer.component.scss']
})
export class OpSequencerComponent implements OnInit {
  @ViewChild('opMenuS') op_menu_s: MatExpansionPanel;
  @ViewChild('opMenuT') op_menu_t: MatExpansionPanel;

  @Input() isWeaving: boolean;

  /**
   * A container that supports the automatic generation and removal of the components inside of it
   */
  @ViewChild('vc', {read: ViewContainerRef, static: true}) vc: ViewContainerRef;

  /**
   * subscriptions to operation events in the sequencer
   */
  sequencerSubscriptions: Array<Subscription> = [];
  componentRefs: Array<SequencerRef> = [];

  constructor(
    public pls: PlayerService,
    public pds: PedalsService,
    public seq: SequencerService,
    public map: MappingsService,
  ) { 
    /** sequencer will emit an event (number) when the current op changes */
    this.seq.onChangePosition.subscribe(this.highlightCurrent.bind(this));
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
  }

  closeMenus() {
    this.op_menu_s.close();
    this.op_menu_t.close();
  }

  highlightCurrent() {
    console.log("components in seq ", this.componentRefs);
    console.log("seq service ", this.seq.ops);
    if (this.seq.ops.length > 0) {
      for (let i=0; i < this.seq.ops.length; i++) {
        const ref = this.componentRefs[i];
        if (i == this.seq.pos) {
          ref.comp.is_selected = true;
        } else { ref.comp.is_selected = false; }
      }
    }
  }

  /** reference palette.component.ts -> setOperationSubscriptions */
  setSequencerSubscriptions(op: OperationComponent) {
    /** for each output of the OperationComponent, subscribe to the appropriate function */
    this.sequencerSubscriptions.push(op.onOperationParamChange.subscribe(this.paramUpdated.bind(this)));
    this.sequencerSubscriptions.push(op.onDeleteOp.subscribe(this.opDeleted.bind(this)));
    this.sequencerSubscriptions.push(op.onDuplicateOp.subscribe(this.opDuplicated.bind(this)));
    this.sequencerSubscriptions.push(op.onShiftOp.subscribe(this.opShifted.bind(this)));
  }

  /**
   * creates an operation component
   * @param name the name of the operation this component will perform
   * @returns the OperationComponent created
   */
  createOperation(op: MenuOp): OperationComponent{
    const opRef = this.vc.createComponent<OperationComponent>(OperationComponent);

    const inst = this.map.createOpInstance(op);
    opRef.instance.op = inst;
    opRef.instance.seq_id = inst.id;
    this.seq.addSingleOp(inst);
    this.setSequencerSubscriptions(opRef.instance);

    let o: SequencerRef = {
      id: inst.id,
      inst: inst,
      comp: opRef.instance,
      ref: opRef.hostView,
    }
    this.componentRefs.push(o);

    return opRef.instance;
  }

  findOpIndex(id: number) {
    return this.seq.ops.findIndex((el) => el.id == id);
  }

  getSequencerRef(id: number) {
    console.log(this.componentRefs);
    return this.componentRefs.filter((el) => el.id == id)[0];
  }

  // callbacks for OperationComponent output events
  // NAMING CONVENTION (following mixer) parent component's methods are in past tense
  opDeleted(obj: OpComponentEvent) {
    console.log("op deleted arg ", obj);
    const op = this.getSequencerRef(obj.id);
    // console.log(op);
    // console.log(this.map.op_instances);
    this.seq.removeOpById(op.id)
    this.map.deleteInstance(op.id);
    
    this.removeFromViewContainer(op.ref);
    this.componentRefs = this.componentRefs.filter((el) => el.id != obj.id);
  }

  removeFromViewContainer(ref: ViewRef){
    const ndx: number = this.vc.indexOf(ref);
    if(ndx !== -1) this.vc.remove(ndx);
    else console.log('Error: view ref not found for removal', ref);
  }

  opDuplicated(obj: OpComponentEvent) {

  }

  opShifted(obj: OpComponentEvent) {
    const ref = this.getSequencerRef(obj.id);
    let x = this.vc.indexOf(ref.ref);
    let dir = (obj.dir) ? 1 : -1;
    this.vc.move(ref.ref, x+dir);
    
    // if (x > 0) {
    this.seq.shiftOp(x, obj.dir);
      // this.vc.move()
    // }
  }

  paramUpdated(obj: any) {
    this.map.updateInstanceParams(obj.id, obj.param, obj.val);
  }

  addSequencerOp(op: MenuOp) {
    // // console.log(op);
    // let inst = this.map.createOpInstance(op);
    // // console.log(inst);
    // this.seq.addSingleOp(inst);
    this.createOperation(op);
  }

  // ALL METHODS BELOW THIS IS FROM BEFORE DYNAMIC COMPONENTS, REPLACE EVENTUALLY
  shiftOp(i: number, dir: boolean) { 
    this.seq.shiftOp(i, dir);
  }

  removeOp(i: number) {
    this.seq.delOpAt(i);
  }

  updateParam(id: string, value: any) {
    console.log("param updated", id, value);
    let splitStr = id.split("-");
    const op_id = parseInt(splitStr[1]);
    const param_id = parseInt(splitStr[2]);
    this.map.updateInstanceParams(op_id, param_id, parseInt(value));
  }
}
