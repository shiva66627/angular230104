import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { LoginRequest } from '../Models/auth/login-request';
import { LoginResponse } from '../Models/auth/login-response';
import { RegisterRequest } from '../Models/auth/register-request';
import { RegisterResponse } from '../Models/auth/register-response';
import { VerifyOtpRequest, ResendOtpRequest, OtpResponse } from '../Models/auth/otp';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7053/api/Auth';

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      data
    );
  }


  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${this.apiUrl}/register`,
      data
    );
  }

  verifyOtp(data: VerifyOtpRequest): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(
      `${this.apiUrl}/verify-otp`,
      data
    );
  }

  resendOtp(data: ResendOtpRequest): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(
      `${this.apiUrl}/resend-otp`,
      data
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/forgot-password`,
      { email }
    );
  }

  resetPassword(data: { email: string; otp: string; newPassword: string }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/reset-password`,
      data
    );
  }

  logout(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  getRole(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('role');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserId(): number {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const storedId = localStorage.getItem('userId');
      if (storedId && !isNaN(Number(storedId)) && Number(storedId) > 0) {
        return Number(storedId);
      }
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const id = payload['nameid'] || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload['sub'];
            if (id && !isNaN(Number(id))) {
              localStorage.setItem('userId', id.toString());
              return Number(id);
            }
          }
        } catch {}
      }
    }
    return 0;
  }
}