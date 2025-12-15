# 🧪 Hướng dẫn Test API từ Frontend

## ✅ Backend đang hoạt động tốt!

Bạn đã test thành công bằng Postman:
- ✅ URL: `http://localhost:8080/api/auth/login`
- ✅ Method: POST
- ✅ Response: 200 OK với token và user info

**Lưu ý**: Lỗi 403 khi truy cập `http://localhost:8080/` là **BÌNH THƯỜNG**:
- Backend không có endpoint cho root path `/`
- Spring Security thường chặn root path
- **Quan trọng**: API endpoint `/api/auth/login` hoạt động tốt là đủ!

---

## 🚀 Test từ Frontend

### Bước 1: Đảm bảo Dev Server đã restart

Proxy chỉ hoạt động sau khi restart dev server:

```bash
# Dừng server hiện tại (Ctrl + C)
# Sau đó chạy lại:
cd "D:\HRM PROJECT\HRM PROJECT\hrm-app_fe"
npm start
```

### Bước 2: Kiểm tra Proxy hoạt động

Khi start server, bạn sẽ thấy log:
```
** Angular Live Development Server is listening on localhost:4200 **
```

### Bước 3: Mở Browser và Test

1. **Mở**: http://localhost:4200 (hoặc port mà Angular chạy)

2. **Mở DevTools** (F12) → Tab **Network**

3. **Thử đăng nhập**:
   - Username: `admin@gmail.com`
   - Password: `admin123`

4. **Kiểm tra trong Network tab**:
   - Tìm request: `POST /api/auth/login`
   - Status: `200 OK` ✅
   - Response: Có token và user info ✅

---

## 🔍 Debug nếu vẫn có lỗi

### Kiểm tra 1: Proxy có hoạt động không?

Mở Browser Console (F12) và xem:
- ❌ Nếu thấy: `http://localhost:8080/api/auth/login` → Proxy KHÔNG hoạt động
- ✅ Nếu thấy: `/api/auth/login` hoặc `http://localhost:4200/api/auth/login` → Proxy ĐANG hoạt động

### Kiểm tra 2: Environment có đúng không?

File: `src/environments/environment.ts`

```typescript
// ✅ ĐÚNG (khi dùng proxy):
apiUrl: '/api'

// ❌ SAI (khi dùng proxy):
apiUrl: 'http://localhost:8080/api'
```

### Kiểm tra 3: Dev Server đã restart chưa?

- Proxy chỉ hoạt động sau khi restart
- Nếu chưa restart, restart lại:
  ```bash
  # Ctrl + C để dừng
  npm start
  ```

---

## 🐛 Các lỗi thường gặp

### Lỗi 1: "Cannot GET /"
- **Nguyên nhân**: Truy cập root path của backend
- **Giải pháp**: Không cần fix, đây là bình thường. Chỉ cần API endpoints hoạt động.

### Lỗi 2: "404 Not Found" khi gọi API
- **Nguyên nhân**: URL không đúng hoặc proxy chưa hoạt động
- **Giải pháp**: 
  - Kiểm tra `apiUrl` trong `environment.ts` phải là `/api`
  - Restart dev server

### Lỗi 3: "CORS policy" vẫn còn
- **Nguyên nhân**: Proxy chưa hoạt động hoặc chưa restart
- **Giải pháp**: 
  - Dừng dev server (Ctrl + C)
  - Chạy lại: `npm start`
  - Kiểm tra `proxy.conf.json` có tồn tại không

### Lỗi 4: "Network Error" hoặc "ERR_FAILED"
- **Nguyên nhân**: Backend không chạy hoặc port sai
- **Giải pháp**: 
  - Kiểm tra Spring Boot có đang chạy tại `http://localhost:8080`
  - Test lại bằng Postman để xác nhận

---

## 📋 Checklist Test

- [ ] Spring Boot đang chạy tại `http://localhost:8080`
- [ ] Test Postman thành công (200 OK)
- [ ] File `proxy.conf.json` tồn tại trong `hrm-app_fe/`
- [ ] `angular.json` đã cấu hình proxy
- [ ] `environment.ts` có `apiUrl: '/api'`
- [ ] Dev server đã được restart sau khi cấu hình
- [ ] Mở browser: http://localhost:4200
- [ ] Mở DevTools → Network tab
- [ ] Thử đăng nhập
- [ ] Kiểm tra request trong Network tab

---

## 🎯 Kết quả mong đợi

Sau khi test thành công:

1. **Console không có lỗi CORS** ✅
2. **Network tab**:
   - Request: `POST /api/auth/login`
   - Status: `200 OK`
   - Response có token và user info
3. **UI**:
   - Toast hiển thị: "Đăng nhập thành công"
   - Redirect đến `/home`
   - Token được lưu trong localStorage

---

## 💡 Tips

1. **Luôn mở DevTools khi test** để xem request/response
2. **Kiểm tra Network tab** trước khi kiểm tra Console
3. **Restart dev server** nếu thay đổi proxy config
4. **Test Postman trước** để đảm bảo backend hoạt động

---

## 🆘 Nếu vẫn không được

1. **Kiểm tra file proxy.conf.json**:
   ```json
   {
     "/api": {
       "target": "http://localhost:8080",
       "secure": false,
       "changeOrigin": true,
       "logLevel": "debug"
     }
   }
   ```

2. **Kiểm tra angular.json** có dòng:
   ```json
   "serve": {
     "options": {
       "proxyConfig": "proxy.conf.json"
     }
   }
   ```

3. **Kiểm tra environment.ts**:
   ```typescript
   apiUrl: '/api'
   ```

4. **Restart hoàn toàn**:
   - Dừng tất cả terminal
   - Chạy lại: `npm start`

Chúc bạn test thành công! 🎉

