import { Injectable, Optional } from '@angular/core';
import { Auth, authState, getAuth } from '@angular/fire/auth';
import { Subject } from 'rxjs';
import { getDatabase, ref as fbref, set as fbset, query, ref, get as fbget, remove, update, onValue } from '@angular/fire/database';
import utilInstance from '../model/util';
import { promise } from 'protractor';


//LOOM ON
//USB
//START NODE


@Injectable({
  providedIn: 'root'
})
export class SendpickService {


  pick_request$ = new Subject<any>();
  loom_id = utilInstance.generateId(4);
  pick_size = 100;
  loom_name = '';
  has_active_loom = false;
  log:Array<string> = [];




  constructor(@Optional() private auth: Auth) { 

    const db = getDatabase();

    const loom_ready_ref = ref(db, 'looms/' + this.loom_id + '/loomready');
    
    onValue(loom_ready_ref, (snapshot) => {
      const data = snapshot.val();
      this.afterPickRequest(data);
    });

  }

  updateLoomSize(size: number){
    this.pick_size = size; 
  }



  /**
   * creates a database object instance for communicating pics between AdaCAD and a LoomDriver
   */
  createLoomConnection(){
    //create a realtime data entry 
    const db_obj =  {
      id: this.loom_id,
      name: this.loom_name,
      loomonline: false,
      loomready: false,
      pickdata: '',
      pickready: false
    };

    const db = getDatabase();
    update(fbref(db, `looms/`+this.loom_id),db_obj).then(success => {
      this.has_active_loom = true;
      this.log = [];
    }).catch(error => {
      this.has_active_loom = false;
      this.log = [];

    });

  }

  renameLoom(name: string){
    const db = getDatabase();
    const ref = fbref(db, 'looms/'+this.loom_id);
    update(ref,{name: name})
    .then(success => {
     console.log("name changed");
     this.loom_name = name;
    })
    .catch(err => {
      console.error(err);
    })
  }


  /**
   * removes the connection to the loom
   * called on disconnect or when the app is destroyed. 
   */
  removeLoomConnection(){

    const db = getDatabase();
    remove(fbref(db, `looms/`+this.loom_id))
    .then(success => {
      console.log("removed!")
    })
    .catch(error => {
      console.error("dbref could not be removed")
    });
    this.has_active_loom = false;

  }




  /**
   * a unique for the loom instance
   * @param loom_id 
   * @param pickdata 
   */
  sendPickData(pickdata: string): Promise<any>{

    //push to firebase
      const db = getDatabase();
      const ref = fbref(db, 'looms/'+this.loom_id);
      return update(ref,{pickdata: pickdata})
      .then(success => {
       this.log.push(pickdata);
       return Promise.resolve(true);
      })
      .catch(err => {
        console.error(err);
       return  Promise.resolve(false);

      })
    


  }

  //after 
  afterPickRequest(db_val: boolean){
    //listen on loom ready. //boolean

    if(db_val == true){
      //request increment viewer
    }else{

    }


  }




}
