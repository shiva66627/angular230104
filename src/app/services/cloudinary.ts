import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
  original_filename: string;
}

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private http = inject(HttpClient);

  // User's Cloudinary credentials
  readonly cloudName = 'biobjapd';
  readonly uploadPreset = 'ml_default';

  upload(file: File): Observable<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    // Use 'auto/upload' to support PDFs, images (PNG/JPG), and documents
    const endpoint = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;
    return this.http.post<CloudinaryUploadResponse>(endpoint, formData);
  }
}

