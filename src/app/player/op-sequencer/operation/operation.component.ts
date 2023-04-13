/** COPY-PASTED FROM MIXER PALETTE OPERATION SUB-COMPONENT */

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { OpSequencer, SequencerOp, SequencerService } from '../../provider/sequencer.service';
import { MatMenu } from '@angular/material/menu';

/** events that an OperationComponent can emit */
export type OpComponentEvent = {
  id: number, /** ID of the op instance */
  param?: any,
  val?: any,
  dir?: boolean
}

@Component({
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit, OnDestroy {
  /** The Operation's index in sequencer array */
  @Input() seq_id: number;
  /** Operation Instance belonging to the component */
  @Input() op: SequencerOp;
  @Input() is_selected: boolean;

  /** event emitter outputs */
  /** NAMING CONVENTION: onAction */
  @Output() onOperationParamChange = new EventEmitter <OpComponentEvent>(); 
  @Output() onDeleteOp = new EventEmitter <OpComponentEvent>(); 
  @Output() onDuplicateOp = new EventEmitter <OpComponentEvent>();
  @Output() onShiftOp = new EventEmitter <OpComponentEvent>(); 

  constructor() { 
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    
  }

  /**
   * called from the child parameter when a value has changed, this functin then updates the inlets
   * @param id an object containing the id of hte parameter that has changed
   * @param value 
   */
  updateParam(id: string, value: string){
    console.log("param updated", id, value);
    let splitStr = id.split("-");
    const op_id = parseInt(splitStr[1]);
    const param_id = parseInt(splitStr[2]);
    this.onOperationParamChange.emit({id: op_id, param: param_id, val: parseInt(value)});
  }

  delete(){
    this.onDeleteOp.emit({id: this.op.id});
  }

  duplicate(){
    this.onDuplicateOp.emit({id: this.op.id});
  }

  shift(dir: boolean) {
    this.onShiftOp.emit({id: this.op.id, dir: dir});
  }
 
}