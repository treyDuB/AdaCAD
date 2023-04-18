import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { SequencerService, SequencerOp } from '../../../provider/sequencer.service';
import { ChainOp } from '../../../model/chainop';
import { MatMenu } from '@angular/material/menu';

@Component({
  selector: 'app-menu-chain',
  templateUrl: './menu-chain.component.html',
  styleUrls: ['./menu-chain.component.scss']
})
export class ChainOpMenuComponent implements OnInit {
  @ViewChild(MatMenu) menu;

  @Input() op: ChainOp;
  @Input() index: number;

  constructor(
    public seq: SequencerService
  ) { }

  ngOnInit(): void {
  }

}
