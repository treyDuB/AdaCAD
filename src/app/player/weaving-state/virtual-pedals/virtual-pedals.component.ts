import { Component, OnInit, HostListener } from '@angular/core';
import { PedalsService } from '../../provider/pedals.service';
import { PlayerService } from '../../player.service';

/**
 * @class
 * Component that displays the number of virtual pedals connected, and allows the user to interact with them via key/mouse input.
 */
@Component({
  selector: 'app-virtual-pedals',
  templateUrl: './virtual-pedals.component.html',
  styleUrls: ['./virtual-pedals.component.scss']
})
export class VirtualPedalsComponent implements OnInit {

  /** @constructor */
  constructor(
    public pds: PedalsService,
    public pls: PlayerService,
  ) { }

  /** @method */
  ngOnInit(): void {
  }

  @HostListener('window:keydown', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    console.log(event);
    switch(event.key) {
      case ' ': 
        this.pds.togglePedalByID(0); 
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        this.pds.togglePedalByID(parseInt(event.key));
        break;
      case '0':
        this.pds.togglePedalByID(10);
        break;
      default: 
        console.log("unknown key ", event.key);
        break;
    }
  }
}
