import { Component, OnInit, 
  Input, Output, EventEmitter, ViewChild
} from '@angular/core';
import { MatMenu } from '@angular/material/menu';

import { SequencerOp, SequencerService } from '../../../provider/sequencer.service';

@Component({
  selector: 'app-menu-single',
  templateUrl: './menu-single.component.html',
  styleUrls: ['./menu-single.component.scss']
})
export class SingleOpMenuComponent implements OnInit {
  @ViewChild(MatMenu) menu;

  @Input() op: SequencerOp;
  @Input() index: number;

  constructor(
    public seq: SequencerService
  ) { }

  ngOnInit(): void {
  }
}
