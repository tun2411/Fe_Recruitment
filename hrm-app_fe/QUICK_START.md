# Hướng dẫn chạy ứng dụng HRM+ trên Android Studio

## ✅ Các bước đã hoàn thành:
1. ✅ Cài đặt dependencies (`npm install`)
2. ✅ Build Angular application (`npm run build`)
3. ✅ Sync với Android platform (`npx cap sync android`)
4. ✅ Mở Android Studio project

## 📱 Các bước tiếp theo trong Android Studio:

### Bước 1: Đợi Android Studio sync project
- Android Studio sẽ tự động sync Gradle khi mở project
- Đợi cho đến khi thấy "Gradle sync finished" ở thanh trạng thái dưới cùng

### Bước 2: Kết nối thiết bị Android

**Cách 1: Kết nối qua USB**
1. Bật **USB Debugging** trên điện thoại:
   - Vào **Settings** > **About phone**
   - Tap **Build number** 7 lần để bật Developer options
   - Vào **Settings** > **Developer options**
   - Bật **USB debugging**
2. Kết nối điện thoại với máy tính qua USB
3. Chấp nhận "Allow USB debugging" trên điện thoại

**Cách 2: Wireless Debugging (Android 11+)**
1. Vào **Settings** > **Developer options**
2. Bật **Wireless debugging**
3. Chọn **Pair device with pairing code**
4. Trong Android Studio, chọn **Pair Device Using Wi-Fi**

### Bước 3: Chọn thiết bị
- Ở thanh toolbar trên cùng, chọn thiết bị từ dropdown (bên cạnh nút Run ▶️)
- Nếu không thấy thiết bị, click vào dropdown và chọn lại

### Bước 4: Chạy ứng dụng
1. Click nút **Run** (▶️) hoặc nhấn **Shift + F10**
2. Hoặc vào menu **Run** > **Run 'app'**

### Bước 5: Đợi build và cài đặt
- Android Studio sẽ:
  - Build APK
  - Cài đặt app lên thiết bị
  - Tự động mở app

## 🔄 Cập nhật code sau khi chỉnh sửa:

### Nếu chỉnh sửa TypeScript/HTML/SCSS:
```bash
# Terminal 1: Build lại Angular app
npm run build

# Terminal 2: Sync với Android
npx cap sync android
```

Sau đó trong Android Studio:
- Click nút **Apply Changes** (⚡) để reload nhanh
- Hoặc chạy lại app (▶️)

### Nếu chỉnh sửa native Android code:
- Chỉ cần chạy lại app trong Android Studio (không cần sync)

## 🐛 Troubleshooting:

### Lỗi: "Device not found"
- Kiểm tra USB debugging đã bật chưa
- Thử rút và cắm lại USB
- Chạy: `adb devices` để kiểm tra thiết bị

### Lỗi: "Gradle sync failed"
- Vào **File** > **Invalidate Caches** > **Invalidate and Restart**
- Hoặc: **File** > **Sync Project with Gradle Files**

### Lỗi: "SDK not found"
- Vào **File** > **Project Structure** > **SDK Location**
- Cài đặt Android SDK nếu chưa có

### App không chạy được
- Kiểm tra logcat trong Android Studio (tab dưới cùng)
- Xem lỗi cụ thể và tìm kiếm giải pháp

## 📝 Lưu ý:

1. **API Backend**: App đang cấu hình kết nối với `http://localhost:8080/api`
   - Nếu backend chạy trên máy khác, cần cập nhật IP trong `environment.ts`
   - Để test trên Android, không dùng `localhost`, dùng IP thực của máy

2. **Live Reload**: Để dùng Live Reload (tự động reload khi code thay đổi):
   - Uncomment phần `server` trong `capacitor.config.ts`
   - Chạy `npm start` hoặc `ng serve --host=0.0.0.0`
   - Đảm bảo điện thoại và máy tính cùng WiFi

3. **Build Production**: 
   ```bash
   npm run build -- --configuration production
   npx cap sync android
   ```

## 🎉 Chúc bạn thành công!

Nếu gặp vấn đề, kiểm tra file `TEST_ANDROID.md` để biết thêm chi tiết.

