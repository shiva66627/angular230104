import { Component, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { timeout } from 'rxjs';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnDestroy {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  errorMessage = '';
  infoMessage = '';
  isLoading = false;
  isResending = false;
  needsEmailVerification = false;
  isOtpStep = false;
  resendCooldown = 0;
  showPassword = false;
  private resendTimer: any;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern('^\\d{6}$')]]
  });

  onSubmit() {
    if (this.loginForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';
    this.needsEmailVerification = false;

    const { email, password } = this.loginForm.value;

    const loginRequest = {
      email: email!,
      password: password!
    };

    this.authService.login(loginRequest).pipe(timeout(15000)).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.handleLogin(response, email!);
      },
      error: (err) => {
        this.isLoading = false;
        const msg: string = err?.error?.message || '';
        if (err?.name === 'TimeoutError') {
          this.errorMessage = 'Server took too long to respond. Check if Visual Studio is paused on a breakpoint.';
        } else if (err?.status === 0) {
          this.errorMessage = 'Cannot connect to server (https://localhost:7053). Ensure the backend is running.';
        } else {
          this.errorMessage = msg || 'Invalid Email or Password';
          if (msg.toLowerCase().includes('verify your email')) {
            this.needsEmailVerification = true;
          }
        }
        this.cdr.detectChanges();
      }
    });
  }

  openOtpVerification() {
    const email = this.loginForm.value.email?.trim() || '';
    if (!email || this.loginForm.controls.email.invalid) {
      this.loginForm.controls.email.markAsTouched();
      this.errorMessage = 'Please enter a valid email address first.';
      this.cdr.detectChanges();
      return;
    }

    this.isOtpStep = true;
    this.needsEmailVerification = false;
    this.errorMessage = '';
    this.infoMessage = '';
    this.otpForm.reset();
    this.cdr.detectChanges();
    this.onResendOtp();
  }

  onVerifyOtp() {
    if (this.otpForm.invalid || this.isLoading) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.value.email!.trim();
    const otp = this.otpForm.value.otp!.trim();

    this.isLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.authService.verifyOtp({ email, otp }).pipe(timeout(15000)).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.clearResendTimer();
          this.isOtpStep = false;
          this.infoMessage = 'Email verified! Signing you in...';
          this.cdr.detectChanges();
          if (this.loginForm.valid) {
            this.onSubmit();
          }
        } else {
          this.errorMessage = res.message || 'Invalid email or OTP.';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Invalid or expired OTP. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  onResendOtp() {
    const email = this.loginForm.value.email?.trim() || '';
    if (this.isResending || this.resendCooldown > 0 || !email) {
      return;
    }

    this.isResending = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.authService.resendOtp({ email }).pipe(timeout(30000)).subscribe({
      next: (res) => {
        this.isResending = false;
        if (res.success) {
          this.infoMessage = res.message || 'A 6-digit OTP has been sent to your email.';
          this.startResendCooldown(60);
        } else {
          this.errorMessage = res.message || 'Unable to send OTP.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isResending = false;
        this.errorMessage = err?.error?.message || 'Unable to resend OTP. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  backToLogin() {
    this.clearResendTimer();
    this.isOtpStep = false;
    this.errorMessage = '';
    this.infoMessage = '';
    this.otpForm.reset();
    this.cdr.detectChanges();
  }

  private startResendCooldown(seconds: number) {
    this.clearResendTimer();
    this.resendCooldown = seconds;
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        this.clearResendTimer();
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  private clearResendTimer() {
    this.resendCooldown = 0;
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }

  ngOnDestroy() {
    this.clearResendTimer();
  }

  private decodeJwtPayload(token: string): Record<string, any> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  handleLogin(response: any, fallbackEmail = '') {
    const data = response?.data ?? {};
    const token: string = data.token ?? '';
    const jwtPayload = token ? this.decodeJwtPayload(token) : null;

    const rawRole =
      data.role ||
      jwtPayload?.['role'] ||
      jwtPayload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      '';
    const role: string = Array.isArray(rawRole) ? rawRole[0] : rawRole;

    const email: string =
      data.email ||
      jwtPayload?.['email'] ||
      jwtPayload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
      fallbackEmail;

    const fullName: string =
      data.fullName ||
      jwtPayload?.['unique_name'] ||
      jwtPayload?.['name'] ||
      jwtPayload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      email;

    const userId =
      data.userId ??
      jwtPayload?.['nameid'] ??
      jwtPayload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
      jwtPayload?.['sub'] ??
      '';

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('email', email);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('username', fullName);
      if (userId !== '') {
        localStorage.setItem('userId', userId.toString());
      }
    }

    switch (role) {
      case 'Admin':
        this.router.navigate(['/admin/dashboard']);
        break;

      case 'Staff':
        this.router.navigate(['/staff/dashboard']);
        break;

      case 'Customer':
        this.router.navigate(['/customer/dashboard']);
        break;

      default:
        this.errorMessage = 'Unable to determine account role.';
        this.cdr.detectChanges();
        break;
    }
  }

}