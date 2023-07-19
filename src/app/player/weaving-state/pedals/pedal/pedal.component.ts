import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { PedalAction } from '../../../model/maptypes';
import { Pedal, PedalsService } from '../../../provider/pedals.service';

@Component({
  selector: 'app-pedal',
  templateUrl: './pedal.component.html',
  styleUrls: ['./pedal.component.scss']
})
export class PedalComponent implements OnInit, AfterViewInit {
  /** The pedal rendered by the component */
  @Input() pedal: Pedal;
  /** What the pedal is mapped to (if any) */
  @Input() mapped: PedalAction;
  
  @Input() physical: boolean;

  /** @ignore */
  constructor(
    public pds: PedalsService
  ) { }

  /** @ignore */
  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    console.log(this.mapped);
  }

}
