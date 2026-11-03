import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PremiumPayments } from './premium-payments';

describe('PremiumPayments', () => {
  let component: PremiumPayments;
  let fixture: ComponentFixture<PremiumPayments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumPayments],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PremiumPayments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
