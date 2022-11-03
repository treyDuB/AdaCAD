import { TestBed } from '@angular/core/testing';

import { PedalsService } from './pedals.service';

describe('PedalsService', () => {
  let service: PedalsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PedalsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
