import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../Models/auth/api-response';

@Injectable({ providedIn: 'root' })
export class ClaimDocumentService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7053/api/ClaimDocument';

  getAll(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.apiUrl);
  }

  getByClaim(claimId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${claimId}`);
  }

  upload(payload: any): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(this.apiUrl, payload);
  }
}
