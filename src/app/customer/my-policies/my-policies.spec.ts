import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MyPolicies } from './my-policies';

describe('MyPolicies', () => {
  let component: MyPolicies;
  let fixture: ComponentFixture<MyPolicies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPolicies],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyPolicies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
