import { Component, OnInit } from '@angular/core';
import { PlayerService } from '../player.service';
import { SequencerService } from '../provider/sequencer.service';

@Component({
  selector: 'app-op-sequencer',
  templateUrl: './op-sequencer.component.html',
  styleUrls: ['./op-sequencer.component.scss']
})
export class OpSequencerComponent implements OnInit {

  constructor(
    public pls: PlayerService,
    public seq: SequencerService
  ) { }

  ngOnInit(): void {
  }

}
