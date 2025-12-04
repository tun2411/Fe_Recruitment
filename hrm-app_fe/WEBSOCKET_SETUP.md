# Hướng dẫn cài đặt WebSocket Dependencies

## Vấn đề
TypeScript báo lỗi `Cannot find module '@stomp/stompjs'` mặc dù đã thêm vào `package.json`.

## Giải pháp

### Bước 1: Xóa node_modules và package-lock.json (nếu cần)
```bash
cd "d:\HRM PROJECT\hrm-app_fe"
rmdir /s /q node_modules
del package-lock.json
```

### Bước 2: Cài đặt lại tất cả dependencies
```bash
npm install
```

### Bước 3: Kiểm tra packages đã được cài đặt
```bash
npm list @stomp/stompjs sockjs-client
```

Nếu vẫn không thấy, thử:
```bash
npm install @stomp/stompjs@7.0.0 sockjs-client@1.6.1 --save --legacy-peer-deps
```

### Bước 4: Restart TypeScript Server
- Trong VS Code/Cursor: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- Hoặc đóng và mở lại IDE

### Bước 5: Kiểm tra lại
Sau khi cài đặt, kiểm tra xem có thư mục:
- `node_modules/@stomp/stompjs/`
- `node_modules/sockjs-client/`

## Lưu ý
- Type declarations tạm thời đã được tạo trong `src/types/` để TypeScript không báo lỗi
- Nhưng khi chạy ứng dụng, vẫn cần packages thực sự trong `node_modules`
- Nếu vẫn gặp vấn đề, có thể do:
  - Network issues
  - npm registry issues
  - Permissions issues

## Alternative: Sử dụng yarn
Nếu npm không hoạt động, thử yarn:
```bash
yarn add @stomp/stompjs sockjs-client
```
