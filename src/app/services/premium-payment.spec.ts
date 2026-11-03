import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { PremiumPaymentService } from './premium-payment';

describe('PremiumPaymentService', () => {
  let service: PremiumPaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(PremiumPaymentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
