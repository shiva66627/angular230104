import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { InsuranceProductService } from './insurance-product';

describe('InsuranceProductService', () => {
  let service: InsuranceProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(InsuranceProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
