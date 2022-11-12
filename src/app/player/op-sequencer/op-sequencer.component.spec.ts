import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpSequencerComponent } from './op-sequencer.component';

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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
