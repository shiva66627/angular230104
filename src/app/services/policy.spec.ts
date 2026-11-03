import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { PolicyService } from './policy';

describe('PolicyService', () => {
  let service: PolicyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(PolicyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
