# 🔐 Cấu hình API Đăng nhập

## ✅ Đã cấu hình

Ứng dụng đã được cấu hình để gọi API đăng nhập với:

- **URL**: `http://localhost:8080/api/auth/login`
- **Method**: `POST`
- **Request Body**: 
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

## 📋 Chi tiết Implementation

### 1. AuthService (`src/app/services/auth.service.ts`)

```typescript
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  email?: string;
  username?: string;
}

login(credentials: LoginRequest): Observable<LoginResponse> {
  return this.http
    .post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
    .pipe(
      tap((response) => {
        if (response.token) {
          this.setToken(response.token);
          this.currentUserSubject.next(response.token);
        }
      })
    );
}
```

### 2. Login Page (`src/app/pages/login/login.page.ts`)

Form validation:
```typescript
this.loginForm = this.formBuilder.group({
  username: ['', [Validators.required]],
  password: ['', [Validators.required, Validators.minLength(6)]],
});
```

Gọi API:
```typescript
const credentials = {
  username: this.loginForm.value.username,
  password: this.loginForm.value.password,
};

this.authService.login(credentials).subscribe({
  next: (response) => {
    // Xử lý thành công
    // Token đã được lưu tự động bởi AuthService
    this.router.navigate(['/home']);
  },
  error: (error) => {
    // Xử lý lỗi
  },
});
```

## 🔄 Flow hoạt động

1. **User nhập username và password** → Form validation
2. **Click "Log in"** → Gọi `onLogin()`
3. **Hiển thị loading** → `LoadingController`
4. **Gọi API** → `POST http://localhost:8080/api/auth/login`
5. **Nhận response** → `{ token: "...", type: "..." }`
6. **Lưu token** → `localStorage.setItem('auth_token', token)`
7. **Redirect** → Chuyển đến `/home`

## 🛡️ Error Handling

Ứng dụng xử lý các lỗi sau:

| Status Code | Message | Xử lý |
|------------|---------|-------|
| 401 | Invalid username or password | Hiển thị error message |
| 0 | Cannot connect to server | Hiển thị connection error |
| 500+ | Server error | Hiển thị generic error |

## 🔐 Token Management

- **Lưu token**: Tự động khi login thành công
- **Lấy token**: `authService.getToken()`
- **Xóa token**: `authService.clearToken()` hoặc `authService.logout()`
- **Kiểm tra đăng nhập**: `authService.isAuthenticated()`

## 🔄 Auth Interceptor

Tất cả HTTP requests tự động được thêm header:
```
Authorization: Bearer <token>
```

Nếu nhận được 401/403, interceptor sẽ:
1. Xóa token
2. Logout user
3. Redirect về `/login`
4. Hiển thị toast notification

## 🧪 Test API

### 1. Sử dụng Browser DevTools
1. Mở DevTools (F12)
2. Vào tab **Network**
3. Thử đăng nhập
4. Xem request:
   - **URL**: `http://localhost:8080/api/auth/login`
   - **Method**: `POST`
   - **Headers**: `Content-Type: application/json`
   - **Body**: `{ "username": "...", "password": "..." }`
5. Xem response:
   - **Status**: 200 (success) hoặc 401 (unauthorized)
   - **Body**: `{ "token": "...", "type": "..." }`

### 2. Sử dụng Postman/Insomnia
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

### 3. Test với cURL
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

## ⚙️ Cấu hình Backend

Đảm bảo backend của bạn:

1. **CORS**: Cho phép frontend gọi API
   ```java
   // Spring Boot example
   @CrossOrigin(origins = "http://localhost:4200")
   ```

2. **Response Format**: Trả về đúng format
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "type": "Bearer"
   }
   ```

3. **Error Response**: Trả về status code đúng
   - 200: Success
   - 401: Unauthorized (sai username/password)
   - 500: Server error

## 🔧 Troubleshooting

### Lỗi: "Cannot connect to server"
- ✅ Kiểm tra backend có đang chạy không
- ✅ Kiểm tra URL trong `environment.ts` có đúng không
- ✅ Kiểm tra CORS settings trên backend

### Lỗi: "401 Unauthorized"
- ✅ Kiểm tra username/password có đúng không
- ✅ Kiểm tra backend có validate đúng không
- ✅ Xem Network tab để kiểm tra request body

### Lỗi: "CORS policy"
- ✅ Cấu hình CORS trên backend
- ✅ Thêm `Access-Control-Allow-Origin` header

### Token không được lưu
- ✅ Kiểm tra localStorage trong DevTools
- ✅ Kiểm tra `setToken()` trong AuthService

## 📝 Checklist

- [x] Cập nhật `LoginRequest` interface dùng `username`
- [x] Cập nhật form validation
- [x] Cập nhật HTML template
- [x] Cập nhật error messages
- [ ] Test với backend thực tế
- [ ] Kiểm tra CORS settings
- [ ] Test error handling

## 🎯 Next Steps

1. **Test API**: Đảm bảo backend đang chạy và test đăng nhập
2. **CORS**: Cấu hình CORS nếu chưa có
3. **Error Messages**: Tùy chỉnh error messages theo backend response
4. **Remember Me**: Thêm tính năng "Remember me" nếu cần
5. **Forgot Password**: Implement forgot password flow

---

**Lưu ý**: Đảm bảo backend của bạn đang chạy tại `http://localhost:8080` trước khi test!

