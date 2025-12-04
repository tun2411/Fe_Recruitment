# 📮 Hướng dẫn Test API Update Job bằng Postman

## 📁 Files đã tạo

1. **`postman-test-update-job.json`** - Postman Collection đầy đủ (import vào Postman)
2. **`postman-request-body-examples.json`** - Các ví dụ request body (để copy-paste)

---

## 🚀 Cách sử dụng

### Bước 1: Import Collection vào Postman

1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file **`postman-test-update-job.json`**
4. Collection sẽ xuất hiện trong sidebar

### Bước 2: Cấu hình Variables

Trong Postman Collection, cập nhật các variables:

- **`baseUrl`**: `http://localhost:8080/api` (hoặc IP của backend)
- **`token`**: Bearer token của bạn (lấy từ login API)
- **`jobId`**: ID của job cần test (ví dụ: `1`)

**Cách cập nhật variables:**
1. Click vào collection name
2. Chọn tab **Variables**
3. Cập nhật giá trị cho `baseUrl`, `token`, `jobId`

### Bước 3: Lấy Bearer Token

Nếu chưa có token, cần đăng nhập trước:

```
POST http://localhost:8080/api/auth/login
Body:
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

Copy `accessToken` từ response và paste vào variable `token` trong Postman.

### Bước 4: Test API

#### 4.1. Lấy thông tin job hiện tại

1. Chọn request **"1. GET Job Detail"**
2. Click **Send**
3. Kiểm tra response để lấy:
   - `jobId`
   - `rounds[].roundId` (ID của các rounds)
   - `rounds[].forms[].formId` (ID của các forms/templates)

#### 4.2. Test Update Job

Chọn một trong các request sau:

- **"2. PUT Update Job (Cập nhật job với rounds)"** - Cập nhật đầy đủ với forms
- **"3. PUT Update Job (Không có forms)"** - Chỉ cập nhật rounds
- **"4. PUT Update Job (Tạo rounds mới)"** - Tạo rounds mới

**Lưu ý:** Cập nhật các giá trị trong request body:
- Thay `roundId`, `formId` bằng giá trị thực tế từ job của bạn
- Kiểm tra `jobId` trong URL

---

## 📋 Cấu trúc Request Body

### UpdateJobRequest

```json
{
  "title": "string",
  "description": "string",
  "location": "string",
  "salaryFrom": number,
  "salaryTo": number,
  "workTime": "fulltime|parttime|internship|contract|freelance",
  "yoe": number,
  "unit": "year|month",
  "status": "active|inactive|closed",
  "deadline": "yyyy-MM-ddTHH:mm:ss",
  "rounds": [
    {
      "roundId": number,        // Optional: ID của round (có khi update)
      "roundIndex": number,     // Required: Chỉ số vòng (bắt đầu từ 0)
      "roundName": "string",     // Required: Tên vòng
      "isConfirmed": boolean,    // Optional: Yêu cầu xác nhận
      "forms": [                 // Optional: Danh sách forms/templates
        {
          "formId": number,      // Required khi update form
          "formName": "string",  // Optional
          "type": "pass|fail",   // Required
          "roundId": number      // Optional: ID của round
        }
      ]
    }
  ]
}
```

---

## 🔍 Test các trường hợp lỗi

### 1. Test lỗi 401 (Unauthorized)

**Cách test:**
- Xóa hoặc sửa token thành token không hợp lệ
- Gửi request
- **Kỳ vọng:** Response 401 với message "Không có quyền truy cập"

### 2. Test lỗi 403 (Forbidden)

**Cách test:**
- Dùng token của user không có quyền update job này
- **Kỳ vọng:** Response 403 với message "Bạn không có quyền thực hiện thao tác này"

### 3. Test lỗi 400 (Bad Request)

**Cách test:**
- Gửi request với dữ liệu không hợp lệ:
  - `roundIndex` < 0
  - `roundIndex` không liên tục (0, 1, 3 thay vì 0, 1, 2)
  - `type` không phải 'pass' hoặc 'fail'
  - `deadline` format sai
- **Kỳ vọng:** Response 400 với message lỗi cụ thể

### 4. Test lỗi 404 (Not Found)

**Cách test:**
- Gửi request với `jobId` không tồn tại
- **Kỳ vọng:** Response 404 với message "Không tìm thấy dữ liệu"

---

## ✅ Checklist Test

- [ ] Import collection thành công
- [ ] Cấu hình variables (baseUrl, token, jobId)
- [ ] GET job detail thành công
- [ ] PUT update job với rounds và forms thành công
- [ ] PUT update job chỉ với rounds (không có forms) thành công
- [ ] PUT update job tạo rounds mới thành công
- [ ] Test lỗi 401 (token không hợp lệ)
- [ ] Test lỗi 403 (không có quyền)
- [ ] Test lỗi 400 (dữ liệu không hợp lệ)
- [ ] Test lỗi 404 (jobId không tồn tại)

---

## 🐛 Debug Tips

### 1. Kiểm tra Token

```bash
# Decode JWT token tại: https://jwt.io
# Kiểm tra:
# - Token có hết hạn không?
# - User ID trong token có đúng không?
# - Token có đúng format không?
```

### 2. Kiểm tra Request Body

- Validate JSON format tại: https://jsonlint.com
- Kiểm tra các field required
- Kiểm tra data types (number vs string)

### 3. Kiểm tra Backend Logs

- Xem console log của backend
- Kiểm tra SQL queries
- Kiểm tra exception stack trace

### 4. So sánh với Frontend

- Mở DevTools trong browser
- Xem Network tab khi click "Cập nhật"
- So sánh request body giữa Postman và Frontend

---

## 📝 Notes

1. **roundId vs roundIndex:**
   - `roundId`: ID trong database (có khi round đã tồn tại)
   - `roundIndex`: Chỉ số vòng (0, 1, 2, ...) - luôn bắt đầu từ 0

2. **Backend behavior khi update rounds:**
   - Nếu `rounds != null && !empty`: Xóa rounds cũ, tạo rounds mới
   - Nếu `rounds == null` hoặc không gửi: Giữ nguyên rounds hiện tại

3. **formId:**
   - Bắt buộc khi update form (không phải tạo mới)
   - Nếu không có formId, backend sẽ không update form đó

4. **Format deadline:**
   - Format: `yyyy-MM-ddTHH:mm:ss`
   - Ví dụ: `2024-12-31T00:00:00`

---

## 🔗 Related Files

- `src/app/services/job-post.service.ts` - Service gọi API
- `src/app/pages/configure-rounds/configure-rounds.page.ts` - Component gọi API
- `src/app/interceptors/auth.interceptor.ts` - Auth interceptor

---

## ❓ FAQ

**Q: Làm sao biết token có hợp lệ không?**
A: Decode token tại https://jwt.io và kiểm tra `exp` (expiration time)

**Q: Tại sao response 401 nhưng không có status code?**
A: Đã sửa trong code - error handler giờ giữ lại status code. Nếu vẫn gặp, kiểm tra lại code mới nhất.

**Q: Làm sao test với job thực tế?**
A: Dùng GET job detail để lấy jobId và roundIds thực tế, sau đó cập nhật vào request body.

**Q: Có thể test mà không cần token không?**
A: Không, tất cả API đều yêu cầu authentication (trừ login/register).






