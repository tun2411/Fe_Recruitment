# Hướng dẫn Call API trong ứng dụng HRM+

## 📋 Tổng quan

Ứng dụng đã được cấu hình sẵn để call API với:
- ✅ **HttpClient** từ Angular
- ✅ **Auth Interceptor** tự động thêm Bearer token vào headers
- ✅ **Error Handling** tự động xử lý 401/403
- ✅ **Environment Configuration** cho dev và production

## 🔧 Cấu hình API Base URL

### Development
File: `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
};
```

### Production
File: `src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api',
};
```

**Lưu ý**: Nhớ cập nhật `apiUrl` theo backend thực tế của bạn!

---

## 📦 Tạo Service để Call API

### Bước 1: Tạo Service
```bash
ng generate service services/employee
```

Hoặc tạo thủ công file: `src/app/services/employee.service.ts`

### Bước 2: Cấu trúc Service cơ bản

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Định nghĩa Interface cho Response
export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  // GET - Lấy danh sách
  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  // GET với query parameters
  getEmployeesWithFilters(filters: {
    department?: string;
    position?: string;
    page?: number;
    size?: number;
  }): Observable<Employee[]> {
    let params = new HttpParams();
    
    if (filters.department) {
      params = params.set('department', filters.department);
    }
    if (filters.position) {
      params = params.set('position', filters.position);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.size) {
      params = params.set('size', filters.size.toString());
    }

    return this.http.get<Employee[]>(this.apiUrl, { params });
  }

  // GET - Lấy một item theo ID
  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  // POST - Tạo mới
  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee);
  }

  // PUT - Cập nhật toàn bộ
  updateEmployee(id: number, employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employee);
  }

  // PATCH - Cập nhật một phần
  patchEmployee(id: number, updates: Partial<Employee>): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, updates);
  }

  // DELETE - Xóa
  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

---

## 🎯 Sử dụng Service trong Component

### Ví dụ 1: GET Request (Lấy danh sách)

```typescript
import { Component, OnInit } from '@angular/core';
import { EmployeeService, Employee } from '../services/employee.service';
import { LoadingController, ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.page.html',
})
export class EmployeeListPage implements OnInit {
  employees: Employee[] = [];
  isLoading = false;

  constructor(
    private employeeService: EmployeeService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }

  async loadEmployees() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Đang tải...',
    });
    await loading.present();

    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoading = false;
        loading.dismiss();
      },
      error: async (error) => {
        this.isLoading = false;
        loading.dismiss();
        
        const toast = await this.toastController.create({
          message: 'Không thể tải danh sách nhân viên',
          duration: 3000,
          color: 'danger',
        });
        await toast.present();
        
        console.error('Error loading employees:', error);
      },
    });
  }
}
```

### Ví dụ 2: POST Request (Tạo mới)

```typescript
async createEmployee(employeeData: Partial<Employee>) {
  const loading = await this.loadingController.create({
    message: 'Đang tạo...',
  });
  await loading.present();

  this.employeeService.createEmployee(employeeData).subscribe({
    next: async (newEmployee) => {
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Tạo nhân viên thành công!',
        duration: 2000,
        color: 'success',
      });
      await toast.present();

      // Reload danh sách hoặc thêm vào mảng
      this.employees.push(newEmployee);
    },
    error: async (error) => {
      await loading.dismiss();
      
      let errorMessage = 'Không thể tạo nhân viên';
      if (error.status === 400) {
        errorMessage = error.error?.message || 'Dữ liệu không hợp lệ';
      } else if (error.status === 409) {
        errorMessage = 'Email đã tồn tại';
      }

      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
    },
  });
}
```

### Ví dụ 3: PUT/PATCH Request (Cập nhật)

```typescript
async updateEmployee(id: number, employeeData: Employee) {
  const loading = await this.loadingController.create({
    message: 'Đang cập nhật...',
  });
  await loading.present();

  this.employeeService.updateEmployee(id, employeeData).subscribe({
    next: async (updatedEmployee) => {
      await loading.dismiss();
      
      // Cập nhật trong danh sách
      const index = this.employees.findIndex(e => e.id === id);
      if (index !== -1) {
        this.employees[index] = updatedEmployee;
      }

      const toast = await this.toastController.create({
        message: 'Cập nhật thành công!',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    },
    error: async (error) => {
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Không thể cập nhật',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
    },
  });
}
```

### Ví dụ 4: DELETE Request

```typescript
async deleteEmployee(id: number) {
  const loading = await this.loadingController.create({
    message: 'Đang xóa...',
  });
  await loading.present();

  this.employeeService.deleteEmployee(id).subscribe({
    next: async () => {
      await loading.dismiss();
      
      // Xóa khỏi danh sách
      this.employees = this.employees.filter(e => e.id !== id);

      const toast = await this.toastController.create({
        message: 'Xóa thành công!',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    },
    error: async (error) => {
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Không thể xóa',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
    },
  });
}
```

---

## 🔄 RxJS Operators hữu ích

### 1. map - Transform data
```typescript
getEmployees(): Observable<Employee[]> {
  return this.http.get<ApiResponse<Employee[]>>(this.apiUrl).pipe(
    map(response => response.data) // Extract data từ wrapper
  );
}
```

### 2. catchError - Xử lý lỗi
```typescript
getEmployees(): Observable<Employee[]> {
  return this.http.get<Employee[]>(this.apiUrl).pipe(
    catchError((error) => {
      console.error('API Error:', error);
      // Trả về giá trị mặc định hoặc throw error mới
      return throwError(() => new Error('Failed to load employees'));
    })
  );
}
```

