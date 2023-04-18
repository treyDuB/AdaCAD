import { Component, OnInit, Input, Output } from '@angular/core';

@Component({
  selector: 'app-op-button',
  templateUrl: './op-button.component.html',
  styleUrls: ['./op-button.component.scss']
})
export class OpButtonComponent implements OnInit {

  @Input() name: string;
  @Input() classifier: string;
  @Input() selected: boolean;

  constructor() { }

  ngOnInit(): void {
  }

}
