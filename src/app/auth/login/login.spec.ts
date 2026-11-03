import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';

import { Login } from './login';
import { AuthService } from '../../services/auth';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // 1. Form Validation test: Invalid email format
  it('should mark email control as invalid if format is incorrect', () => {
    const emailControl = component.loginForm.controls.email;

    emailControl.setValue('invalid-email-format');
    expect(emailControl.invalid).toBe(true);
    expect(emailControl.errors?.['email']).toBe(true);
  });

  // 2. Business logic test: Does not send request when email is invalid
  it('should not call authService.login when submitting with an invalid email', () => {
    const authService = TestBed.inject(AuthService);
    const loginSpy = vi.spyOn(authService, 'login');

    component.loginForm.setValue({
      email: 'bad-email',
      password: 'password123'
    });

    component.onSubmit();

    expect(component.loginForm.invalid).toBe(true);
    expect(loginSpy).not.toHaveBeenCalled();
  });

  // 3. UI Template test: Shows the error message on screen
  it('should display "Enter a valid email address" when email is invalid and touched', () => {
    const emailControl = component.loginForm.controls.email;
    emailControl.setValue('bad-email');
    emailControl.markAsTouched();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorMessage = compiled.querySelector('.text-danger')?.textContent?.trim();

    expect(errorMessage).toContain('Enter a valid email address');
  });

  // 4. Button State: Disabled when form is empty or invalid
  it('should have the login button disabled when form is empty or invalid', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(component.loginForm.invalid).toBe(true);
    expect(button.disabled).toBe(true);
  });

  // 5. Button State: Enabled when email and password are valid
  it('should enable login button when email and password are valid', () => {
    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'validPassword123'
    });

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(component.loginForm.valid).toBe(true);
    expect(button.disabled).toBe(false);
  });

  // 6. Button Click: Triggers submit, calls authService.login, and navigates
  it('should call authService.login and navigate when the enabled login button is clicked', () => {
    const authService = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const loginSpy = vi.spyOn(authService, 'login').mockReturnValue(of({
      data: {
        role: 'Customer',
        token: 'mock-token',
        email: 'user@example.com',
        fullName: 'Test User',
        userId: 1
      },
      message: 'Success',
      success: true
    } as any));

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'validPassword123'
    });

    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    button.click();

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'validPassword123'
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/customer/dashboard']);
  });
});
