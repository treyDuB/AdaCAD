import { Injectable } from '@angular/core';
import { getDatabase, ref, onValue} from "firebase/database";

@Injectable({
  providedIn: 'root'
})
export class PedalsService {


  pedal_state = {
      online: false,
      ready: false
  };


  constructor() { 

    const db = getDatabase();
    const is_online = ref(db, 'pedals/0/online');
    const is_ready = ref(db, 'pedals/0/ready');
    
    
    onValue(is_online, (snapshot) => {
      const data = snapshot.val(); //true or false
      this.pedal_state.online = data;
      
      //
      //updateStarCount(postElement, data);
    });




  }

  
}
