import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { Customer } from './customer';

describe('Customer', () => {
  let service: Customer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(Customer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
