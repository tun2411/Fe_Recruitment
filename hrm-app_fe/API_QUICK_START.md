# 🚀 API Quick Start Guide

## 📋 Tóm tắt nhanh

### 1. Cấu hình API URL
File: `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api', // Cập nhật URL backend của bạn
};
```

### 2. Tạo Service
```bash
ng generate service services/your-service
```

### 3. Cấu trúc Service cơ bản
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class YourService {
  private apiUrl = `${environment.apiUrl}/your-endpoint`;

  constructor(private http: HttpClient) {}

  // GET
  getData(): Observable<YourType[]> {
    return this.http.get<YourType[]>(this.apiUrl);
  }

  // POST
  createData(data: Partial<YourType>): Observable<YourType> {
    return this.http.post<YourType>(this.apiUrl, data);
  }

  // PUT
  updateData(id: number, data: YourType): Observable<YourType> {
    return this.http.put<YourType>(`${this.apiUrl}/${id}`, data);
  }

  // DELETE
  deleteData(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### 4. Sử dụng trong Component
```typescript
import { YourService } from '../services/your.service';

constructor(private yourService: YourService) {}

ngOnInit() {
  this.yourService.getData().subscribe({
    next: (data) => {
      console.log('Data:', data);
    },
    error: (error) => {
      console.error('Error:', error);
    },
  });
}
```

## ✅ Đã có sẵn

- ✅ **HttpClient** đã được cấu hình trong `main.ts`
- ✅ **Auth Interceptor** tự động thêm Bearer token vào headers
- ✅ **Error Handling** tự động xử lý 401/403 và logout

## 📚 Xem thêm

- **Chi tiết đầy đủ**: Xem file `API_GUIDE.md`
- **Service mẫu**: Xem file `src/app/services/employee.service.ts`
- **Component mẫu**: Xem file `src/app/examples/employee-list-example.ts`

## 🎯 Các HTTP Methods

| Method | Mục đích | Ví dụ |
|--------|----------|-------|
| GET | Lấy dữ liệu | `this.http.get<Type>(url)` |
| POST | Tạo mới | `this.http.post<Type>(url, body)` |
| PUT | Cập nhật toàn bộ | `this.http.put<Type>(url, body)` |
| PATCH | Cập nhật một phần | `this.http.patch<Type>(url, body)` |
| DELETE | Xóa | `this.http.delete<Type>(url)` |

## 🔐 Authentication

**Không cần làm gì thêm!** Auth Interceptor tự động:
- Thêm `Authorization: Bearer <token>` vào tất cả requests
- Xử lý 401/403 và tự động logout
- Redirect về login khi token hết hạn

## 🐛 Debug API

1. Mở **Browser DevTools** (F12)
2. Vào tab **Network**
3. Xem tất cả HTTP requests
4. Kiểm tra Request/Response headers và body

## ⚠️ Lưu ý quan trọng

1. **CORS**: Backend phải cấu hình CORS để cho phép frontend gọi API
2. **API URL**: Cập nhật `apiUrl` trong `environment.ts` theo backend thực tế
3. **Unsubscribe**: Nhớ unsubscribe khi component destroy (hoặc dùng async pipe)
4. **Error Handling**: Luôn xử lý error trong subscribe

## 🎉 Bắt đầu ngay!

1. Xem ví dụ trong `employee.service.ts`
2. Copy pattern và áp dụng cho service của bạn
3. Test với Browser DevTools Network tab

Chúc bạn code vui vẻ! 🚀

