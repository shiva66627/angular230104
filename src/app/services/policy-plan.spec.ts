import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { PolicyPlanService } from './policy-plan';

describe('PolicyPlanService', () => {
  let service: PolicyPlanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(PolicyPlanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
