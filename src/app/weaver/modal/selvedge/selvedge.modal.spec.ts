import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelvedgeModal } from './selvedge.modal';

describe('SelvedgeModal', () => {
  let component: SelvedgeModal;
  let fixture: ComponentFixture<SelvedgeModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelvedgeModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelvedgeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
