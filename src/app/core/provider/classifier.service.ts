import { Injectable } from '@angular/core';
import { Draft } from '../model/draft';
import * as tf from '@tensorflow/tfjs'


export interface Classification{
  pinch: number,
  force: number
}

interface Model{
  pinch: any,
  force: any, 
}


@Injectable({
  providedIn: 'root'
})
export class ClassifierService {

  private model: Model;


  constructor() {  
  }

  resizeDraft(arr: Uint8Array[][]) : Uint8Array[][] {
    var added = 0
    while (arr[0].length < 32) {
      for (var i = 0; i < arr.length; i++) {
        arr[i].push(arr[i][added]);
      }
      if (added < arr[0].length - 1) {
        added += 1;
      } else {
        added = 0;
      }
    }
    var added = 0
    while (arr.length < 64) {
      arr.push(arr[added]);
      if (added < arr.length - 1) {
        added += 1;
      } else {
        added = 0;
      }
    }
    if (arr[0].length != 32 || arr.length != 64) {
      console.log("Draft size too large for sensor prediction");
    } 
    return arr;
  }

  async predictDraft(draft: Draft) : Promise<Classification>{
    const classification:Classification = {
      pinch: -1,
      force: -1
    }
    Promise.all(
      [tf.loadLayersModel('../../../assets/pinch/model.json'), 
      tf.loadLayersModel('../../../assets/force/model.json'),])
      
    .then(model => {
       this.model = {
          pinch: model[0],
          force:model [1]
        }

        var newDraft = [];
        for (var i = 0; i < draft.pattern.length; i++) {
          newDraft.push([]);
          for (var j = 0; j < draft.pattern[i].length; j++) {
            newDraft[i].push(draft.pattern[i][j].isUp() ? [255, 255, 255] : [0, 0, 0]);
          }
        }

      let newDraftResized = this.resizeDraft(newDraft);
      classification.pinch = this.model.pinch.predict(tf.tensor([newDraftResized])).dataSync()[0];
      classification.force = this.model.force.predict(tf.tensor([newDraftResized])).dataSync()[0];

      return Promise.resolve(classification);
    }).catch(err => {
      console.log(err);
      return Promise.resolve(classification);
    });
    return Promise.resolve(classification);
  }
}
