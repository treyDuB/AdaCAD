import { async, ComponentFixture, TestBed } from '@angular/core/testing';

<<<<<<<< HEAD:src/app/weaver/modal/shape/shape.modal.spec.ts
import { ShapeModal } from './shape.modal';

describe('PatternModal', () => {
  let component: ShapeModal;
  let fixture: ComponentFixture<ShapeModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShapeModal ]
========
import { OpHelpModal } from './ophelp.modal';

describe('OpHelpModal', () => {
  let ophelpmodal: OpHelpModal;
  let fixture: ComponentFixture<OpHelpModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpHelpModal ]
>>>>>>>> upstream/master:src/app/mixer/modal/ophelp/ophelp.modal.spec.ts
    })
    .compileComponents();
  }));

  beforeEach(() => {
<<<<<<<< HEAD:src/app/weaver/modal/shape/shape.modal.spec.ts
    fixture = TestBed.createComponent(ShapeModal);
========
    fixture = TestBed.createComponent(OpHelpModal);
>>>>>>>> upstream/master:src/app/mixer/modal/ophelp/ophelp.modal.spec.ts
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
