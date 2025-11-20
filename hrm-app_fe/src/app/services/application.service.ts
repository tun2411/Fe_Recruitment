import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Định nghĩa Interface cho Application theo API response (CandidateApplicationResponse từ backend)
export interface Application {
  applicationId: number;
  status: string; // NEW, IN_PROCESS, PASS, FAIL
  currentRoundIndex: number;
  submittedAt: string;
  updatedAt: string;
  candidateId: number;
  candidateEmail: string;
  candidateFullName: string;
  candidatePhone: string;
  cvUrl: string; // Backend trả về cvUrl thay vì cvFilePath, cvFileName, cvFileId
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private apiUrl = `${environment.apiUrl}/applications`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/applications/job/{job_id} - Lấy danh sách applications theo job ID
   */
  getApplicationsByJobId(jobId: number): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}/job/${jobId}`).pipe(
      retry(2), // Retry 2 lần nếu lỗi
      catchError(this.handleError<Application[]>('getApplicationsByJobId', []))
    );
  }

  /**
   * Error Handler - Xử lý lỗi chung cho tất cả requests
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);

      // Xử lý các loại lỗi khác nhau
      let errorMessage = 'Có lỗi xảy ra';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Lỗi: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Không thể kết nối đến server';
            break;
          case 400:
            errorMessage = error.error?.message || 'Dữ liệu không hợp lệ';
            break;
          case 401:
            errorMessage = 'Không có quyền truy cập';
            break;
          case 403:
            errorMessage = 'Bạn không có quyền thực hiện thao tác này';
            break;
          case 404:
            errorMessage = 'Không tìm thấy dữ liệu';
            break;
          case 500:
            errorMessage = 'Lỗi server, vui lòng thử lại sau';
            break;
          default:
            errorMessage =
              error.error?.message ||
              `Lỗi ${error.status}: ${error.statusText}`;
        }
      }

      // Trả về giá trị mặc định hoặc throw error
      if (result !== undefined) {
        return of(result);
      } else {
        return throwError(() => new Error(errorMessage));
      }
    };
  }
}

