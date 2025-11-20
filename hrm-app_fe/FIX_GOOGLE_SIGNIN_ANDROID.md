# Sửa lỗi Google Sign-In trên Android

## Vấn đề
Khi chạy app trên Android, Google Sign-In script không thể load được, gây ra lỗi:
```
Failed to load Google Sign-In script: [object Event]
Failed to load Google Sign-In script: Error: Failed to load Google Sign-In script. Check internet connection.
```

## Nguyên nhân
1. **WebView Settings**: Android WebView có cấu hình bảo mật nghiêm ngặt hơn, cần cấu hình đặc biệt để cho phép tải external scripts
2. **CORS và Network Security**: WebView cần được cấu hình để cho phép kết nối đến Google domains
3. **Timing Issues**: Script loading trên Android WebView cần thời gian lâu hơn so với web browser
4. **Cookie và Storage**: Google Sign-In cần third-party cookies và DOM storage

## Các thay đổi đã thực hiện

### 1. MainActivity.java
- ✅ Thêm cấu hình WebViewClient để xử lý navigation và errors
- ✅ Thêm WebChromeClient để log console messages
- ✅ Bật third-party cookies (cần cho Google Sign-In)
- ✅ Bật DOM storage và database storage
- ✅ Cấu hình error handling tốt hơn

### 2. GoogleSignInService
- ✅ Thêm detection cho Android platform
- ✅ Tăng timeout cho Android (20 giây thay vì 10 giây)
- ✅ Đợi document ready trước khi load script
- ✅ Tăng thời gian đợi API khởi tạo trên Android (15 giây thay vì 5 giây)
- ✅ Cải thiện error messages cho Android

### 3. index.html (CSP)
- ✅ Cập nhật Content Security Policy để cho phép tất cả Google domains
- ✅ Thêm `child-src` và `worker-src` directives
- ✅ Cho phép `https:` trong `default-src`

### 4. network_security_config.xml
- ✅ Đảm bảo Google domains được cấu hình đúng
- ✅ Thêm trust anchors cho Google certificates

## Cách test

1. **Build lại app**:
   ```bash
   cd Fe_Recruitment/hrm-app_fe
   ionic build
   npx cap sync android
   ```

2. **Mở Android Studio**:
   ```bash
   npx cap open android
   ```

3. **Chạy app trên thiết bị thật hoặc emulator**:
   - Đảm bảo thiết bị có kết nối internet
   - Mở app và thử đăng nhập bằng Google

4. **Kiểm tra logs**:
   - Mở Logcat trong Android Studio
   - Filter theo tag: `MainActivity` hoặc `Capacitor/Console`
   - Tìm các log về Google Sign-In

## Debugging

Nếu vẫn gặp lỗi, kiểm tra:

1. **Internet Connection**: Đảm bảo thiết bị có kết nối internet ổn định
2. **Network Permissions**: Kiểm tra AndroidManifest.xml có `<uses-permission android:name="android.permission.INTERNET" />`
3. **WebView Version**: Đảm bảo thiết bị có WebView mới nhất (Google Play Services)
4. **Logs**: Xem Logcat để tìm lỗi chi tiết

## Lưu ý

- Trên Android WebView, script loading có thể mất nhiều thời gian hơn web browser
- Cần đảm bảo thiết bị có kết nối internet ổn định
- Nếu vẫn lỗi, có thể cần kiểm tra firewall hoặc proxy settings

