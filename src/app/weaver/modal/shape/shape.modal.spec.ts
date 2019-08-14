import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeModal } from './shape.modal';

describe('PatternModal', () => {
  let component: ShapeModal;
  let fixture: ComponentFixture<ShapeModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShapeModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
