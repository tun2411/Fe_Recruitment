# 🔐 Hướng dẫn Setup Google Sign-In cho Ionic-Angular (Web, Android, iOS)

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Bước 1: Cài đặt Dependencies](#bước-1-cài-đặt-dependencies)
3. [Bước 2: Lấy SHA-1 Fingerprint cho Android](#bước-2-lấy-sha-1-fingerprint-cho-android)
4. [Bước 3: Tạo OAuth Client IDs trong Google Console](#bước-3-tạo-oauth-client-ids-trong-google-console)
5. [Bước 4: Cấu hình Code](#bước-4-cấu-hình-code)
6. [Bước 5: Sync và Build](#bước-5-sync-và-build)
7. [Bước 6: Test](#bước-6-test)
8. [Troubleshooting](#troubleshooting)

---

## 📖 Tổng quan

Ionic-Angular là hybrid app framework, có thể chạy trên:
- **Web**: Dùng JavaScript SDK (window.google)
- **Android**: Dùng Capacitor Google Auth plugin với OAuth Client ID riêng
- **iOS**: Dùng Capacitor Google Auth plugin với OAuth Client ID riêng

**Lưu ý quan trọng**: Mỗi platform cần OAuth Client ID riêng trong Google Console.

---

## 📦 Bước 1: Cài đặt Dependencies (Tùy chọn)

### ⚠️ Lưu ý về Plugin Compatibility

**Vấn đề**: `@codetrix-studio/capacitor-google-auth` chỉ tương thích với Capacitor 6, nhưng project đang dùng Capacitor 7.

**Giải pháp**: Có 2 cách:

#### Cách 1: Không cần plugin (Khuyến nghị)

**Web-based approach** hoạt động tốt trên Android/iOS nếu có **Client ID đúng cho từng platform**. Code đã được cấu hình để tự động chọn Client ID đúng.

**Ưu điểm**:
- ✅ Không cần cài plugin
- ✅ Code đơn giản hơn
- ✅ Hoạt động tốt với Client ID đúng
- ✅ Tương thích với Capacitor 7

**Nhược điểm**:
- ⚠️ Cần Client ID riêng cho Android (với SHA-1)

**→ Bỏ qua Bước 1, đi thẳng đến Bước 2 (Lấy SHA-1)**

#### Cách 2: Cài plugin với --legacy-peer-deps

Nếu muốn dùng native plugin (không khuyến nghị vì có thể không ổn định):

```bash
cd Fe_Recruitment/hrm-app_fe
npm install @codetrix-studio/capacitor-google-auth --legacy-peer-deps
npx cap sync android
```

**Lưu ý**: 
- Có thể gây lỗi không tương thích
- Không được maintain tốt cho Capacitor 7

---

## 🔑 Bước 2: Lấy SHA-1 Fingerprint cho Android

SHA-1 fingerprint là **BẮT BUỘC** để tạo OAuth Client ID cho Android. Google dùng nó để verify app của bạn.

### 2.1. Lấy SHA-1 từ Debug Keystore (Development)

#### Windows:

```bash
cd android/app
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

#### Mac/Linux:

```bash
cd android/app
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### Hoặc dùng script có sẵn:

**Windows:**
```bash
get-sha1.bat
```

**Mac/Linux:**
```bash
chmod +x get-sha1.sh
./get-sha1.sh
```

### 2.2. Tìm SHA-1 trong kết quả

Kết quả sẽ có dạng:

```
Certificate fingerprints:
     SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
     SHA256: ...
```

**Copy SHA-1 fingerprint** (dạng `AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD`)

### 2.3. Lấy SHA-1 từ Release Keystore (Production)

Nếu bạn có release keystore:

```bash
keytool -list -v -keystore /path/to/your/keystore.jks -alias your-key-alias
```

**Lưu ý**: 
- Development: Dùng SHA-1 của **debug.keystore**
- Production: Dùng SHA-1 của **release keystore**
- Có thể thêm nhiều SHA-1 vào cùng một OAuth Client ID

---

## 🌐 Bước 3: Tạo OAuth Client IDs trong Google Console

### 3.1. Truy cập Google Cloud Console

1. Mở trình duyệt: https://console.cloud.google.com/
2. Đăng nhập bằng Google account
3. Chọn project của bạn (hoặc tạo project mới)

### 3.2. Tạo OAuth Client ID cho Web

1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Nếu chưa có OAuth consent screen, sẽ được yêu cầu tạo (chọn External → điền thông tin)
4. Chọn **Application type**: **Web application**
5. Điền thông tin:
   - **Name**: `HRM+ Web`
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:4200
     http://localhost:8100
     https://yourdomain.com (nếu có)
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:4200
     http://localhost:4200/
     https://yourdomain.com (nếu có)
     ```
6. Click **Create**
7. **Copy Client ID** (sẽ có dạng: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`)

### 3.3. Tạo OAuth Client ID cho Android

1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Chọn **Application type**: **Android**
4. Điền thông tin:
   - **Name**: `HRM+ Android`
   - **Package name**: `com.hrm.app` (từ AndroidManifest.xml)
   - **SHA-1 certificate fingerprint**: Paste SHA-1 đã lấy ở Bước 2
5. Click **Create**
6. **Copy Client ID**

**Lưu ý**: 
- Package name phải khớp với `appId` trong `capacitor.config.ts`
- Có thể thêm nhiều SHA-1 vào cùng một Client ID (hữu ích khi có nhiều developer)

### 3.4. Tạo OAuth Client ID cho iOS (nếu cần)

1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Chọn **Application type**: **iOS**
4. Điền thông tin:
   - **Name**: `HRM+ iOS`
   - **Bundle ID**: `com.hrm.app` (từ Xcode project)
5. Click **Create**
6. **Copy Client ID**

---

## 💻 Bước 4: Cấu hình Code

### 4.1. Cập nhật GoogleSignInService

Mở file `src/app/services/google-signin.service.ts` và cập nhật:

```typescript
// Thay thế YOUR_ANDROID_CLIENT_ID_HERE bằng Client ID Android vừa tạo
private readonly GOOGLE_CLIENT_ID_ANDROID =
  '123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';

// Thay thế YOUR_IOS_CLIENT_ID_HERE bằng Client ID iOS vừa tạo (nếu có)
private readonly GOOGLE_CLIENT_ID_IOS =
  '123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';
```

**Lưu ý**: 
- Web Client ID đã được config sẵn
- Chỉ cần cập nhật Android và iOS Client IDs

### 4.2. Kiểm tra AppComponent

Đảm bảo `src/app/app.component.ts` đã initialize Google Sign-In:

```typescript
import { GoogleSignInService } from './services/google-signin.service';

export class AppComponent implements OnInit {
  constructor(private googleSignInService: GoogleSignInService) {}

  async ngOnInit() {
    await this.googleSignInService.initialize();
  }
}
```

---

## 🔄 Bước 5: Sync và Build

### 5.1. Build Ionic App

```bash
npm run build
```

### 5.2. Sync với Android

```bash
npx cap sync android
```

### 5.3. Mở Android Studio

```bash
npx cap open android
```

Trong Android Studio:
1. **Clean Project**: `Build` → `Clean Project`
2. **Rebuild Project**: `Build` → `Rebuild Project`
3. **Run app**: Click nút Run (▶️) hoặc `Shift+F10`

### 5.4. Sync với iOS (nếu có)

```bash
npx cap sync ios
npx cap open ios
```

---

## ✅ Bước 6: Test

### 6.1. Test trên Web

```bash
npm start
# Hoặc
ionic serve
```

Mở browser: http://localhost:4200
- Click "Đăng nhập bằng Google"
- Kiểm tra xem có popup Google Sign-In không
- Đăng nhập và kiểm tra xem có nhận được idToken không

### 6.2. Test trên Android

1. Chạy app trên thiết bị/emulator
2. Click "Đăng nhập bằng Google"
3. Kiểm tra xem có dialog Google Sign-In không
4. Đăng nhập và kiểm tra

### 6.3. Kiểm tra Logcat (Android)

Trong Android Studio, mở Logcat và filter:
- Tag: `Capacitor/Console` hoặc `MainActivity`
- Tìm các messages về Google Sign-In

---

## 🔧 Troubleshooting

### Lỗi: "Invalid client ID" hoặc "Error 10"

**Nguyên nhân**: 
- Client ID không đúng cho platform
- SHA-1 fingerprint không khớp
- Package name không khớp

**Giải pháp**:
1. Kiểm tra Client ID trong code có đúng không
2. Kiểm tra SHA-1 có đúng không (lấy lại bằng `get-sha1.bat` hoặc `get-sha1.sh`)
3. Kiểm tra Package name trong Google Console có khớp với `capacitor.config.ts` không

### Lỗi: "Google Sign-In script timeout"

**Nguyên nhân**: 
- Script không load được (chỉ xảy ra trên web)
- Network issues

**Giải pháp**:
1. Kiểm tra internet connection
2. Kiểm tra CSP trong `index.html`
3. Kiểm tra console logs

### Lỗi: "Plugin not found" trên Android/iOS

**Nguyên nhân**: 
- Plugin chưa được sync

**Giải pháp**:
```bash
npm install @codetrix-studio/capacitor-google-auth
npx cap sync android
# Hoặc
npx cap sync ios
```

### Lỗi: "GoogleAuth.initialize is not a function"

**Nguyên nhân**: 
- Plugin chưa được import đúng
- Plugin chưa được sync

**Giải pháp**:
1. Kiểm tra import: `import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';`
2. Sync lại: `npx cap sync android`

### Script không load trên Android WebView

**Nguyên nhân**: 
- WebView settings chưa đúng
- Network security config chưa đúng

**Giải pháp**:
- Đã được xử lý trong `MainActivity.java` và `network_security_config.xml`
- Nếu vẫn lỗi, kiểm tra Logcat để xem lỗi chi tiết

---

## 📝 Checklist

### Trước khi bắt đầu:
- [ ] Đã cài Node.js và npm
- [ ] Đã cài Android Studio (cho Android)
- [ ] Đã cài Xcode (cho iOS, nếu cần)
- [ ] Đã có Google account và truy cập được Google Cloud Console

### Bước 1: Dependencies
- [ ] Đã cài `@codetrix-studio/capacitor-google-auth`
- [ ] Đã sync với Android: `npx cap sync android`

### Bước 2: SHA-1
- [ ] Đã lấy SHA-1 từ debug keystore
- [ ] Đã copy SHA-1 fingerprint (dạng `AA:BB:CC:DD:...`)

### Bước 3: Google Console
- [ ] Đã tạo OAuth Client ID cho Web
- [ ] Đã tạo OAuth Client ID cho Android (với SHA-1 và Package name)
- [ ] Đã tạo OAuth Client ID cho iOS (nếu cần)
- [ ] Đã copy tất cả Client IDs

### Bước 4: Code
- [ ] Đã cập nhật `GOOGLE_CLIENT_ID_ANDROID` trong `google-signin.service.ts`
- [ ] Đã cập nhật `GOOGLE_CLIENT_ID_IOS` trong `google-signin.service.ts` (nếu cần)
- [ ] Đã kiểm tra `app.component.ts` có initialize Google Sign-In

### Bước 5: Build
- [ ] Đã build: `npm run build`
- [ ] Đã sync: `npx cap sync android`
- [ ] Đã mở Android Studio và rebuild project

### Bước 6: Test
- [ ] Test trên Web: Hoạt động ✅
- [ ] Test trên Android: Hoạt động ✅
- [ ] Test trên iOS: Hoạt động ✅ (nếu có)

---

## 🎯 Kết quả mong đợi

Sau khi hoàn thành tất cả các bước:

✅ **Web**: Google Sign-In hoạt động với popup/redirect  
✅ **Android**: Google Sign-In hoạt động với native dialog  
✅ **iOS**: Google Sign-In hoạt động với native dialog (nếu có)  
✅ **Backend**: Nhận được idToken và verify thành công  

---

## 📚 Tài liệu tham khảo

- [Capacitor Google Auth Plugin](https://github.com/CodetrixStudio/CapacitorGoogleAuth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Ionic Framework Documentation](https://ionicframework.com/docs)

---

## 💡 Lưu ý quan trọng

1. **Client ID khác nhau cho mỗi platform**: Web, Android, iOS cần Client ID riêng
2. **SHA-1 fingerprint**: Bắt buộc cho Android, phải đúng với keystore đang dùng
3. **Package name**: Phải khớp giữa Google Console, `capacitor.config.ts`, và `AndroidManifest.xml`
4. **Sync sau mỗi thay đổi**: Luôn chạy `npx cap sync` sau khi thay đổi code hoặc config
5. **Build trước khi sync**: Luôn chạy `npm run build` trước khi `npx cap sync`

---

**Chúc bạn thành công! 🎉**

