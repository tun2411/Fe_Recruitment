# 🔐 Hướng dẫn Cấu hình Google Console cho OAuth

## ⚠️ Lỗi hiện tại: `origin_mismatch`

Lỗi này xảy ra vì Google Console chưa được cấu hình đúng với origin của app.

---

## 📋 Bước 1: Truy cập Google Cloud Console

1. Mở trình duyệt và truy cập: https://console.cloud.google.com/
2. Đăng nhập bằng Google account của bạn
3. Chọn project của bạn (hoặc tạo project mới nếu chưa có)

---

## 📋 Bước 2: Tìm OAuth 2.0 Client ID

1. Trong Google Cloud Console, vào **APIs & Services** → **Credentials**
2. Tìm OAuth 2.0 Client ID có Client ID: `314046144776-pfepr9d4bj6btmjfnd4kqjo6qciu5te9`
3. Click vào Client ID đó để chỉnh sửa

---

## 📋 Bước 3: Cấu hình Authorized JavaScript origins

Trong phần **Authorized JavaScript origins**, thêm các origins sau:

### ✅ Cho Web Development (localhost):
```
http://localhost:4200
http://127.0.0.1:4200
```

### ✅ Cho Web Production (nếu có):
```
https://yourdomain.com
https://www.yourdomain.com
```

### ✅ Cho Android (nếu cần):
```
android://com.hrm.app
```

**Lưu ý**: 
- Không có dấu `/` ở cuối
- Phải có `http://` hoặc `https://` cho web
- Android dùng format `android://`

---

## 📋 Bước 4: Cấu hình Authorized redirect URIs

Trong phần **Authorized redirect URIs**, thêm các URIs sau:

### ✅ Cho Web Development:
```
http://localhost:4200
http://localhost:4200/
http://127.0.0.1:4200
http://127.0.0.1:4200/
```

### ✅ Cho Web Production (nếu có):
```
https://yourdomain.com
https://yourdomain.com/
https://www.yourdomain.com
https://www.yourdomain.com/
```

### ✅ Cho Android:
```
com.hrm.app:/oauth/callback
```

**Lưu ý**:
- Có thể có hoặc không có dấu `/` ở cuối
- Android dùng format `com.hrm.app:/oauth/callback` (package name + path)

---

## 📋 Bước 5: Lưu thay đổi

1. Click nút **SAVE** ở cuối trang
2. Đợi vài giây để Google cập nhật cấu hình
3. Có thể mất 1-2 phút để thay đổi có hiệu lực

---

## 📋 Bước 6: Test lại

1. Mở app tại `http://localhost:4200`
2. Click "Đăng nhập bằng Google"
3. Lỗi `origin_mismatch` sẽ không còn nữa

---

## 🖼️ Hình ảnh minh họa

### Authorized JavaScript origins:
```
http://localhost:4200
http://127.0.0.1:4200
```

### Authorized redirect URIs:
```
http://localhost:4200
http://localhost:4200/
http://127.0.0.1:4200
http://127.0.0.1:4200/
```

---

## 🔧 Cấu hình cho Android (Tùy chọn)

Nếu bạn muốn chạy app trên Android, cần thêm:

### Authorized JavaScript origins:
```
android://com.hrm.app
```

### Authorized redirect URIs:
```
com.hrm.app:/oauth/callback
```

**Lưu ý**: 
- Package name phải khớp với `appId` trong `capacitor.config.ts` (hiện tại là `com.hrm.app`)
- Nếu package name khác, thay đổi cho phù hợp

---

## ⚠️ Lưu ý quan trọng

1. **Không dùng `localhost` cho production**: Chỉ dùng cho development
2. **HTTPS cho production**: Production phải dùng HTTPS
3. **Thời gian cập nhật**: Có thể mất 1-2 phút để thay đổi có hiệu lực
4. **Kiểm tra lại**: Sau khi lưu, đợi vài phút rồi test lại

---

## 🐛 Troubleshooting

### Vẫn bị lỗi `origin_mismatch` sau khi cấu hình?

1. **Kiểm tra lại origins**: Đảm bảo đã thêm đúng `http://localhost:4200` (không có `/` ở cuối)
2. **Đợi vài phút**: Google có thể cần thời gian để cập nhật
3. **Clear cache**: Xóa cache trình duyệt và thử lại
4. **Kiểm tra Client ID**: Đảm bảo Client ID trong code khớp với Google Console

### Lỗi khác?

- **Error 400: invalid_client**: Client ID không đúng hoặc không tồn tại
- **Error 403: access_denied**: OAuth consent screen chưa được cấu hình
- **Error 401: unauthorized**: Token không hợp lệ

---

## 📝 Checklist

- [ ] Đã truy cập Google Cloud Console
- [ ] Đã tìm thấy OAuth 2.0 Client ID
- [ ] Đã thêm `http://localhost:4200` vào Authorized JavaScript origins
- [ ] Đã thêm `http://localhost:4200` vào Authorized redirect URIs
- [ ] Đã click SAVE
- [ ] Đã đợi vài phút
- [ ] Đã test lại và không còn lỗi

---

## ✅ Sau khi cấu hình xong

App sẽ có thể đăng nhập bằng Google thành công! 🎉

