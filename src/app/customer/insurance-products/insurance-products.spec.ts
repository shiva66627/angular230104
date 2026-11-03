import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsuranceProducts } from './insurance-products';

describe('InsuranceProducts', () => {
  let component: InsuranceProducts;
  let fixture: ComponentFixture<InsuranceProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsuranceProducts],
    }).compileComponents();

    fixture = TestBed.createComponent(InsuranceProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
