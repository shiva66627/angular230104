import { Component, ChangeDetectorRef, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { timeout } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  errorMessage = '';
  infoMessage = '';
  successMessage = '';
  isLoading = false;
  isResending = false;
  isOtpStep = false;
  isRegistered = false;
  registeredEmail = '';
  countdown = 3;
  resendCooldown = 0;
  showPassword = false;
  showConfirmPassword = false;

  private timer: any;
  private resendTimer: any;

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    mobileNumber: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]]
  }, {
    validators: this.passwordMatchValidator
  });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern('^\\d{6}$')]]
  });

  ngOnInit() {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.registeredEmail = emailParam;
      this.isOtpStep = true;
      this.infoMessage = 'Enter your 6-digit OTP or click Resend OTP to get a new code.';
    }
  }

  onSubmit() {
    if (this.registerForm.invalid || this.isLoading) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';
    this.successMessage = '';

    const payload = {
      fullName: this.registerForm.value.fullName!,
      email: this.registerForm.value.email!,
      password: this.registerForm.value.password!,
      mobileNumber: this.registerForm.value.mobileNumber!
    };

    this.authService.register(payload).pipe(timeout(30000)).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.registeredEmail = res.data || payload.email;
          this.isOtpStep = true;
          this.infoMessage = res.message || 'An OTP has been sent to your email.';
          this.otpForm.reset();
          this.startResendCooldown(60);
        } else {
          this.errorMessage = res.message || 'Registration could not be completed.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err?.name === 'TimeoutError') {
          this.errorMessage = 'Request timed out while sending OTP email. Please try again.';
        } else {
          this.errorMessage = err?.error?.message || 'Registration failed. Please check your details and try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  onVerifyOtp() {
    if (this.otpForm.invalid || this.isLoading) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    const otp = this.otpForm.value.otp!.trim();

    this.authService.verifyOtp({ email: this.registeredEmail, otp }).pipe(timeout(15000)).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.clearResendTimer();
          this.isOtpStep = false;
          this.isRegistered = true;
          this.successMessage = res.message || 'Email verified successfully!';
          this.startCountdown();
        } else {
          this.errorMessage = res.message || 'Invalid email or OTP.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Invalid or expired OTP. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  onResendOtp() {
    if (this.isResending || this.resendCooldown > 0 || !this.registeredEmail) {
      return;
    }

    this.isResending = true;
    this.errorMessage = '';
    this.infoMessage = '';

    this.authService.resendOtp({ email: this.registeredEmail }).pipe(timeout(30000)).subscribe({
      next: (res) => {
        this.isResending = false;
        if (res.success) {
          this.infoMessage = res.message || 'A new OTP has been sent to your email.';
          this.startResendCooldown(60);
        } else {
          this.errorMessage = res.message || 'Unable to resend OTP.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isResending = false;
        this.errorMessage = err?.error?.message || 'Unable to resend OTP. Please try again later.';
        this.cdr.detectChanges();
      }
    });
  }

  backToRegister() {
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

  startCountdown() {
    this.timer = setInterval(() => {
      this.countdown--;
      this.cdr.detectChanges();
      if (this.countdown <= 0) {
        clearInterval(this.timer);
        this.router.navigate(['/login']);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.clearResendTimer();
  }
}
