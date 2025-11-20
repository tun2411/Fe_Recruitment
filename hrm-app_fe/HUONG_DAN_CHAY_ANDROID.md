# 📱 Hướng dẫn Chạy App trên Android

## ⚠️ QUAN TRỌNG: Cấu hình IP trước khi chạy!

### Bước 0: Lấy IP Address của máy tính

1. **Windows**:

   ```cmd
   ipconfig
   ```

   Tìm dòng **IPv4 Address** (ví dụ: `192.168.1.100`)

2. **Mac/Linux**:
   ```bash
   ifconfig
   # hoặc
   ip addr
   ```
   Tìm IP của Wi-Fi adapter (ví dụ: `192.168.1.100`)

### Bước 1: Cập nhật IP trong code

Mở file `src/environments/environment.ts` và tìm dòng **15** (có comment rõ ràng):

```typescript
// =====================================================
// ⚠️ BƯỚC 2: CẬP NHẬT IP CỦA MÁY TÍNH BẠN Ở ĐÂY!
// =====================================================
const YOUR_COMPUTER_IP = "192.168.1.100"; // ⚠️ THAY ĐỔI IP NÀY THÀNH IP CỦA BẠN!
// =====================================================
```

**Thay đổi `'192.168.1.100'` thành IP của bạn**

**Ví dụ**: Nếu IP của bạn là `192.168.1.50`, thì:

```typescript
const YOUR_COMPUTER_IP = "192.168.1.50"; // ⚠️ THAY ĐỔI IP NÀY THÀNH IP CỦA BẠN!
```

**Lưu ý**: Dòng này nằm ở **đầu file**, ngay sau các comment, rất dễ tìm thấy!

---

## 🚀 Cách 1: Build Native App (Khuyến nghị)

### Bước 1: Đảm bảo Backend đang chạy

```bash
cd BE/BE
mvn spring-boot:run
```

**Kiểm tra**: Mở browser → `http://localhost:8080/api/auth/test/fake-token` → Phải trả về JSON

### Bước 2: Build Frontend

```bash
cd Fe_Recruitment/hrm-app_fe

# Build production
ng build

# Sync với Android
npx cap sync android
```

### Bước 3: Mở Android Studio

```bash
npx cap open android
```

### Bước 4: Chạy trên thiết bị/emulator

**Trong Android Studio:**

1. **Kết nối thiết bị**:

   - Kết nối điện thoại Android qua USB
   - Bật **USB Debugging** trên điện thoại:
     - Settings → About phone → Tap "Build number" 7 lần
     - Settings → Developer options → Bật "USB debugging"
   - Hoặc tạo Android Emulator trong Android Studio

2. **Chọn thiết bị**:

   - Click dropdown thiết bị ở thanh toolbar
   - Chọn điện thoại hoặc emulator của bạn

3. **Chạy app**:
   - Click nút **Run** (▶️) hoặc nhấn `Shift + F10`
   - App sẽ được build và cài đặt trên thiết bị

### Bước 5: Kiểm tra kết nối

1. **Đảm bảo điện thoại và máy tính cùng mạng WiFi**
2. **Kiểm tra firewall**: Tắt Windows Firewall tạm thời nếu cần
3. **Test API**: Mở app → Đăng nhập → Kiểm tra xem có load được jobs không

---

## 🔄 Cách 2: Live Reload (Development)

### Bước 1: Cấu hình Capacitor

Mở file `capacitor.config.ts` và uncomment:

```typescript
server: {
  url: 'http://192.168.1.100:4200', // Thay bằng IP của bạn
  cleartext: true,
},
```

### Bước 2: Chạy Dev Server

**Terminal 1** (Backend):

```bash
cd BE/BE
mvn spring-boot:run
```

**Terminal 2** (Frontend Dev Server):

```bash
cd Fe_Recruitment/hrm-app_fe
ng serve --host=0.0.0.0
```

### Bước 3: Build và Sync

**Terminal 3**:

```bash
cd Fe_Recruitment/hrm-app_fe
ng build
npx cap sync android
npx cap open android
```

