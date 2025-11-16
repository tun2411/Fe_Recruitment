# Hướng dẫn Test App trên Android

## Cách 1: Live Reload (Khuyến nghị cho Development)

### Bước 1: Lấy IP address của máy tính

- Windows: Mở CMD và chạy `ipconfig`, tìm IPv4 Address
- Mac/Linux: Chạy `ifconfig` hoặc `ip addr`
- IP thường có dạng: `192.168.1.X` hoặc `192.168.0.X`

### Bước 2: Cấu hình Capacitor để dùng dev server

Mở file `capacitor.config.ts` và uncomment phần server:

```typescript
server: {
  url: 'http://192.168.1.21:4200', // Thay bằng IP của bạn
  cleartext: true
}
```

### Bước 3: Build và sync với Android

```bash
# Build app
ionic build

# Add Android platform (chỉ lần đầu)
npx cap add android

# Sync code với Android
npx cap sync android
```

### Bước 4: Chạy dev server

```bash
# Terminal 1: Chạy dev server (cho phép truy cập từ mạng)
ionic serve --host=0.0.0.0

# Hoặc
ng serve --host=0.0.0.0
```

### Bước 5: Mở Android Studio và chạy app

```bash
# Mở Android Studio
npx cap open android

# Trong Android Studio:
# 1. Kết nối điện thoại Android qua USB (bật USB Debugging)
# 2. Chọn thiết bị từ dropdown
# 3. Click nút Run (▶️) hoặc Shift+F10
```

### Bước 6: Đảm bảo điện thoại và máy tính cùng mạng WiFi

- Điện thoại và máy tính phải cùng mạng WiFi
- Nếu không được, tắt firewall tạm thời

---

## Cách 2: Build Native App (Giống Production)

### Bước 1: Comment lại server config

Trong `capacitor.config.ts`, comment lại phần server:

```typescript
server: {
  // url: 'http://192.168.1.21:4200',
  // cleartext: true
}
```

### Bước 2: Build production

```bash
# Build production
ionic build --prod

# Hoặc
ng build --configuration production
```

### Bước 3: Sync với Android

```bash
npx cap sync android
```

### Bước 4: Mở và chạy trong Android Studio

```bash
npx cap open android
```

Trong Android Studio:

- Kết nối điện thoại qua USB
- Chọn thiết bị
- Click Run (▶️)

---

## Troubleshooting

### Lỗi: "Cannot connect to dev server"

1. Kiểm tra IP address có đúng không
2. Đảm bảo điện thoại và máy tính cùng WiFi
3. Tắt firewall tạm thời
4. Kiểm tra port 4200 có bị block không

### Lỗi: "Cleartext HTTP not permitted"

- Đảm bảo `cleartext: true` trong `capacitor.config.ts`
- Hoặc dùng HTTPS (phức tạp hơn)

### Lỗi: "Android platform not found"

```bash
npx cap add android
npx cap sync android
```

### Lỗi: "USB Debugging not enabled"

Trên điện thoại Android:

1. Vào Settings > About phone
2. Tap "Build number" 7 lần để bật Developer options
3. Vào Settings > Developer options
4. Bật "USB debugging"

### Lỗi: "Device not recognized"

1. Cài đặt USB driver cho điện thoại (Samsung, Xiaomi, etc.)
2. Hoặc dùng Wireless debugging (Android 11+)

---

## Lệnh nhanh (Quick Commands)

```bash
# Build và sync
ionic build && npx cap sync android

# Mở Android Studio
npx cap open android

# Chạy trực tiếp (nếu đã setup)
ionic cap run android

# Xem log
npx cap run android --livereload --external
```

---

## Tips

1. **Live Reload**: Dùng Cách 1 khi đang development, thay đổi code sẽ tự động reload trên điện thoại
2. **Production Build**: Dùng Cách 2 để test giống như app thật
3. **Hot Reload**: Trong Android Studio, có thể dùng "Apply Changes" (⚡) để reload nhanh hơn
4. **Network**: Đảm bảo cả máy tính và điện thoại cùng mạng WiFi cho Live Reload
