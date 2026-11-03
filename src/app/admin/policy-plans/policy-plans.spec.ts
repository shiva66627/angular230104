import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyPlans } from './policy-plans';

describe('PolicyPlans', () => {
  let component: PolicyPlans;
  let fixture: ComponentFixture<PolicyPlans>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolicyPlans],
    }).compileComponents();

    fixture = TestBed.createComponent(PolicyPlans);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