### 3. tap - Side effects
```typescript
getEmployees(): Observable<Employee[]> {
  return this.http.get<Employee[]>(this.apiUrl).pipe(
    tap(data => console.log('Received:', data)),
    tap(data => this.cacheService.set('employees', data))
  );
}
```

### 4. retry - Retry khi lỗi
```typescript
import { retry } from 'rxjs/operators';

getEmployees(): Observable<Employee[]> {
  return this.http.get<Employee[]>(this.apiUrl).pipe(
    retry(3) // Retry 3 lần nếu lỗi
  );
}
```

### 5. debounceTime - Delay request
```typescript
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Trong component
searchControl = new FormControl('');

ngOnInit() {
  this.searchControl.valueChanges.pipe(
    debounceTime(300), // Đợi 300ms sau khi user ngừng gõ
    distinctUntilChanged() // Chỉ emit khi giá trị thay đổi
  ).subscribe(searchTerm => {
    this.searchEmployees(searchTerm);
  });
}
```

---

## 🛡️ Error Handling Patterns

### Pattern 1: Global Error Handler trong Service
```typescript
private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    console.error(`${operation} failed:`, error);
    
    // Có thể log lỗi lên server
    // this.logService.logError(error);
    
    // Trả về giá trị mặc định
    return of(result as T);
  };
}

getEmployees(): Observable<Employee[]> {
  return this.http.get<Employee[]>(this.apiUrl).pipe(
    catchError(this.handleError<Employee[]>('getEmployees', []))
  );
}
```

### Pattern 2: Specific Error Handling
```typescript
getEmployees(): Observable<Employee[]> {
  return this.http.get<Employee[]>(this.apiUrl).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        // Network error
        return throwError(() => new Error('Không có kết nối mạng'));
      } else if (error.status === 404) {
        // Not found
        return throwError(() => new Error('Không tìm thấy dữ liệu'));
      } else if (error.status >= 500) {
        // Server error
        return throwError(() => new Error('Lỗi server, vui lòng thử lại sau'));
      } else {
        return throwError(() => new Error(error.error?.message || 'Có lỗi xảy ra'));
      }
    })
  );
}
```

---

## 🔐 Authentication Headers

**Lưu ý**: Auth Interceptor đã tự động thêm Bearer token vào tất cả requests!

Nếu cần thêm headers tùy chỉnh:
```typescript
getEmployees(): Observable<Employee[]> {
  const headers = {
    'Custom-Header': 'value',
    // Authorization đã được interceptor thêm tự động
  };

  return this.http.get<Employee[]>(this.apiUrl, { headers });
}
```

---

## 📤 Upload File

```typescript
uploadFile(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', 'Employee photo');

  return this.http.post(`${this.apiUrl}/upload`, formData, {
    reportProgress: true,
    observe: 'events',
  });
}

// Sử dụng trong component
uploadFile(file: File) {
  this.employeeService.uploadFile(file).subscribe({
    next: (event) => {
      if (event.type === HttpEventType.UploadProgress) {
        const progress = Math.round((100 * event.loaded) / (event.total || 1));
        console.log(`Upload progress: ${progress}%`);
      } else if (event.type === HttpEventType.Response) {
        console.log('Upload complete:', event.body);
      }
    },
    error: (error) => {
      console.error('Upload error:', error);
    },
  });
}
```

---

## 🧪 Testing API Calls

### 1. Sử dụng Browser DevTools
- Mở **Network** tab (F12)
- Xem tất cả HTTP requests
- Kiểm tra request/response headers và body

### 2. Mock API với JSON Server
```bash
# Cài đặt json-server
npm install -g json-server

# Tạo file db.json
{
  "employees": [
    { "id": 1, "name": "John Doe", "email": "john@example.com" }
  ]
}

# Chạy mock server
json-server --watch db.json --port 3000
```

### 3. Test với Postman/Insomnia
- Import collection từ backend
- Test các endpoints trước khi tích hợp vào app

---

## 📝 Best Practices

1. ✅ **Luôn định nghĩa Interface/Type cho API responses**
2. ✅ **Sử dụng Observable và subscribe đúng cách**
3. ✅ **Xử lý loading states và error states**
4. ✅ **Unsubscribe khi component destroy** (hoặc dùng async pipe)
5. ✅ **Sử dụng environment variables cho API URLs**
6. ✅ **Xử lý lỗi một cách user-friendly**
7. ✅ **Log errors để debug**
8. ✅ **Sử dụng TypeScript types để type-safe**

---

## 🎯 Quick Reference

```typescript
// GET
this.http.get<Type>(url)

// POST
this.http.post<Type>(url, body)

// PUT
this.http.put<Type>(url, body)

// PATCH
this.http.patch<Type>(url, body)

// DELETE
this.http.delete<Type>(url)

// Với options
this.http.get<Type>(url, {
  params: new HttpParams().set('key', 'value'),
  headers: { 'Custom-Header': 'value' },
  observe: 'response', // Lấy full response
})
```

---

## 🚀 Next Steps

1. Tạo service cho các module khác (Department, Attendance, etc.)
2. Implement caching nếu cần
3. Thêm retry logic cho các API quan trọng
4. Implement pagination cho danh sách lớn
5. Thêm request/response logging

Chúc bạn code vui vẻ! 🎉

