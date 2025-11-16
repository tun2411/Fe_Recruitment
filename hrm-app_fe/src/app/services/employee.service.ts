import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Định nghĩa Interface cho Employee
export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  phone?: string;
  salary?: number;
  hireDate?: string;
}

// Interface cho API Response wrapper (nếu backend trả về dạng này)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// Interface cho Pagination
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Interface cho Filters
export interface EmployeeFilters {
  department?: string;
  position?: string;
  name?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}


  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl).pipe(
      retry(2), // Retry 2 lần nếu lỗi
      catchError(this.handleError<Employee[]>('getEmployees', []))
    );
  }

  /**
   * GET - Lấy danh sách với filters và pagination
   */
  getEmployeesWithFilters(
    filters: EmployeeFilters
  ): Observable<PaginatedResponse<Employee>> {
    let params = new HttpParams();

    if (filters.department) {
      params = params.set('department', filters.department);
    }
    if (filters.position) {
      params = params.set('position', filters.position);
    }
    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.size) {
      params = params.set('size', filters.size.toString());
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http
      .get<PaginatedResponse<Employee>>(this.apiUrl, { params })
      .pipe(
        catchError(
          this.handleError<PaginatedResponse<Employee>>('getEmployeesWithFilters')
        )
      );
  }

  /**
   * GET - Lấy một employee theo ID
   */
  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<Employee>(`getEmployeeById id=${id}`))
    );
  }

  /**
   * POST - Tạo mới employee
   */
  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee).pipe(
      catchError(this.handleError<Employee>('createEmployee'))
    );
  }

  /**
   * PUT - Cập nhật toàn bộ employee
   */
  updateEmployee(id: number, employee: Employee): Observable<Employee> {
    return this.http
      .put<Employee>(`${this.apiUrl}/${id}`, employee)
      .pipe(
        catchError(this.handleError<Employee>(`updateEmployee id=${id}`))
      );
  }

  /**
   * PATCH - Cập nhật một phần employee
   */
  patchEmployee(
    id: number,
    updates: Partial<Employee>
  ): Observable<Employee> {
    return this.http
      .patch<Employee>(`${this.apiUrl}/${id}`, updates)
      .pipe(
        catchError(this.handleError<Employee>(`patchEmployee id=${id}`))
      );
  }

  /**
   * DELETE - Xóa employee
   */
  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<void>(`deleteEmployee id=${id}`))
    );
  }

  /**
   * GET - Tìm kiếm employees theo tên
   */
  searchEmployees(searchTerm: string): Observable<Employee[]> {
    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<Employee[]>(this.apiUrl, { params }).pipe(
      catchError(this.handleError<Employee[]>('searchEmployees', []))
    );
  }

  /**
   * GET - Lấy employees theo department
   */
  getEmployeesByDepartment(department: string): Observable<Employee[]> {
    const params = new HttpParams().set('department', department);
    return this.http.get<Employee[]>(this.apiUrl, { params }).pipe(
      catchError(
        this.handleError<Employee[]>('getEmployeesByDepartment', [])
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
            // Auth interceptor sẽ tự động xử lý logout
            break;
          case 403:
            errorMessage = 'Bạn không có quyền thực hiện thao tác này';
            break;
          case 404:
            errorMessage = 'Không tìm thấy dữ liệu';
            break;
          case 409:
            errorMessage = 'Dữ liệu đã tồn tại';
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

      // Log lỗi (có thể gửi lên logging service)
      // this.logService.logError(error);

      // Trả về giá trị mặc định hoặc throw error
      if (result !== undefined) {
        return of(result);
      } else {
        return throwError(() => new Error(errorMessage));
      }
    };
  }
}