### Bước 4: Chạy trong Android Studio

- Chọn thiết bị
- Click Run (▶️)
- App sẽ load từ dev server, thay đổi code sẽ tự động reload

---

## 🛠️ Troubleshooting

### ❌ Lỗi: "Cannot connect to API"

**Nguyên nhân**: IP không đúng hoặc backend chưa chạy

**Giải pháp**:

1. Kiểm tra IP trong `environment.ts` có đúng không
2. Kiểm tra backend có đang chạy không: `http://localhost:8080/api/auth/test/fake-token`
3. Đảm bảo điện thoại và máy tính cùng WiFi
4. Tắt firewall tạm thời

### ❌ Lỗi: "Cleartext HTTP not permitted"

**Đã được fix**: File `network_security_config.xml` đã được tạo và cấu hình trong `AndroidManifest.xml`

Nếu vẫn lỗi, kiểm tra:

- `android/app/src/main/res/xml/network_security_config.xml` có tồn tại không
- `AndroidManifest.xml` có dòng `android:networkSecurityConfig="@xml/network_security_config"` không

### ❌ Lỗi: "USB Debugging not enabled"

**Trên điện thoại Android**:

1. Settings → About phone
2. Tap "Build number" **7 lần** để bật Developer options
3. Settings → Developer options
4. Bật **USB debugging**
5. Kết nối lại USB

### ❌ Lỗi: "Device not recognized"

**Giải pháp**:

1. Cài đặt USB driver cho điện thoại (Samsung, Xiaomi, etc.)
2. Hoặc dùng **Wireless debugging** (Android 11+):
   - Settings → Developer options → Wireless debugging
   - Pair device với Android Studio

### ❌ Lỗi: "Android platform not found"

```bash
cd Fe_Recruitment/hrm-app_fe
npx cap add android
npx cap sync android
```

### ❌ Lỗi: "Gradle sync failed"

**Giải pháp**:

1. Mở Android Studio
2. File → Invalidate Caches / Restart
3. Sync lại project

---

## 📋 Checklist trước khi chạy

- [ ] Đã lấy IP address của máy tính
- [ ] Đã cập nhật IP trong `environment.ts`
- [ ] Backend đang chạy tại `http://localhost:8080`
- [ ] Đã build frontend: `ng build`
- [ ] Đã sync với Android: `npx cap sync android`
- [ ] Điện thoại và máy tính cùng mạng WiFi
- [ ] USB Debugging đã bật trên điện thoại
- [ ] Android Studio đã cài đặt và cấu hình

---

## 🎯 Quick Commands

```bash
# Build và sync
ng build && npx cap sync android

# Mở Android Studio
npx cap open android

# Xem log từ thiết bị
adb logcat | grep -i "capacitor\|ionic\|angular"

# Kiểm tra thiết bị đã kết nối
adb devices
```

---

## 💡 Tips

1. **Lần đầu chạy**: Có thể mất 5-10 phút để Gradle download dependencies
2. **Hot Reload**: Trong Android Studio, dùng "Apply Changes" (⚡) để reload nhanh
3. **Debug**: Dùng Chrome DevTools để debug:
   - Chrome → `chrome://inspect` → Tìm thiết bị → Inspect
4. **Network**: Nếu đổi WiFi, nhớ cập nhật lại IP trong `environment.ts`

---

## ✅ Kết quả mong đợi

Sau khi chạy thành công:

1. App mở trên điện thoại
2. Hiển thị màn hình login
3. Đăng nhập bằng Google thành công
4. Hiển thị danh sách jobs (Jobs 5, 6, 7)
5. Có thể xem chi tiết job và danh sách ứng viên

---

## 🆘 Cần giúp đỡ?

Nếu gặp lỗi, kiểm tra:

1. Console logs trong Android Studio (Logcat)
2. Network requests trong Chrome DevTools (nếu có thể)
3. Backend logs trong terminal
4. IP address có đúng không

Chúc bạn thành công! 🎉
