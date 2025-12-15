import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface BusinessResponse {
  id: number;
  companyName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  emailVerified: boolean;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

export interface UpdateBusinessRequest {
  companyName: string;
  phone?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BusinessService {
  private apiUrl = `${environment.apiUrl}/business`;

  constructor(private http: HttpClient) {
    console.log('[BusinessService] Initialized with apiUrl:', this.apiUrl);
  }

  /**
   * GET /api/business/me - Lấy thông tin business hiện tại
   */
  getCurrentBusiness(): Observable<BusinessResponse> {
    return this.http
      .get<BusinessResponse>(`${this.apiUrl}/me`)
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT /api/business/me - Cập nhật thông tin business
   */
  updateBusiness(
    request: UpdateBusinessRequest
  ): Observable<BusinessResponse> {
    return this.http
      .put<BusinessResponse>(`${this.apiUrl}/me`, request)
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Đã xảy ra lỗi không xác định';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Lỗi: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 404) {
        errorMessage = 'Không tìm thấy thông tin business';
      } else if (error.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ';
      } else if (error.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn';
      } else if (error.status === 403) {
        errorMessage = 'Không có quyền truy cập';
      } else {
        errorMessage = `Lỗi server: ${error.status} ${error.statusText}`;
      }
    }
    
    console.error('[BusinessService] Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  };
}

