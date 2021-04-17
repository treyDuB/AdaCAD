import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { Region } from '../../../core/model/region';
import { Shape } from '../../../core/model/shape';
import { Effect } from '../../../core/model/effect';

@Component({
  selector: 'app-masks',
  templateUrl: './masks.component.html',
  styleUrls: ['./masks.component.scss']
})
export class MasksComponent implements OnInit {
  
  @Input() regions: any;
  @Input() effects: any;
  @Output() onMask: any = new EventEmitter();
  @Output() onFocus: any = new EventEmitter();
  @Output() onCreateRegion: any = new EventEmitter();
  @Output() onRemoveRegion: any = new EventEmitter();
  @Output() onChangeRegionEffect: any = new EventEmitter();
  @Output() onChangeRegionShape: any = new EventEmitter();


  constructor() { }

  ngOnInit() {
  }

  // what's this function for? still fits the needed features?
  maskEvent(e, id) {
    var obj: any = {};
    obj.id = id;
    this.onMask.emit(obj);
  }

  // function: focusing on a single region
  // on draft view, highlight the border of the region

  // function: createRegion
  // 1) darken the whole draft (null Shape) and user first defines
  // shape with a Selection (simple) or brush
  // 2) choose Effect in EffectModel
  createRegion() {

  }

  // function: removeRegionn
  removeRegion(region) {
    this.onRemoveRegion.emit({region: region});
  }

  // function: editRegionShape
  // edit the shape directly on draft window
  editRegionShape(region) {

  }

  // function: editRegionEffect
  // opens EffectModal
  // 
}
