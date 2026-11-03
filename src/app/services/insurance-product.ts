import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from '../Models/auth/api-response';
import { IInsuranceProduct } from '../Models/InsuranceProduct';

@Injectable({
  providedIn: 'root'
})
export class InsuranceProductService {

  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7053/api/InsuranceProduct';

  getAll(): Observable<ApiResponse<IInsuranceProduct[]>> {
    return this.http.get<ApiResponse<IInsuranceProduct[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<IInsuranceProduct>> {
    return this.http.get<ApiResponse<IInsuranceProduct>>(`${this.apiUrl}/${id}`);
  }

  create(product: IInsuranceProduct): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, product);
  }

  update(id: number, product: IInsuranceProduct): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, product);
  }

  deactivate(id: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/${id}/deactivate`,
      {}
    );
  }

  activate(id: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/${id}/activate`,
      {}
    );
  }
}