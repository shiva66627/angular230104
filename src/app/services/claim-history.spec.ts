import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ClaimHistoryService } from './claim-history';

describe('ClaimHistoryService', () => {
  let service: ClaimHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(ClaimHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
