import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChainOpMenuComponent } from './menu-chain.component';

describe('ChainOpComponent', () => {
  let component: ChainOpMenuComponent;
  let fixture: ComponentFixture<ChainOpMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChainOpMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChainOpMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
