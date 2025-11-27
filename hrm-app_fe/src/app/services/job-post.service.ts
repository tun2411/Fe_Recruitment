import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, map, expand, reduce } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Định nghĩa Interface theo DTO backend
export interface JobRoundDTO {
  roundIndex: number; // Backend yêu cầu Integer, bắt đầu từ 0
  roundName: string;
  isConfirmed?: boolean; // Backend sử dụng Boolean (default: false)
}

export interface JobListItemDTO {
  id: number;
  title: string;
  status: string;
  roundCount: number;
}

export interface JobListResponse {
  jobs: JobListItemDTO[];
  total: number;
}

export interface JobResponse {
  id: number;
  title: string;
  description: string;
  location: string;
  salaryFrom?: number; // Backend trả về salaryFrom và salaryTo thay vì salaryRange
  salaryTo?: number;
  workTime?: string;
  yoe?: number;
  unit?: string;
  roundCount: number;
  status: string;
  deadline?: string; // LocalDateTime format từ backend
  publishedAt: string;
  applyUrl?: string;
  createdAt: string;
  updatedAt: string;
  rounds: JobRoundDTO[];
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location?: string;
  salaryFrom?: number; // Backend yêu cầu salaryFrom và salaryTo thay vì salaryRange
  salaryTo?: number;
  workTime?: string;
  yoe?: number;
  unit?: string;
  roundCount: number; // Số vòng tuyển dụng (required theo backend DTO)
  status?: string;
  deadline?: string; // LocalDateTime format: yyyy-MM-ddTHH:mm:ss
  // Note: rounds không cần trong CreateJobRequest vì rounds được tạo riêng sau (POST /api/jobs/{job_id}/rounds)
}

export interface CreateJobResponse {
  jobId: number;
  roundCount: number;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  location?: string;
  salaryFrom?: number; // Backend yêu cầu salaryFrom và salaryTo thay vì salaryRange
  salaryTo?: number;
  workTime?: string;
  yoe?: number;
  unit?: string;
  rounds?: JobRoundDTO[];
  status?: string;
  deadline?: string; // LocalDateTime format: yyyy-MM-ddTHH:mm:ss
}

export interface MessageResponse {
  message: string;
}

// Interface cho CompleteJobRequest (tạo job + rounds + templates trong một transaction)
export interface TemplateDTO {
  templateId?: number; // Nếu có, sẽ attach template existing
  formName?: string; // Nếu tạo mới
  type?: 'pass' | 'fail' | 'apply_confirm';
  subject?: string; // Nếu tạo mới
  content?: string; // Nếu tạo mới
  createNew?: boolean; // Nếu true, sẽ tạo template mới (copy) thay vì attach existing
}

export interface RoundWithTemplatesDTO {
  roundIndex: number;
  roundName: string;
  isConfirmed?: boolean;
  passTemplate?: TemplateDTO;
  failTemplate?: TemplateDTO;
}

export interface CompleteJobRequest {
  title: string;
  description: string;
  location?: string;
  salaryFrom?: number;
  salaryTo?: number;
  workTime?: string;
  yoe?: number;
  unit?: string;
  roundCount: number;
  deadline?: string;
  status?: string; // 'active' hoặc 'inactive'
  rounds: RoundWithTemplatesDTO[];
}

// Interface cũ để backward compatibility với các component hiện tại
export interface JobPost {
  id: number;
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
  private apiUrl = `${environment.apiUrl}/jobs`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/jobs - Lấy danh sách job với pagination và filter status
   * @param status Filter theo status (optional)
   * @param page Số trang (bắt đầu từ 1, default: 1)
   * @param limit Số lượng items mỗi trang (default: 10)
   * @returns Observable<JobListResponse>
   */
  getJobPosts(
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Observable<JobListResponse> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());

