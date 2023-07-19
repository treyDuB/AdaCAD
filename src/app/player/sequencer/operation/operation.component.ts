// /** COPY-PASTED FROM MIXER PALETTE OPERATION SUB-COMPONENT */

// import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
// import { MatMenu } from '@angular/material/menu';
// import { SingleOpMenuComponent } from './menu-single/menu-single.component';
// import { ChainOpMenuComponent } from './menu-chain/menu-chain.component';


// /** events that an OperationComponent can emit */
// export type OpComponentEvent = {
//   /** ID of the op instance */
//   id: number, 
//   /** May also emit a parameter identifier */
//   param?: any,
//   /** May also emit a parameter value */
//   val?: any,
//   /** May also emit a direction for shifting/moving */
//   dir?: boolean
// }

// @Component({
//   selector: 'app-operation',
//   templateUrl: './operation.component.html',
//   styleUrls: ['./operation.component.scss']
// })
// export class OperationComponent implements OnInit, OnDestroy {
//   @ViewChild(SingleOpMenuComponent) singleMenu;
//   @ViewChild(ChainOpMenuComponent) chainMenu;

//   menu: MatMenu;

//   /** The Operation's index in sequencer array */
//   @Input() seq_id: number;
//   /** Operation Instance belonging to the component */
//   // @Input() op: SequencerOp;
//   @Input() is_selected: boolean;

//   /** event emitter outputs */
//   /** NAMING CONVENTION: onAction */
//   @Output() onOperationParamChange = new EventEmitter <OpComponentEvent>(); 
//   @Output() onDeleteOp = new EventEmitter <OpComponentEvent>(); 
//   @Output() onDuplicateOp = new EventEmitter <OpComponentEvent>();
//   @Output() onShiftOp = new EventEmitter <OpComponentEvent>(); 

//   /** @ignore */
//   constructor(
//     // public seq: SequencerService
//   ) {}

//   /** @ignore */
//   ngOnInit(): void {}

//   /** Load this operation's menu depending on if it's a chain or not. */
//   ngAfterViewInit(): void {
//     this.menu = (this.op.classifier == 'chain') ? this.chainMenu.menu : this.singleMenu.menu;
//   }

//   /** @ignore */
//   ngOnDestroy(): void {}

//   /**
//    * called from the child parameter when a value has changed, this functin then updates the inlets
//    * @param id an object containing the id of the parameter that has changed
//    * @param value the value as a string (number or boolean, parse it)
//    */
//   updateParam(id: string, value: string){
//     console.log("param updated", id, value);
//     let splitStr = id.split("-");
//     const op_id = parseInt(splitStr[1]);
//     const param_id = parseInt(splitStr[2]);
//     this.onOperationParamChange.emit({id: op_id, param: param_id, val: parseInt(value)});
//   }

//   delete(){
//     this.onDeleteOp.emit({id: this.op.id});
//   }

//   duplicate(){
//     this.onDuplicateOp.emit({id: this.op.id});
//   }

//   shift(dir: boolean) {
//     this.onShiftOp.emit({id: this.op.id, dir: dir});
//   }
 
// }