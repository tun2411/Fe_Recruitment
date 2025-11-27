# CV View & Download - Hybrid App Solution

## 📋 Tổng quan

Giải pháp tối ưu cho xem và tải CV trên hybrid app (Android/iOS) sử dụng Capacitor plugins.

## 🔧 Vấn đề

- **Web**: `window.open()` và `document.createElement('a')` hoạt động tốt
- **Hybrid App**: Không hoạt động vì:
  - WebView không hỗ trợ đầy đủ browser APIs
  - URL `localhost` không đúng trên mobile device
  - Blob download không lưu được vào device storage

## ✅ Giải pháp

### 1. **Xem CV (View)**

**Trên Mobile:**

- Dùng `@capacitor/browser` để mở PDF trong browser mặc định
- Tự động fix URL: thay `localhost` → IP thực tế (`192.168.1.10`)

**Trên Web:**

- Dùng blob approach: download → tạo blob URL → `window.open()`

### 2. **Tải CV (Download)**

**Trên Mobile:**

- Dùng `@capacitor/filesystem` để lưu file vào Documents directory
- Convert blob → base64 → lưu file

**Trên Web:**

- Dùng blob approach: tạo `<a>` tag → trigger download

## 📦 Plugins đã cài

```json
{
  "@capacitor/browser": "^7.0.2",
  "@capacitor/filesystem": "^7.1.5"
}
```

## 🔨 Implementation

### Helper Function

```typescript
private fixUrlForMobile(url: string): string {
  if (!Capacitor.isNativePlatform()) {
    return url; // Web: giữ nguyên
  }

  // Mobile: Thay localhost bằng IP từ environment
  // Extract IP từ apiUrl: http://192.168.1.10:8080/api -> 192.168.1.10
  const apiUrl = environment.apiUrl;
  const ipMatch = apiUrl.match(/http:\/\/([^:]+):/);
  if (ipMatch && ipMatch[1]) {
    const ip = ipMatch[1];
    return url.replace(/http:\/\/localhost:8080/g, `http://${ip}:8080`);
  }

  // Fallback: dùng IP mặc định
  return url.replace(/http:\/\/localhost:8080/g, 'http://192.168.1.10:8080');
}
```

### View CV

```typescript
async onViewCV() {
  let viewUrl = cvUrl.replace('/cv/download?', '/cv/view?');
  viewUrl = this.fixUrlForMobile(viewUrl);

  // Mobile: Dùng Browser plugin
  if (Capacitor.isNativePlatform()) {
    await Browser.open({
      url: viewUrl,
      windowName: '_system',
    });
    return;
  }

  // Web: Dùng blob approach
  // ... blob download và window.open()
}
```

### Download CV

```typescript
async onDownloadCV() {
  let downloadUrl = cvUrl.replace('/cv/view?', '/cv/download?');
  downloadUrl = this.fixUrlForMobile(downloadUrl);

  // Download blob
  this.http.get(downloadUrl, { responseType: 'blob' }).subscribe({
    next: async (blob) => {
      // Mobile: Lưu vào Filesystem
      if (Capacitor.isNativePlatform()) {
        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];

          // ⚠️ QUAN TRỌNG: KHÔNG dùng encoding cho binary file (PDF)
          await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents,
            // KHÔNG set encoding parameter cho PDF
          });
        };
        reader.readAsDataURL(blob);
      } else {
        // Web: Trigger download
        // ... create <a> tag và click()
      }
    }
  });
}
```

**⚠️ Lưu ý quan trọng:**

- PDF là **binary file**, không phải text file
- **KHÔNG** dùng `encoding: Encoding.UTF8` khi lưu PDF
- Chỉ cần convert blob → base64 và lưu trực tiếp

## 🚀 Cách sử dụng

1. **Build và sync:**

   ```bash
   ng build
   npx cap sync android
   ```

2. **Test trên Android:**

   - Xem CV: Mở trong browser mặc định
   - Tải CV: Lưu vào Documents folder

3. **Test trên Web:**
   - Xem CV: Mở trong tab mới
   - Tải CV: Download như file thông thường

## 📝 Lưu ý

- **IP Configuration**: IP được tự động lấy từ `environment.apiUrl`, không cần hardcode
- **Backend**: Backend phải chạy với profile mobile và cho phép CORS
- **Permissions**: Android tự động có quyền ghi file vào Documents (không cần request)
- **File Location**: CV được lưu vào Documents folder, có thể truy cập qua file manager
- **PDF Format**: ⚠️ **KHÔNG dùng `encoding` parameter** khi lưu PDF (binary file). Chỉ cần convert blob → base64 và lưu trực tiếp
- **File Viewing**: File PDF sau khi tải có thể mở bằng bất kỳ PDF viewer nào trên điện thoại (Google Drive, Adobe Reader, v.v.)

## 🔍 Debug

Nếu gặp lỗi:

1. Kiểm tra log: `adb logcat | findstr "ApplicationDetail"`
2. Kiểm tra URL: Đảm bảo không còn `localhost` trên mobile
3. Kiểm tra network: Đảm bảo device và máy tính cùng mạng

## 📱 Tương thích

- ✅ Android (đã test)
- ✅ iOS (tương thích, chưa test)
- ✅ Web Browser (hoạt động như cũ)
