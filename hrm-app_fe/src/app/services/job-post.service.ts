import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Định nghĩa Interface cho JobPost theo API response
export interface JobPost {
  id: number;
  employerId: number;
  employerCompanyName: string;
  formId: number;
  formName: string;
  title: string;
  description: string;
  location: string;
  salaryRange: string;
  roundCount: number;
  status: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class JobPostService {
  private apiUrl = `${environment.apiUrl}/job-posts`;

  constructor(private http: HttpClient) {}

  getJobPosts(status?: string): Observable<JobPost[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<JobPost[]>(this.apiUrl, { params }).pipe(
      retry(2), // Retry 2 lần nếu lỗi
      catchError(this.handleError<JobPost[]>('getJobPosts', []))
    );
  }

  getJobPostById(id: number): Observable<JobPost> {
    return this.http.get<JobPost>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<JobPost>(`getJobPostById id=${id}`))
    );
  }

  updateJobPost(id: number, jobPost: Partial<JobPost>): Observable<JobPost> {
    return this.http.put<JobPost>(`${this.apiUrl}/${id}`, jobPost).pipe(
      catchError(this.handleError<JobPost>(`updateJobPost id=${id}`))
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

