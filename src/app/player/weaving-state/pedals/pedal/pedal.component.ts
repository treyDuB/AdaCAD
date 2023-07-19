import { Component, OnInit, Input } from '@angular/core';
// import { PedalAction } from '../../../model/maptypes';
import { Pedal, PedalsService } from '../../../provider/pedals.service';

@Component({
  selector: 'app-pedal',
  templateUrl: './pedal.component.html',
  styleUrls: ['./pedal.component.scss']
})
export class PedalComponent implements OnInit {
  /** The pedal rendered by the component */
  @Input() pedal: Pedal;
  /** What the pedal is mapped to (if any) */
  @Input() mapped: any;
  
  @Input() physical: boolean;

  constructor(
    public pds: PedalsService
  ) { }

  ngOnInit(): void {
  }

}
