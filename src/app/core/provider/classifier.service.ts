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

  Promise.all(
      [tf.loadLayersModel('../../../assets/pinch/model.json'), 
      tf.loadLayersModel('../../../assets/force/model.json'),])
      
      .then(model => {
       this.model = {
          pinch: model[0],
          force:model [1]}
      }
  ).catch(console.error);


  }

  predictDraft(d: Draft) : Promise<Classification>{

    const classification:Classification = {
      pinch: -1,
      force: -1
    }

    // classification.pinch = this.model.pinch.predict(tf.tensor(d));
    // classification.force = this.model.force.predict(tf.tensor(d));


    return Promise.resolve(classification);
  }



}
