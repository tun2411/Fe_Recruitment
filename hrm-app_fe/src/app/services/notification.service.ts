import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SSEService } from './sse.service';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'new_application' | 'pass' | 'fail' | 'system';
  isRead: boolean;
  createdAt: string;
  applicationId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private sseUrl = `${environment.apiUrl}/notifications/stream`;

  constructor(
    private http: HttpClient,
    private sseService: SSEService
  ) {}

  /**
   * GET /api/notifications - Lấy danh sách notifications
   */
  getNotifications(): Observable<Notification[]> {
    return this.http
      .get<Notification[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError<Notification[]>('getNotifications', []))
      );
  }

  /**
   * PUT /api/notifications/{id}/read - Đánh dấu notification là đã đọc
   */
  markAsRead(notificationId: number): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/${notificationId}/read`, {})
      .pipe(catchError(this.handleError<void>('markAsRead')));
  }

  /**
   * Kết nối đến SSE stream để nhận notifications real-time
   * @param token JWT token để authenticate
   */
  connectSSE(token: string): void {
    this.sseService.connect(this.sseUrl, token);
  }

  /**
   * Đóng kết nối SSE
   */
  disconnectSSE(): void {
    this.sseService.disconnect();
  }

  /**
   * Observable để lắng nghe notifications từ SSE
   */
  getSSENotifications(): Observable<Notification> {
    return this.sseService.notifications$;
  }

  /**
   * Observable để lắng nghe trạng thái kết nối SSE
   */
  getSSEConnectionStatus(): Observable<boolean> {
    return this.sseService.connectionStatus$;
  }

  /**
   * Error Handler
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);

      let errorMessage = 'Có lỗi xảy ra';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Lỗi: ${error.error.message}`;
      } else {
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

      if (result !== undefined) {
        return of(result);
      } else {
        return throwError(() => new Error(errorMessage));
      }
    };
  }
}
