// /** CHAIN OPS */

// import { Performable, CompoundPerformable, 
//   OpInstance, 
//   BaseOpInstance,
// } from "./playerop";
// import { PlayerState, copyState } from "./state";
// import utilInstance from "../../core/model/util";

// /**
//  * Op chain:
//  * - 1 pedal, multiple operations in a chain (array)
//  * - if pedal, perform() each Op in sequence
//  * @param ops   array of OpInstances to execute in order
//  */
// export class ChainOp implements CompoundPerformable, BaseOpInstance {
//   id: number;
//   // classifier: PlayerOpClassifier = 'chain';
//   name: string = 'ch';
//   params: Array<any> = [];
//   u_name?: string;
//   dx?: string;
//   struct_id?: number;
//   chain_check: number = 1;
//   custom_check: number = -1;

//   ops: Array<OpInstance> = [];

//   constructor(p?: number) {
//     // this.classifier = 'chain';
//     this.name = 'ch';
//     if (p !== undefined) { this.id = p; }
//     else { this.id = utilInstance.generateId(8); }
//   }

//   static fromSingleOp(o: OpInstance, id?: number) {
//     // console.log("input id", id);
//     let ch = new ChainOp(id);
//     ch.addOp(o);
//     // console.log(ch);
//     return ch;
//   }
  
//   perform(init: PlayerState) : Promise<PlayerState> {
//     let newState = copyState(init);
//     newState.pedal = this.name;
//     let res = Promise.resolve(newState);
//     for (let o of this.ops) {
//       res = res.then((state) => o.perform(state));
//     }
//     return res;
//   }

//   addOp(op: OpInstance) {
//     this.ops.push(op);
//     this.name = this.name.concat("-"+op.name);
//   }

//   removeOp() {
//     return this.ops.pop();
//   }

//   delOpAt(x: number) {
//     return this.ops.splice(x, 1)[0];
//   }

//   insertOpAt(o: OpInstance, x: number) {
//     let arr: Array<any>;
//     if (x > -1) {
//       if (x == 0) {
//         this.ops.unshift(o);
//       } else if (x < this.ops.length) {
//         arr = this.ops.splice(x);
//         console.log(arr);
//         this.ops.push(o);
//         this.ops = this.ops.concat(arr);
//       } else {
//         this.ops.push(o);
//       }
//     }
//   }

// }
