import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedalComponent } from './pedal.component';

describe('PedalComponent', () => {
  let component: PedalComponent;
  let fixture: ComponentFixture<PedalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PedalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PedalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
