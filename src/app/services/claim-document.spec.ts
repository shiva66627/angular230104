import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ClaimDocumentService } from './claim-document';

describe('ClaimDocumentService', () => {
  let service: ClaimDocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(ClaimDocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
