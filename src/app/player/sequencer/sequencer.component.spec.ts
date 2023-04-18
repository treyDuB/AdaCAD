import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpSequencerComponent } from './sequencer.component';

import { MappingsService } from '../provider/mappings.service';

import { OpTemplate } from '../model/playerop';

describe('OpSequencerComponent', () => {
  let component: OpSequencerComponent;
  let fixture: ComponentFixture<OpSequencerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpSequencerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpSequencerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.addSingleOp(component.map.getOp('tabby'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
