import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectloomComponent } from './connectloom.component';

describe('ConnectloomComponent', () => {
  let component: ConnectloomComponent;
  let fixture: ComponentFixture<ConnectloomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectloomComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectloomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
