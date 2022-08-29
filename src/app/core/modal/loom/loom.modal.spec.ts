import { async, ComponentFixture, TestBed } from '@angular/core/testing';

<<<<<<<< HEAD:src/app/weaver/modal/selvedge/selvedge.modal.spec.ts
import { SelvedgeModal } from './selvedge.modal';

describe('SelvedgeModal', () => {
  let component: SelvedgeModal;
  let fixture: ComponentFixture<SelvedgeModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelvedgeModal ]
========
import { LoomModal } from './loom.modal';

describe('LoomModal', () => {
  let component: LoomModal;
  let fixture: ComponentFixture<LoomModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoomModal ]
>>>>>>>> upstream/master:src/app/core/modal/loom/loom.modal.spec.ts
    })
    .compileComponents();
  }));

  beforeEach(() => {
<<<<<<<< HEAD:src/app/weaver/modal/selvedge/selvedge.modal.spec.ts
    fixture = TestBed.createComponent(SelvedgeModal);
========
    fixture = TestBed.createComponent(LoomModal);
>>>>>>>> upstream/master:src/app/core/modal/loom/loom.modal.spec.ts
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
