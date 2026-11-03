import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../Models/auth/api-response';
import { ICustomer } from '../Models/Customer';

@Injectable({
  providedIn: 'root',
})
export class Customer {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7053/api/Customer';

  getAll(): Observable<ApiResponse<ICustomer[]>> {
    return this.http.get<ApiResponse<ICustomer[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<ICustomer>> {
    return this.http.get<ApiResponse<ICustomer>>(`${this.apiUrl}/${id}`);
  }

  getByUserId(userId: number): Observable<ApiResponse<ICustomer>> {
    return this.http.get<ApiResponse<ICustomer>>(`${this.apiUrl}/user/${userId}`);
  }

  create(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, payload);
  }

  update(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
