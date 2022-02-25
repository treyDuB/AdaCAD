import { Injectable } from '@angular/core';
import { getDatabase, ref, onValue} from "firebase/database";
import { Draft } from "../../core/model/draft";
import { Operation, OperationService } from 'src/app/mixer/provider/operation.service';

export interface Pedal {
  id: number,
  name: string,
  op: Operation,
}

/**
 * Definition of pedal provider
 * @class
 */
@Injectable({
  providedIn: 'root'
})
export class PedalsService {

  activeDraft: Draft;
  rowNum: number;

  status = {
      online: false,
      weaving: false,
      pickRequest: false
  };


  constructor() { 
    // init: start listening to changes in Firebase DB from the Pi
    const db = getDatabase();
    const is_online = ref(db, 'pedals/0/online');
    const is_ready = ref(db, 'pedals/0/ready');
    
    // listens for changes in loom online status
    onValue(is_online, (snapshot) => {
      const data = snapshot.val(); //true or false
      this.status.online = data;

      // if online, enable everything
      if (this.status.online) {
        enablePedals();
      } else {
        disablePedals();
      }
    });

  }

  // attach all listeners to other values in DB
  enablePedals() {
    // listen for changes in ready status
  }

  sendDraftRow() {

  }



  
}
