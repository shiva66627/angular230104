import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { StaffDashboard } from './staff-dashboard';

describe('StaffDashboard', () => {
  let component: StaffDashboard;
  let fixture: ComponentFixture<StaffDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffDashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StaffDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
