import { Component, OnInit } from '@angular/core';
import { PlayerService } from '../player.service';

@Component({
  selector: 'app-weaving-state',
  templateUrl: './weaving-state.component.html',
  styleUrls: ['./weaving-state.component.scss']
})
export class WeavingStateComponent implements OnInit {

  constructor(
    public pls: PlayerService
  ) { }

  ngOnInit(): void {
  }

}
