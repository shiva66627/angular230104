import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Customer } from '../../services/customer';
import { AuthService } from '../../services/auth';

export function minAge18Validator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const inputDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);

  if (inputDate > today) {
    return { futureDate: true };
  }

  const min18Date = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  if (inputDate > min18Date) {
    return { underAge: true };
  }

  return null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private customerService = inject(Customer);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  todayDate = new Date().toISOString().split('T')[0];
  maxDobDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  profileForm = this.fb.group({
    dateOfBirth: ['', [Validators.required, minAge18Validator]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    city: ['', Validators.required],
    address: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    nomineeName: ['', [Validators.required, Validators.minLength(10)]],
    nomineeRelation: ['', Validators.required]
  });

  userId: number = 0;
  customerId: number | null = null;
  customerName: string = '';
  customerEmail: string = '';
  message = '';
  isSuccess = false;
  isExisting = false;
  isLoading = false;
  photoUrl: string | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.customerName = localStorage.getItem('fullName') || '';
      this.customerEmail = localStorage.getItem('email') || '';
      this.userId = this.authService.getUserId();
      if (this.userId) {
        this.loadProfile();
      }
    }
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoUrl = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.photoUrl = null;
    this.cdr.detectChanges();
  }

  private extractErrorMessage(err: any): string {
    if (!err) return 'An unexpected error occurred.';
    if (err.status === 401) return 'Session expired. Please log in again.';
    if (err.status === 403) return 'You are not authorized to perform this action.';
    if (err.error?.errors && typeof err.error.errors === 'object') {
      const messages: string[] = [];
      for (const key of Object.keys(err.error.errors)) {
        const val = err.error.errors[key];
        if (Array.isArray(val)) {
          messages.push(...val);
        } else if (typeof val === 'string') {
          messages.push(val);
        }
      }
      if (messages.length > 0) return messages.join(' | ');
    }
    return err.error?.message || err.error?.Message || err.message || 'Operation failed. Please verify your details.';
  }

  loadProfile() {
    if (!this.userId) {
      this.userId = this.authService.getUserId();
    }
    if (!this.userId) return;

    if (isPlatformBrowser(this.platformId)) {
      const savedPhoto = localStorage.getItem(`profilePhoto_${this.userId}`);
      if (savedPhoto) {
        this.photoUrl = savedPhoto;
      }
    }

    this.customerService.getByUserId(this.userId).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.isExisting = true;
          this.customerId = res.data.customerId;
          if (res.data.fullName) {
            this.customerName = res.data.fullName;
          }
          if (res.data.email) {
            this.customerEmail = res.data.email;
          }

          let dobFormatted = '';
          if (res.data.dateOfBirth) {
            dobFormatted = String(res.data.dateOfBirth).split('T')[0];
          }

          this.profileForm.patchValue({
            dateOfBirth: dobFormatted,
            mobileNumber: res.data.mobileNumber || '',
            city: res.data.city || '',
            address: res.data.address || '',
            state: res.data.state || '',
            pincode: res.data.pincode || '',
            nomineeName: res.data.nomineeName || '',
            nomineeRelation: res.data.nomineeRelation || ''
          });
          this.cdr.detectChanges();
        }
      },
      error: (e) => {
        if (e.status === 404) {
          this.isExisting = false;
          this.customerId = null;
        } else if (e.status === 401) {
          this.message = 'Session expired. Please log in again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {
    if (this.profileForm.invalid || this.isLoading) {
      this.profileForm.markAllAsTouched();
      return;
    }

    if (!this.userId) {
      this.userId = this.authService.getUserId();
    }

    if (!this.userId) {
      this.message = 'User ID not found. Please log in again.';
      this.isSuccess = false;
      return;
    }

    this.isLoading = true;
    this.message = '';

    const payload = {
      userId: this.userId,
      dateOfBirth: this.profileForm.value.dateOfBirth,
      city: this.profileForm.value.city,
      address: this.profileForm.value.address,
      state: this.profileForm.value.state,
      pincode: this.profileForm.value.pincode,
      nomineeName: this.profileForm.value.nomineeName,
      nomineeRelation: this.profileForm.value.nomineeRelation
    };

    const savePhoto = () => {
      if (isPlatformBrowser(this.platformId)) {
        if (this.photoUrl) {
          localStorage.setItem(`profilePhoto_${this.userId}`, this.photoUrl);
        } else {
          localStorage.removeItem(`profilePhoto_${this.userId}`);
        }
      }
    };

    const doUpdate = (custId: number) => {
      this.customerService.update(custId, payload).subscribe({
        next: () => {
          this.isLoading = false;
          savePhoto();
          this.isExisting = true;
          this.customerId = custId;
          this.message = 'Profile updated successfully!';
          this.isSuccess = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.message = this.extractErrorMessage(err);
          this.isSuccess = false;
          this.cdr.detectChanges();
        }
      });
    };

    const doCreate = () => {
      this.customerService.create(payload).subscribe({
        next: () => {
          this.isLoading = false;
          savePhoto();
          this.message = 'Profile created successfully!';
          this.isSuccess = true;
          this.isExisting = true;
          this.loadProfile();
          this.cdr.detectChanges();
        },
        error: (err) => {
          // If creation fails because profile already exists (unique constraint violation), try updating instead
          this.customerService.getByUserId(this.userId).subscribe({
            next: (checkRes) => {
              if (checkRes.data?.customerId) {
                this.customerId = checkRes.data.customerId;
                this.isExisting = true;
                doUpdate(checkRes.data.customerId);
              } else {
                this.isLoading = false;
                this.message = this.extractErrorMessage(err);
                this.isSuccess = false;
                this.cdr.detectChanges();
              }
            },
            error: () => {
              this.isLoading = false;
              this.message = this.extractErrorMessage(err);
              this.isSuccess = false;
              this.cdr.detectChanges();
            }
          });
        }
      });
    };

    if (this.customerId) {
      doUpdate(this.customerId);
    } else {
      // First check if profile already exists in DB for this user
      this.customerService.getByUserId(this.userId).subscribe({
        next: (res) => {
          if (res.data?.customerId) {
            this.customerId = res.data.customerId;
            this.isExisting = true;
            doUpdate(res.data.customerId);
          } else {
            doCreate();
          }
        },
        error: () => {
          doCreate();
        }
      });
    }
  }
}
