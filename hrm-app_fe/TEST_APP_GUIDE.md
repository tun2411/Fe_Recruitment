# 🧪 Hướng dẫn Test App HRM

## ✅ Checklist trước khi test

### 1. Backend đang chạy
- [ ] Spring Boot đang chạy tại `http://localhost:8080`
- [ ] Database đã có data (đã chạy `fake_data_business4.sql`)
- [ ] Business ID 4 đã tồn tại với email Google của bạn
- [ ] Jobs 5, 6, 7 đã có applications

### 2. Frontend đang chạy
- [ ] Angular dev server đang chạy tại `http://localhost:4200`
- [ ] Proxy đã được cấu hình (`proxy.conf.json`)
- [ ] Environment đã set `apiUrl: '/api'`

## 🚀 Các bước test

### Bước 1: Khởi động Backend
```bash
cd BE/BE
# Chạy Spring Boot application
mvn spring-boot:run
# Hoặc chạy từ IDE
```

**Kiểm tra**: Mở browser → `http://localhost:8080/api/auth/test/fake-token` → Phải trả về JSON

### Bước 2: Khởi động Frontend
```bash
cd Fe_Recruitment/hrm-app_fe
npm start
# Hoặc
ng serve
```

**Kiểm tra**: Mở browser → `http://localhost:4200` → Phải hiển thị login page

### Bước 3: Đăng nhập bằng Google

1. **Mở Browser DevTools** (F12) → Tab **Console** và **Network**

2. **Click nút "Đăng nhập bằng Google"**

3. **Chọn Google account** (account có business ID 4 trong database)

4. **Kiểm tra trong Network tab**:
   - Request: `POST /api/auth/google`
   - Status: `200 OK`
   - Response có: `token`, `refreshToken`, `user`

5. **Kiểm tra trong Console**:
   - Không có lỗi
   - Token đã được lưu

6. **Tự động redirect** đến `/home` sau khi đăng nhập thành công

### Bước 4: Kiểm tra Home Page (Danh sách Jobs)

1. **Mở Browser DevTools** (F12) → Tab **Console** và **Network**

2. **Kiểm tra trong Network tab**:
   - Request: `GET /api/jobs?page=1&limit=100`
   - Status: `200 OK`
   - Response có format: `{jobs: [...], total: ...}`

3. **Kiểm tra trong Console**:
   - `[getJobPosts] Response for page 1:` - Response từ API
   - `[getAllJobPosts] Page 1:` - Thông tin pagination
   - `[HomePage] Loaded job posts:` - Dữ liệu sau khi load
   - `[HomePage] Posts count:` - Số lượng posts

4. **Kiểm tra trên giao diện**:
   - Hiển thị danh sách jobs (Jobs 5, 6, 7)
   - Mỗi job có: Title, Description, Date
   - Có nút "List" và "Detail"

### Bước 5: Test Xem Chi tiết Job

1. **Click nút "Detail"** trên một job card

2. **Kiểm tra trong Network tab**:
   - Request: `GET /api/jobs/5` (hoặc 6, 7)
   - Status: `200 OK`
   - Response có đầy đủ thông tin job và rounds

3. **Kiểm tra trên giao diện**:
   - Hiển thị form edit với đầy đủ thông tin
   - Có thể chỉnh sửa và lưu

### Bước 6: Test Xem Danh sách Ứng viên

1. **Từ Home page, click nút "List"** trên một job card

2. **Kiểm tra trong Network tab**:
   - Request: `GET /api/applications/job/5` (hoặc 6, 7)
   - Status: `200 OK`
   - Response là array các applications

3. **Kiểm tra trên giao diện**:
   - Hiển thị danh sách ứng viên
   - Mỗi ứng viên có: Tên, Email, Phone, Status, Round
   - Có thể download CV

### Bước 7: Test Filter Applications theo Status

1. **Từ Candidates page**, có thể test các API:
   - `GET /api/applications/job/5/status/NEW` - Ứng viên mới
   - `GET /api/applications/job/5/status/IN_PROCESS` - Đang phỏng vấn
   - `GET /api/applications/job/5/status/PASS` - Đã pass
   - `GET /api/applications/job/5/status/FAIL` - Đã fail

## 🐛 Debug nếu có lỗi

### Lỗi 1: Không hiển thị danh sách jobs

**Kiểm tra**:
1. Mở Console → Xem logs
2. Mở Network tab → Xem request `/api/jobs`
3. Kiểm tra Response body

**Nguyên nhân có thể**:
- Backend chưa chạy
- Token không hợp lệ (401/403)
- Business ID không đúng
- Response format không đúng

**Giải pháp**:
- Kiểm tra token trong localStorage: `localStorage.getItem('auth_token')`
- Kiểm tra email business trong database phải khớp với Google email
- Xem logs trong Console để biết lỗi cụ thể

### Lỗi 2: CORS Error

**Nguyên nhân**: Proxy chưa hoạt động

**Giải pháp**:
1. Dừng dev server (Ctrl + C)
2. Restart: `npm start`
3. Kiểm tra `proxy.conf.json` có đúng không
4. Kiểm tra `angular.json` có cấu hình proxy không

### Lỗi 3: 401 Unauthorized

**Nguyên nhân**: Token hết hạn hoặc không hợp lệ

**Giải pháp**:
1. Đăng xuất và đăng nhập lại
2. Kiểm tra token trong localStorage
3. Kiểm tra token có được gửi trong header không (Network tab)

### Lỗi 4: 404 Not Found

**Nguyên nhân**: API endpoint không đúng

**Giểm tra**:
- URL trong Network tab
- Backend có endpoint đó không
- Path variable có đúng không (`job_id` vs `id`)

## 📊 Dữ liệu test có sẵn

### Business ID 4
- Email: `myemail@gmail.com` (sửa theo email Google của bạn)
- Jobs: 5, 6, 7

### Job 5 (Full Stack Developer)
- Applications: 10 (NEW: 3, IN_PROCESS: 4, PASS: 2, FAIL: 1)
- Rounds: 3 rounds

### Job 6 (Mobile Developer)
- Applications: 8 (NEW: 3, IN_PROCESS: 2, PASS: 2, FAIL: 1)
- Rounds: 2 rounds

### Job 7 (Data Engineer)
- Applications: 9 (NEW: 3, IN_PROCESS: 3, PASS: 1, FAIL: 1)
- Rounds: 4 rounds

## ✅ Kết quả mong đợi

Sau khi test thành công:

1. **Login**: Đăng nhập thành công, redirect đến home
2. **Home Page**: Hiển thị 3 jobs (5, 6, 7)
3. **Job Detail**: Xem và edit được job
4. **Candidates**: Hiển thị danh sách ứng viên theo job
5. **Filter**: Lọc được ứng viên theo status

## 🎯 Tips

1. **Luôn mở DevTools** khi test để xem logs và network requests
2. **Kiểm tra Console** trước khi kiểm tra UI
3. **Kiểm tra Network tab** để xem request/response thực tế
4. **Clear cache** nếu có vấn đề: `Ctrl + Shift + R` (hard refresh)

Chúc bạn test thành công! 🎉

