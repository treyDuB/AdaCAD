import { TestBed } from '@angular/core/testing';

import { SendpickService } from './sendpick.service';

describe('SendpickService', () => {
  let service: SendpickService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SendpickService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
