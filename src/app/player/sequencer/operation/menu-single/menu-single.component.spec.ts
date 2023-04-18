import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleOpMenuComponent } from './menu-single.component';

describe('SingleMenuComponent', () => {
  let component: SingleOpMenuComponent;
  let fixture: ComponentFixture<SingleOpMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SingleOpMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleOpMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
