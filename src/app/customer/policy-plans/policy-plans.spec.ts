import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PolicyPlans } from './policy-plans';

describe('PolicyPlans', () => {
  let component: PolicyPlans;
  let fixture: ComponentFixture<PolicyPlans>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolicyPlans],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PolicyPlans);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
