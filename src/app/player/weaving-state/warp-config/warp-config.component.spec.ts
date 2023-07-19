import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarpConfigComponent } from './warp-config.component';

describe('WarpConfigComponent', () => {
  let component: WarpConfigComponent;
  let fixture: ComponentFixture<WarpConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WarpConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WarpConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
