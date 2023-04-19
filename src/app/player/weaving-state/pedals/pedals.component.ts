import { Component, OnInit, Input } from '@angular/core';
import { Pedal, PedalsService } from '../../provider/pedals.service';
import { MappingsService } from '../../provider/mappings.service';

@Component({
  selector: 'app-pedals',
  templateUrl: './pedals.component.html',
  styleUrls: ['./pedals.component.scss']
})
export class PedalsComponent implements OnInit {

  constructor(
    public pds: PedalsService,
    public map: MappingsService
  ) { }

  ngOnInit(): void {
  }

}
