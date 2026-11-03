import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { User } from './user';

describe('User', () => {
  let service: User;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(User);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
