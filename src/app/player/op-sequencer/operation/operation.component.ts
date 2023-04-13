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

  @Input() id: number; // index in the sequencer
  @Input() name: string;

  @Output() onOperationParamChange = new EventEmitter <any>(); 
  @Output() deleteOp = new EventEmitter <any>(); 
  @Output() duplicateOp = new EventEmitter <any>();
  @Output() shiftOp = new EventEmitter <boolean>(); 

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
  onParamChange(obj: any){
    this.onOperationParamChange.emit({id: this.id});
  }

  delete(){
    this.deleteOp.emit({id: this.id});
  }

  duplicate(){
    this.duplicateOp.emit({id: this.id});
  }
 
}