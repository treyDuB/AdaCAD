// import { Component, OnInit, 
//   Input, Output, EventEmitter, ViewChild
// } from '@angular/core';
// import { MatMenu } from '@angular/material/menu';

// import { SequencerOp, SequencerService } from '../../../provider/sequencer.service';

// @Component({
//   selector: 'app-menu-single',
//   templateUrl: './menu-single.component.html',
//   styleUrls: ['./menu-single.component.scss']
// })
// export class SingleOpMenuComponent implements OnInit {
//   @ViewChild(MatMenu) menu;

//   @Input() op: SequencerOp;
//   @Input() index: number;

//   constructor(
//     public seq: SequencerService
//   ) { }

//   ngOnInit(): void {
//   }

//   updateParam(param_id: number, value: any) {
//     // console.log(value);
//     let val: number;
//     if (this.op.params[param_id].type === 'boolean') {
//       val = (value) ? 1 : 0;
//     } else { val = value; }
//     this.seq.updateParams(this.op.id, param_id, val);
//   }
// }
