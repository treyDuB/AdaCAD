import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpButtonComponent } from './op-button.component';

describe('OpButtonComponent', () => {
  let component: OpButtonComponent;
  let fixture: ComponentFixture<OpButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpButtonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
