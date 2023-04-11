import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChainOpComponent } from './chain-op.component';

describe('ChainOpComponent', () => {
  let component: ChainOpComponent;
  let fixture: ComponentFixture<ChainOpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChainOpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChainOpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
