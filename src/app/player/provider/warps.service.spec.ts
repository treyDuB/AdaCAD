import { TestBed } from '@angular/core/testing';

import { WarpsService } from './warps.service';

describe('WarpsService', () => {
  let service: WarpsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WarpsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
