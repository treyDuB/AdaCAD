import { TestBed } from '@angular/core/testing';

import { DraftplayerService } from './draftplayer.service';

describe('DraftplayerService', () => {
  let service: DraftplayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DraftplayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
