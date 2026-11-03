import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../Models/auth/api-response';
import { IUser } from '../Models/User';

@Injectable({
  providedIn: 'root',
})
export class User {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7053/api/User';

  getAll(): Observable<ApiResponse<IUser[]>> {
    return this.http.get<ApiResponse<IUser[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<IUser>> {
    return this.http.get<ApiResponse<IUser>>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: number, statusPayload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}/status`, statusPayload);
  }

  deactivate(id: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  promoteToStaff(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/promote-to-staff`, payload);
  }

  demoteToCustomer(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/demote-to-customer`, payload);
  }
}
