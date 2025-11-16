# 🔗 Tích hợp với Spring Boot Backend

## ✅ Đã cập nhật

Code đã được cập nhật để khớp hoàn toàn với response từ Spring Boot backend của bạn.

## 📋 Response Format từ Backend

```json
{
  "token": "eyJhbGci0iJIUzUxMiJ9...",
  "type": "Bearer",
  "username": "admin@gmail.com",
  "email": "admin@example.com",
  "role": "ADMIN",
  "message": "Đăng nhập thành công"
}
```

## 🔄 Những gì đã được cập nhật

### 1. LoginResponse Interface
```typescript
export interface LoginResponse {
  token: string;
  type: string;
  username: string;      // ✅ Required
  email: string;        // ✅ Required
  role: string;         // ✅ Mới thêm
  message: string;       // ✅ Mới thêm
}
```

### 2. UserInfo Interface (Mới)
```typescript
export interface UserInfo {
  username: string;
  email: string;
  role: string;
}
```

### 3. AuthService - Lưu thông tin User
- ✅ Lưu token vào localStorage
- ✅ Lưu thông tin user (username, email, role) vào localStorage
- ✅ BehaviorSubject để theo dõi user hiện tại
- ✅ Các method mới để lấy thông tin user

### 4. Login Page
- ✅ Hiển thị message từ backend ("Đăng nhập thành công")
- ✅ Tự động lưu thông tin user sau khi login thành công

## 🎯 Cách sử dụng thông tin User

### Lấy thông tin user hiện tại
```typescript
import { AuthService } from '../services/auth.service';

constructor(private authService: AuthService) {}

ngOnInit() {
  // Lấy thông tin user
  const user = this.authService.getCurrentUser();
  if (user) {
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
  }
}
```

### Kiểm tra Role
```typescript
// Lấy role
const role = this.authService.getUserRole(); // "ADMIN" | "USER" | null

// Kiểm tra có phải Admin không
if (this.authService.isAdmin()) {
  // Hiển thị các tính năng admin
}
```

### Subscribe để theo dõi thay đổi
```typescript
ngOnInit() {
  this.authService.currentUser$.subscribe(user => {
    if (user) {
      console.log('User logged in:', user);
      // Cập nhật UI dựa trên role
      this.isAdmin = user.role === 'ADMIN';
    } else {
      console.log('User logged out');
    }
  });
}
```

## 📦 Dữ liệu được lưu trong localStorage

Sau khi login thành công, 2 items được lưu:

1. **auth_token**: JWT token
   ```typescript
   localStorage.getItem('auth_token')
   ```

2. **user_info**: Thông tin user (JSON string)
   ```json
   {
     "username": "admin@gmail.com",
     "email": "admin@example.com",
     "role": "ADMIN"
   }
   ```

## 🔐 Phân quyền dựa trên Role

### Ví dụ: Hiển thị menu theo role
```typescript
export class HomePage {
  userRole: string | null = null;
  isAdmin: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    this.isAdmin = this.authService.isAdmin();
  }
}
```

```html
<!-- Template -->
<ion-button *ngIf="isAdmin" routerLink="/admin">
  Admin Panel
</ion-button>

<ion-button *ngIf="userRole === 'USER'">
  User Dashboard
</ion-button>
```

### Ví dụ: Guard Route theo Role
```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  } else {
    router.navigate(['/home']);
    return false;
  }
};
```

Sử dụng trong routes:
```typescript
{
  path: 'admin',
  loadComponent: () => import('./admin/admin.page'),
  canActivate: [adminGuard]
}
```

## 🧪 Test với Backend

### 1. Đảm bảo Backend đang chạy
```bash
# Spring Boot đang chạy tại
http://localhost:8080
```

### 2. Test đăng nhập
1. Mở ứng dụng: http://localhost:4200
2. Nhập:
   - Username: `admin@gmail.com`
   - Password: `admin123`
3. Click "Log in"
4. Kiểm tra:
   - ✅ Toast hiển thị: "Đăng nhập thành công"
   - ✅ Redirect đến `/home`
   - ✅ Token được lưu trong localStorage
   - ✅ User info được lưu trong localStorage

### 3. Kiểm tra trong Browser DevTools
```javascript
// Console
localStorage.getItem('auth_token')  // JWT token
localStorage.getItem('user_info')   // JSON string
```

## 🔄 Flow hoạt động

```
1. User nhập username + password
   ↓
2. POST /api/auth/login
   {
     "username": "admin@gmail.com",
     "password": "admin123"
   }
   ↓
3. Backend trả về:
   {
     "token": "...",
     "username": "admin@gmail.com",
     "email": "admin@example.com",
     "role": "ADMIN",
     "message": "Đăng nhập thành công"
   }
   ↓
4. AuthService:
   - Lưu token → localStorage
   - Lưu user info → localStorage
   - Emit user info → BehaviorSubject
   ↓
5. Login Page:
   - Hiển thị message từ backend
   - Redirect đến /home
```

## 🛡️ CORS Configuration (Spring Boot)

Đảm bảo backend của bạn có cấu hình CORS:

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:4200")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

Hoặc sử dụng annotation:
```java
@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    // ...
}
```

## 📝 API Endpoints

### Login
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "username": "admin@gmail.com",
  "password": "admin123"
}
```

### Response
```json
{
  "token": "eyJhbGci0iJIUzUxMiJ9...",
  "type": "Bearer",
  "username": "admin@gmail.com",
  "email": "admin@example.com",
  "role": "ADMIN",
  "message": "Đăng nhập thành công"
}
```

## ✅ Checklist

- [x] Cập nhật LoginResponse interface
- [x] Thêm UserInfo interface
- [x] Lưu thông tin user vào localStorage
- [x] Hiển thị message từ backend
- [x] Thêm methods để lấy thông tin user
- [x] Thêm method kiểm tra role (isAdmin)
- [ ] Test với backend thực tế
- [ ] Implement role-based guards
- [ ] Implement role-based UI

## 🎉 Kết quả

Bây giờ ứng dụng của bạn:
- ✅ Gọi đúng API endpoint
- ✅ Gửi đúng format request (username + password)
- ✅ Nhận và xử lý đúng response từ Spring Boot
- ✅ Lưu token và thông tin user
- ✅ Hiển thị message từ backend
- ✅ Có thể sử dụng role để phân quyền

Chúc bạn code vui vẻ! 🚀

