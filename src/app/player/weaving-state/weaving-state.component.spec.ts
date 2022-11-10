import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeavingStateComponent } from './weaving-state.component';

describe('WeavingStateComponent', () => {
  let component: WeavingStateComponent;
  let fixture: ComponentFixture<WeavingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WeavingStateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeavingStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
