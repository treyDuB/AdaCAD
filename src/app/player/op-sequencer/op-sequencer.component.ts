import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { PlayerService } from '../player.service';
import { PedalsService } from '../provider/pedals.service';
import { SequencerService } from '../provider/sequencer.service';
import { MatExpansionPanel } from '@angular/material/expansion';

@Component({
  selector: 'app-op-sequencer',
  templateUrl: './op-sequencer.component.html',
  styleUrls: ['./op-sequencer.component.scss']
})
export class OpSequencerComponent implements OnInit {
  @ViewChild('opMenuS') op_menu_s: MatExpansionPanel;
  @ViewChild('opMenuT') op_menu_t: MatExpansionPanel;

  @Input() isWeaving: boolean;

  constructor(
    public pls: PlayerService,
    public pds: PedalsService,
    public seq: SequencerService
  ) { }

  ngOnInit(): void {
    // console.log(this.op_menu);
  }

  ngAfterViewInit() {
    // console.log(this.op_menu_s);
    // console.log(this.op_menu_t);
  }

  closeMenus() {
    this.op_menu_s.close();
    this.op_menu_t.close();
  }
}
