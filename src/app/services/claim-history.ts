import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../Models/auth/api-response';

@Injectable({ providedIn: 'root' })
export class ClaimHistoryService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7053/api/ClaimHistory';

  getAll(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.apiUrl);
  }
  getByClaim(claimId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/claim/${claimId}`);
  }
}
