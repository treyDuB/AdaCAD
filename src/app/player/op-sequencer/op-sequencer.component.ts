import { Component, OnInit } from '@angular/core';
import { PlayerService } from '../player.service';

@Component({
  selector: 'app-op-sequencer',
  templateUrl: './op-sequencer.component.html',
  styleUrls: ['./op-sequencer.component.scss']
})
export class OpSequencerComponent implements OnInit {

  constructor(
    public pls: PlayerService
  ) { }

  ngOnInit(): void {
  }

}
