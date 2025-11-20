# Sửa lỗi màn hình trắng trên Android

## Vấn đề
- App hiển thị màn hình trắng trên Android
- Logcat không chạy được
- Webapp chạy tốt nhưng khi sync sang Android lại lỗi

## Nguyên nhân chính

### 1. MainActivity override WebViewClient/WebChromeClient
**Vấn đề**: MainActivity đang override `WebViewClient` và `WebChromeClient`, điều này **conflict với Capacitor Bridge**. Capacitor cần các clients riêng của nó để:
- Xử lý navigation và routing
- Xử lý JavaScript bridge
- Xử lý console logs
- Xử lý file access

**Giải pháp**: Chỉ config `WebSettings`, không override clients.

### 2. Timing issues
**Vấn đề**: Config WebView quá sớm, trước khi Capacitor Bridge khởi tạo xong.

**Giải pháp**: Đợi Bridge khởi tạo xong trước khi config.

## Các thay đổi đã thực hiện

### 1. MainActivity.java - Đơn giản hóa
✅ **Xóa**: Override `WebViewClient` và `WebChromeClient`  
✅ **Giữ lại**: Chỉ config `WebSettings` (JavaScript, DOM storage, cookies, etc.)  
✅ **Cải thiện**: Timing - đợi Bridge khởi tạo xong

### 2. Scripts reset Android
✅ Tạo `reset-android.sh` (Linux/Mac)  
✅ Tạo `reset-android.bat` (Windows)

## Cách sửa lỗi

### Cách 1: Sử dụng script tự động (Khuyến nghị)

**Windows:**
```bash
cd Fe_Recruitment/hrm-app_fe
reset-android.bat
```

**Linux/Mac:**
```bash
cd Fe_Recruitment/hrm-app_fe
chmod +x reset-android.sh
./reset-android.sh
```

### Cách 2: Thủ công

1. **Xóa thư mục android:**
   ```bash
   cd Fe_Recruitment/hrm-app_fe
   rmdir /s /q android  # Windows
   # hoặc
   rm -rf android       # Linux/Mac
   ```

2. **Build lại Angular app:**
   ```bash
   npm run build
   ```

3. **Add Android platform lại:**
   ```bash
   npx cap add android
   ```

4. **Sync với Android:**
   ```bash
   npx cap sync android
   ```

5. **Mở Android Studio:**
   ```bash
   npx cap open android
   ```

## Kiểm tra sau khi sửa

1. **Build thành công**: Không có lỗi compile
2. **App chạy được**: Không còn màn hình trắng
3. **Logcat hoạt động**: Có thể xem logs
4. **Navigation hoạt động**: Có thể navigate giữa các pages

## Debug nếu vẫn lỗi

### 1. Kiểm tra build output
```bash
# Đảm bảo www folder có đầy đủ files
ls www/
# Phải có: index.html, main-*.js, polyfills-*.js, styles-*.css
```

### 2. Kiểm tra Logcat
```bash
# Trong Android Studio, mở Logcat và filter:
# Tag: MainActivity hoặc Capacitor
```

### 3. Kiểm tra WebView
- Đảm bảo WebView đã được cập nhật (qua Google Play Services)
- Test trên thiết bị thật thay vì emulator

### 4. Kiểm tra Capacitor version
```bash
npm list @capacitor/core @capacitor/android
# Phải cùng version (7.4.4)
```

## Lưu ý quan trọng

1. **KHÔNG override WebViewClient/WebChromeClient** trong MainActivity
   - Capacitor cần các clients riêng để hoạt động
   - Nếu cần custom behavior, extend từ Capacitor's clients

2. **Timing**: Luôn đợi Bridge khởi tạo xong trước khi config WebView

3. **Build trước khi sync**: Luôn chạy `npm run build` trước khi `npx cap sync`

4. **Clean build**: Nếu vẫn lỗi, thử:
   ```bash
   npm run build -- --configuration production
   npx cap sync android
   ```

## Nếu vẫn không được

1. Xóa `node_modules` và reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Xóa `.angular` cache:
   ```bash
   rm -rf .angular
   npm run build
   ```

3. Kiểm tra `capacitor.config.ts`:
   - `webDir` phải là `"www"`
   - `appId` phải đúng

4. Kiểm tra `angular.json`:
   - `outputPath` phải là `"www"`