    return this.http.get<JobListResponse>(this.apiUrl, { params }).pipe(
      retry(2), // Retry 2 lần nếu lỗi
      map((response: JobListResponse) => {
        // Debug log để kiểm tra response
        console.log(`[getJobPosts] Response for page ${page}:`, {
          jobsCount: response?.jobs?.length || 0,
          total: response?.total || 0,
          jobs: response?.jobs || [],
        });
        return response;
      }),
      catchError(this.handleError<JobListResponse>('getJobPosts'))
    );
  }

  /**
   * GET /api/jobs/{job_id} - Lấy chi tiết job bao gồm rounds
   * @param id ID của job
   * @returns Observable<JobResponse>
   */
  getJobPostById(id: number): Observable<JobResponse> {
    // Backend sử dụng path variable {job_id}, nhưng Spring sẽ map id thành job_id
    return this.http
      .get<JobResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<JobResponse>(`getJobPostById id=${id}`))
      );
  }

  /**
   * POST /api/jobs - Tạo job mới với rounds tùy chỉnh
   * @param request CreateJobRequest
   * @returns Observable<CreateJobResponse>
   */
  createJob(request: CreateJobRequest): Observable<CreateJobResponse> {
    return this.http
      .post<CreateJobResponse>(this.apiUrl, request)
      .pipe(catchError(this.handleError<CreateJobResponse>('createJob')));
  }

  /**
   * PUT /api/jobs/{job_id} - Cập nhật job (status, description, thêm/sửa rounds)
   * @param id ID của job
   * @param request UpdateJobRequest
   * @returns Observable<MessageResponse>
   */
  updateJobPost(
    id: number,
    request: UpdateJobRequest
  ): Observable<MessageResponse> {
    return this.http
      .put<MessageResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(
        catchError(this.handleError<MessageResponse>(`updateJobPost id=${id}`))
      );
  }

  /**
   * DELETE /api/jobs/{job_id} - Xóa job (nếu chưa có application)
   * @param id ID của job
   * @returns Observable<MessageResponse>
   */
  deleteJob(id: number): Observable<MessageResponse> {
    return this.http
      .delete<MessageResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<MessageResponse>(`deleteJob id=${id}`))
      );
  }

  /**
   * POST /api/jobs/complete - Tạo job hoàn chỉnh (job + rounds + templates) trong một transaction
   * @param request CompleteJobRequest với đầy đủ thông tin job, rounds, và templates
   * @returns Observable<CreateJobResponse>
   */
  createCompleteJob(
    request: CompleteJobRequest
  ): Observable<CreateJobResponse> {
    return this.http
      .post<CreateJobResponse>(`${this.apiUrl}/complete`, request)
      .pipe(
        catchError(this.handleError<CreateJobResponse>('createCompleteJob'))
      );
  }

  /**
   * POST /api/jobs/{job_id}/rounds - Tạo rounds cho job
   * @param jobId ID của job
   * @param rounds Danh sách rounds cần tạo
   * @returns Observable<MessageResponse>
   */
  createRounds(
    jobId: number,
    rounds: JobRoundDTO[]
  ): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.apiUrl}/${jobId}/rounds`, rounds)
      .pipe(catchError(this.handleError<MessageResponse>('createRounds')));
  }

  /**
   * Helper method để convert JobListResponse thành array JobPost[] (backward compatibility)
   * Lưu ý: JobListItemDTO từ backend chỉ có id, title, status, roundCount
   * Các field khác (description, location, etc.) sẽ được để trống
   */
  getJobPostsAsArray(
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Observable<JobPost[]> {
    return this.getJobPosts(status, page, limit).pipe(
      map((response: JobListResponse) => {
        // Backend trả về JobListItemDTO chỉ có: id, title, status (enum), roundCount
        return response.jobs.map((job: JobListItemDTO) => ({
          id: job.id,
          title: job.title,
          description: '', // JobListItemDTO không có description - cần gọi getJobPostById để lấy chi tiết
          location: '', // JobListItemDTO không có location
          salaryRange: '', // JobListItemDTO không có salary info
          roundCount: job.roundCount,
          status: job.status?.toString().toLowerCase() || '', // Backend trả về enum (active, inactive, closed), convert sang lowercase string
          publishedAt: '', // JobListItemDTO không có publishedAt
          createdAt: '', // JobListItemDTO không có createdAt
          updatedAt: '', // JobListItemDTO không có updatedAt
        }));
      })
    );
  }

  /**
   * Lấy TẤT CẢ job posts của business (tự động load nhiều pages nếu cần)
   * @param status Filter theo status (optional, undefined = lấy tất cả)
   * @returns Observable<JobPost[]> với tất cả jobs
   */
  getAllJobPosts(status?: string): Observable<JobPost[]> {
    const pageSize = 100; // Load 100 items mỗi page
    let currentPage = 1;

    // Sử dụng expand để load nhiều pages
    return this.getJobPosts(status, currentPage, pageSize).pipe(
      expand((response: JobListResponse) => {
        console.log(`[getAllJobPosts] Page ${currentPage}:`, {
          jobsCount: response.jobs.length,
          total: response.total,
          loadedCount: (currentPage - 1) * pageSize + response.jobs.length,
        });

        // Tính số items đã load: (currentPage - 1) * pageSize + số items trong page hiện tại
        const loadedCount = (currentPage - 1) * pageSize + response.jobs.length;

        // Nếu đã load hết (loadedCount >= total) hoặc không còn items nào, dừng lại
        if (loadedCount >= response.total || response.jobs.length === 0) {
          console.log('[getAllJobPosts] Finished loading all pages');
          return of(); // Empty observable để dừng expand
        }

        // Load page tiếp theo
        currentPage++;
        return this.getJobPosts(status, currentPage, pageSize);
      }),
      map((response: JobListResponse) => {
        console.log('[getAllJobPosts] Mapping response:', response);
        console.log('[getAllJobPosts] Jobs array:', response.jobs);

        // Kiểm tra nếu response hoặc jobs không tồn tại
        if (!response || !response.jobs) {
          console.warn('[getAllJobPosts] Response or jobs is null/undefined');
          return [];
        }

        // Map từ JobListItemDTO sang JobPost
        const mappedJobs = response.jobs.map((job: JobListItemDTO) => {
          // Xử lý status: backend trả về enum (active, inactive, closed) hoặc string
          let statusStr = '';
          if (job.status) {
            if (typeof job.status === 'string') {
              statusStr = job.status.toLowerCase();
            } else {
              // Nếu là object/enum, lấy tên
              statusStr = String(job.status).toLowerCase();
            }
          }

          return {
            id: job.id || 0,
            title: job.title || 'Không có tiêu đề',
            description: '', // JobListItemDTO không có description
            location: '', // JobListItemDTO không có location
            salaryRange: '', // JobListItemDTO không có salary info
            roundCount: job.roundCount || 0,
            status: statusStr,
            publishedAt: '', // JobListItemDTO không có publishedAt
            createdAt: '', // JobListItemDTO không có createdAt
            updatedAt: '', // JobListItemDTO không có updatedAt
          };
        });

        console.log('[getAllJobPosts] Mapped jobs:', mappedJobs);
        return mappedJobs;
      }),
      reduce((acc: JobPost[], current: JobPost[]) => {
        // Gộp tất cả jobs từ các pages lại
        const result = [...acc, ...current];
        console.log('[getAllJobPosts] Reduced result:', result.length, 'jobs');
        return result;
      }, [])
    );
  }

  /**
   * GET /api/forms?type={type} - Lấy danh sách email template forms của user hiện tại
   * API yêu cầu Bearer token trong headers để xác minh người dùng và lấy form thông qua người dùng đó
   * Token sẽ được tự động thêm bởi authInterceptor
   * @param type Loại form: 'pass' hoặc 'fail'
   * @returns Observable<any[]>
   */
  getSamples(type: 'pass' | 'fail'): Observable<any[]> {
    // Sử dụng query parameter thay vì path parameter
    // Token sẽ được tự động thêm bởi authInterceptor vào headers
    // Backend sẽ decode token để lấy user ID và trả về forms của user đó
    const params = new HttpParams().set('type', type);

    return this.http.get<any[]>(`${environment.apiUrl}/forms`, { params }).pipe(
      retry(2), // Retry 2 lần nếu lỗi
      catchError(this.handleError<any[]>('getSamples', []))
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
        return of(result as T);
      } else {
        return throwError(() => new Error(errorMessage));
      }
    };
  }
}
