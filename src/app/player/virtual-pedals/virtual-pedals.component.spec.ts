import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualPedalsComponent } from './virtual-pedals.component';

describe('VirtualPedalsComponent', () => {
  let component: VirtualPedalsComponent;
  let fixture: ComponentFixture<VirtualPedalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VirtualPedalsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VirtualPedalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
