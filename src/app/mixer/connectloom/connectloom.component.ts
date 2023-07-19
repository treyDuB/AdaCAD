import { Component } from '@angular/core';
import { SendpickService } from '../../core/provider/sendpick.service';

@Component({
  selector: 'app-connectloom',
  templateUrl: './connectloom.component.html',
  styleUrls: ['./connectloom.component.scss']
})
export class ConnectloomComponent {


  constructor(
    public comms: SendpickService ) { }


  initLoomConnection(){
    this.comms.createLoomConnection();
  }

  removeLoomConnection(){
    console.log('REMOVING CONNECTION')
    this.comms.removeLoomConnection();

  }

  updateDB(){
    this.comms.renameLoom(this.comms.loom_name)
  }

  ngOnDestroy(){
    this.comms.removeLoomConnection();
  }



}
