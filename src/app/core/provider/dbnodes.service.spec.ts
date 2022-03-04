import { TestBed } from '@angular/core/testing';

import { DbnodesService } from './dbnodes.service';

describe('DbnodesService', () => {
  let service: DbnodesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DbnodesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
