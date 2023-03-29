/** COPY-PASTED FROM MIXER PALETTE OPERATION SUB-COMPONENT */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { OpSequencer, SequencerOp } from '../../provider/sequencer.service';
import { MatMenu } from '@angular/material/menu';

@Component({
  selector: 'app-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss']
})
export class OperationComponent implements OnInit {

  @Input() id: number; // index in the sequencer
  @Input() name: string;

  @Output() onOperationParamChange = new EventEmitter <any>(); 
  @Output() deleteOp = new EventEmitter <any>(); 
  @Output() duplicateOp = new EventEmitter <any>();
  @Output() shiftOp = new EventEmitter <boolean>(); 

  op: SequencerOp;

  constructor() { 
  }

  ngOnInit() {
  }

  ngAfterViewInit(){
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