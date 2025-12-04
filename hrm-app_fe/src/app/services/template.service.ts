import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// DTOs theo backend
export interface TemplateResponse {
  formId: number;
  formName: string;
  roundId: number | null;
  roundName: string | null;
  type: 'apply_confirm' | 'pass' | 'fail';
  emailTemplateId: number | null;
  subject: string | null;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateListResponse {
  templates: TemplateResponse[];
  total: number;
}

export interface CreateTemplateRequest {
  // formId optional: dùng cho trường hợp cập nhật template existing (PUT)
  formId?: number;
  formName: string;
  type: 'apply_confirm' | 'pass' | 'fail';
  roundId: number | null;
  subject: string;
  content: string;
}

export interface UpdateFormRequest {
  formName?: string;
  type?: 'apply_confirm' | 'pass' | 'fail';
  roundId?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  private apiUrl = `${environment.apiUrl}/templates`;
  private formsApiUrl = `${environment.apiUrl}/forms`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/templates - Lấy templates với filter theo type và round_id
   * @param type Filter theo type: pass, fail, apply_confirm (optional)
   * @param roundId Filter theo round_id (optional) - null để lấy templates chung
   * @returns Observable<TemplateListResponse>
   */
  getTemplates(
    type?: 'pass' | 'fail' | 'apply_confirm',
    roundId?: number | null
  ): Observable<TemplateListResponse> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    if (roundId !== undefined && roundId !== null) {
      params = params.set('round_id', roundId.toString());
    }

    return this.http
      .get<TemplateListResponse>(this.apiUrl, { params })
      .pipe(
        retry(2),
        catchError(this.handleError<TemplateListResponse>('getTemplates'))
      );
  }

  /**
   * POST /api/templates - Tạo template mới (Form + EmailTemplate)
   * @param request CreateTemplateRequest
   * @returns Observable<TemplateResponse>
   */
  createTemplate(
    request: CreateTemplateRequest
  ): Observable<TemplateResponse> {
    return this.http
      .post<TemplateResponse>(this.apiUrl, request)
      .pipe(
        catchError(this.handleError<TemplateResponse>('createTemplate'))
      );
  }

  /**
   * PUT /api/templates - Cập nhật template hiện có (Form + EmailTemplate)
   * Backend sử dụng CreateTemplateRequest (kèm formId) để update
   * @param request CreateTemplateRequest (bao gồm formId của template cần cập nhật)
   * @returns Observable<TemplateResponse>
   */
  updateTemplate(
    request: CreateTemplateRequest
  ): Observable<TemplateResponse> {
    return this.http
      .put<TemplateResponse>(this.apiUrl, request)
      .pipe(
        catchError(this.handleError<TemplateResponse>('updateTemplate'))
      );
  }

  /**
   * PUT /api/forms/{form_id} - Attach template existing cho round
   * @param formId ID của form
   * @param request UpdateFormRequest (chỉ cần roundId)
   * @returns Observable<any>
   */
  updateForm(
    formId: number,
    request: UpdateFormRequest
  ): Observable<any> {
    return this.http
      .put<any>(`${this.formsApiUrl}/${formId}`, request)
      .pipe(
        catchError(this.handleError<any>(`updateForm formId=${formId}`))
      );
  }

  /**
   * Error Handler - Xử lý lỗi chung cho tất cả requests
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
        return of(result as T);
      } else {
        // Giữ lại thông tin HTTP từ HttpErrorResponse gốc
        // Tạo error object mới với message tùy chỉnh nhưng giữ lại các thuộc tính HTTP
        const customError: any = new Error(errorMessage);
        customError.status = error.status;
        customError.statusText = error.statusText;
        customError.url = error.url;
        customError.error = error.error;
        return throwError(() => customError);
      }
    };
  }
}

