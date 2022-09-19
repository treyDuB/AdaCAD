import { TestBed } from '@angular/core/testing';

import { DraftPlayerService } from './draftplayer.service';

describe('DraftplayerService', () => {
  let service: DraftPlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DraftPlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
