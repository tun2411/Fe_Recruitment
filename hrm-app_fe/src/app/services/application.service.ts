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
  jobId?: number; // Job ID (optional, may not be in old responses)
  jobTitle?: string; // Job title (optional, may not be in old responses)
  cvUrl: string; // Backend trả về cvUrl thay vì cvFilePath, cvFileName, cvFileId
}

export interface UpdateApplicationStatusRequest {
  status: string; // "pass" or "fail"
  note?: string;
  roundIndex: number;
}

export interface ApplicationStatusResponse {
  roundId: number;
  roundIndex: number;
  roundName: string;
  status: 'pass' | 'fail' | null;
  confirmedAt: string | null;
  note: string | null;
  isCurrentRound: boolean;
  isPending: boolean;
}

export interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  // Đảm bảo luôn dùng relative URL cho proxy
  private apiUrl = `${environment.apiUrl}/applications`;

  constructor(private http: HttpClient) {
    // Debug: Log API URL khi service được khởi tạo
    console.log('[ApplicationService] Initialized with apiUrl:', this.apiUrl);
    console.log('[ApplicationService] environment.apiUrl:', environment.apiUrl);
  }

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
   * GET /api/applications/{application_id} - Lấy thông tin chi tiết của một application
   */
  getApplicationById(applicationId: number): Observable<Application> {
    // Debug: Log URL trước khi gửi request
    const url = `${this.apiUrl}/${applicationId}`;
    console.log('[ApplicationService] getApplicationById URL:', url);
    console.log('[ApplicationService] environment.apiUrl:', environment.apiUrl);

    return this.http
      .get<Application>(url)
      .pipe(
        retry(2),
        catchError(this.handleError<Application>('getApplicationById'))
      );
  }

  /**
   * GET /api/applications/job/{job_id}/status/{status} - Lấy danh sách applications theo job ID và status
   */
  getApplicationsByJobIdAndStatus(
    jobId: number,
    status: string
  ): Observable<Application[]> {
    return this.http
      .get<Application[]>(`${this.apiUrl}/job/${jobId}/status/${status}`)
      .pipe(
        retry(2),
        catchError(
          this.handleError<Application[]>('getApplicationsByJobIdAndStatus', [])
        )
      );
  }

  /**
   * POST /api/applications/{application_id}/update-status - Update application status (pass/fail)
   */
  updateApplicationStatus(
    applicationId: number,
    request: UpdateApplicationStatusRequest
  ): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(
        `${this.apiUrl}/${applicationId}/update-status`,
        request
      )
      .pipe(
        retry(1),
        catchError(this.handleError<MessageResponse>('updateApplicationStatus'))
      );
  }

  /**
   * GET /api/applications/{application_id}/status - Lấy lịch sử trạng thái application (tất cả các rounds)
   */
  getApplicationStatusHistory(
    applicationId: number
  ): Observable<ApplicationStatusResponse[]> {
    return this.http
      .get<ApplicationStatusResponse[]>(
        `${this.apiUrl}/${applicationId}/status`
      )
      .pipe(
        retry(2),
        catchError(
          this.handleError<ApplicationStatusResponse[]>(
            'getApplicationStatusHistory',
            []
          )
        )
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
