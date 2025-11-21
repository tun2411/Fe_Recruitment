# 🔐 Hướng dẫn Setup Facebook Login cho Ionic-Angular

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Bước 1: Tạo Facebook App](#bước-1-tạo-facebook-app)
3. [Bước 2: Cấu hình Facebook App](#bước-2-cấu-hình-facebook-app)
4. [Bước 3: Cập nhật Code](#bước-3-cập-nhật-code)
5. [Bước 4: Test](#bước-4-test)
6. [Troubleshooting](#troubleshooting)

---

## 📖 Tổng quan

Facebook Login cho phép user đăng nhập bằng tài khoản Facebook của họ. Frontend sẽ:
1. Sử dụng Facebook JavaScript SDK để lấy access token
2. Gửi access token lên backend API `/api/auth/facebook`
3. Backend sẽ verify token và tạo JWT token cho user

**Lưu ý**: Cần có Facebook App ID từ Facebook Developers Console.

---

## 📦 Bước 1: Tạo Facebook App

### 1.1. Truy cập Facebook Developers

1. Vào https://developers.facebook.com/
2. Đăng nhập bằng tài khoản Facebook của bạn
3. Click **"My Apps"** → **"Create App"**

### 1.2. Chọn loại App

1. Chọn **"Consumer"** hoặc **"Business"** (tùy mục đích)
2. Click **"Next"**

### 1.3. Điền thông tin App

1. **App Display Name**: Tên hiển thị của app (ví dụ: "HRM+")
2. **App Contact Email**: Email liên hệ
3. Click **"Create App"**

### 1.4. Lấy App ID

1. Sau khi tạo app, bạn sẽ thấy **App ID** và **App Secret**
2. **Lưu lại App ID** (sẽ dùng trong code)
3. **KHÔNG chia sẻ App Secret** công khai

---

## ⚙️ Bước 2: Cấu hình Facebook App

### 2.1. Thêm Facebook Login Product

1. Trong Facebook App Dashboard, tìm **"Add Product"**
2. Tìm **"Facebook Login"** và click **"Set Up"**

### 2.2. Cấu hình Settings

1. Vào **Settings** → **Basic**
2. Điền thông tin:
   - **App Domains**: Domain của bạn (ví dụ: `localhost` cho development)
   - **Privacy Policy URL**: URL chính sách bảo mật (nếu có)
   - **Terms of Service URL**: URL điều khoản (nếu có)

### 2.3. Cấu hình Facebook Login Settings

1. Vào **Products** → **Facebook Login** → **Settings**
2. **Valid OAuth Redirect URIs**: Thêm các URL sau:
   ```
   http://localhost:8100
   http://localhost:4200
   https://yourdomain.com
   ```
   (Thay `yourdomain.com` bằng domain thật của bạn)

3. **Deauthorize Callback URL**: (Optional)
   ```
   https://yourdomain.com/auth/facebook/deauthorize
   ```

### 2.4. Cấu hình Permissions

1. Vào **Products** → **Facebook Login** → **Permissions and Features**
2. Đảm bảo các permissions sau được bật:
   - ✅ `email` (bắt buộc)
   - ✅ `public_profile` (bắt buộc)

### 2.5. Test Users (Optional)

1. Vào **Roles** → **Test Users**
2. Tạo test users để test Facebook Login mà không cần tài khoản Facebook thật

---

## 💻 Bước 3: Cập nhật Code

### 3.1. Cập nhật Facebook App ID

Mở file `src/app/services/facebook-signin.service.ts`:

```typescript
// Tìm dòng này:
private readonly FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID_HERE';

// Thay thế bằng App ID của bạn:
private readonly FACEBOOK_APP_ID = '1234567890123456'; // App ID của bạn
```

### 3.2. Verify Facebook SDK đã được load

Kiểm tra file `src/index.html` đã có Facebook SDK:

```html
<!-- Facebook SDK -->
<script>
  window.fbAsyncInit = function() {
    console.log('Facebook SDK loaded');
  };
</script>
<script async defer crossorigin="anonymous" 
  src="https://connect.facebook.net/en_US/sdk.js"></script>
```

Nếu chưa có, code đã được tự động thêm vào.

---

## ✅ Bước 4: Test

### 4.1. Start Development Server

```bash
cd Fe_Recruitment/hrm-app_fe
npm start
```

### 4.2. Test Facebook Login

1. Mở browser và vào `http://localhost:8100`
2. Click nút **"Đăng nhập bằng Facebook"**
3. Facebook Login popup sẽ xuất hiện
4. Đăng nhập bằng tài khoản Facebook
5. Cho phép app truy cập email và profile
6. Kiểm tra xem có redirect về `/home` không

### 4.3. Test trên Android

1. Build và sync Android:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. Chạy app trên Android device/emulator
3. Test Facebook Login tương tự

---

## 🔧 Troubleshooting

### Lỗi: "Facebook App ID chưa được cấu hình"

**Nguyên nhân**: Chưa cập nhật `FACEBOOK_APP_ID` trong code.

**Giải pháp**: 
1. Mở `src/app/services/facebook-signin.service.ts`
2. Thay `YOUR_FACEBOOK_APP_ID_HERE` bằng App ID thật của bạn

### Lỗi: "Facebook SDK not loaded"

**Nguyên nhân**: Facebook SDK script chưa load hoặc bị block bởi CSP.

**Giải pháp**:
1. Kiểm tra console browser có lỗi gì không
2. Kiểm tra `index.html` đã có Facebook SDK script chưa
3. Kiểm tra CSP trong `index.html` đã cho phép `connect.facebook.net` chưa

### Lỗi: "Invalid OAuth Redirect URI"

**Nguyên nhân**: URL redirect không khớp với cấu hình trong Facebook App.

**Giải pháp**:
1. Vào Facebook App Dashboard
2. **Products** → **Facebook Login** → **Settings**
3. Thêm URL hiện tại vào **Valid OAuth Redirect URIs**

### Lỗi: "User cancelled Facebook login"

**Nguyên nhân**: User đã đóng popup Facebook Login.

**Giải pháp**: Đây không phải lỗi, chỉ cần thông báo cho user biết họ đã cancel.

### Lỗi: "Facebook login failed" từ backend

**Nguyên nhân**: Access token không hợp lệ hoặc backend không verify được.

**Giải pháp**:
1. Kiểm tra backend có đang chạy không
2. Kiểm tra API endpoint `/api/auth/facebook` có hoạt động không
3. Kiểm tra log backend để xem lỗi chi tiết

### Facebook Login không hoạt động trên Android WebView

**Nguyên nhân**: WebView có thể block popup hoặc third-party cookies.

**Giải pháp**:
1. Kiểm tra `MainActivity.java` đã cấu hình WebView đúng chưa:
   - `setJavaScriptEnabled(true)`
   - `setDomStorageEnabled(true)`
   - `setAcceptThirdPartyCookies(true)`

2. Test trên browser trước, nếu hoạt động thì vấn đề là ở WebView config

---

## 📝 Lưu ý quan trọng

1. **App ID vs App Secret**:
   - App ID có thể public (dùng trong frontend)
   - App Secret phải giữ bí mật (chỉ dùng trong backend)

2. **Development vs Production**:
   - Development: Có thể dùng `localhost`
   - Production: Phải cấu hình domain thật trong Facebook App

3. **Permissions**:
   - Chỉ request permissions cần thiết
   - `email` và `public_profile` là đủ cho login

4. **Security**:
   - Luôn verify access token ở backend
   - Không trust access token từ frontend
   - Backend phải gọi Facebook Graph API để verify token

---

## 🎉 Hoàn thành!

Bây giờ bạn đã có Facebook Login hoạt động! User có thể đăng nhập bằng tài khoản Facebook của họ.

Nếu có vấn đề, kiểm tra:
- Facebook App ID đã được cập nhật chưa
- Facebook App Settings đã được cấu hình đúng chưa
- Backend API có hoạt động không
- Console browser có lỗi gì không

