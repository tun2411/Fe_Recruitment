// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// Import Capacitor để detect platform
import { Capacitor } from '@capacitor/core';

// =====================================================
// ⚠️ BƯỚC 2: CẬP NHẬT IP CỦA MÁY TÍNH BẠN Ở ĐÂY!
// =====================================================
// Để lấy IP:
//   - Windows: Mở CMD và chạy `ipconfig`, tìm IPv4 Address
//   - Mac/Linux: Chạy `ifconfig` hoặc `ip addr`
// IP thường có dạng: 192.168.1.X hoặc 192.168.0.X
// =====================================================
const YOUR_COMPUTER_IP = '192.168.1.10'; // ⚠️ THAY ĐỔI IP NÀY THÀNH IP CỦA BẠN!
// =====================================================

// Tự động detect platform và set API URL
function getApiUrl(): string {
  // FORCE sử dụng proxy cho web development
  // Chỉ dùng full URL khi thực sự chạy trên native (Android/iOS)

  // Kiểm tra xem có đang chạy trên web browser không
  if (typeof window !== 'undefined') {
    // Kiểm tra xem có đang chạy trên native platform không
    // Chỉ dùng full URL nếu thực sự chạy trên native (Android/iOS)
    try {
      // Kiểm tra xem có Capacitor platform không
      // Sử dụng Capacitor.isNativePlatform() từ import
      if (Capacitor.isNativePlatform()) {
        const platform = Capacitor.getPlatform();
        // Chỉ dùng full URL nếu thực sự là android hoặc ios
        if (platform === 'android' || platform === 'ios') {
          // Native platform (Android/iOS) - dùng full URL với IP
          console.log('[Environment] Using native platform URL:', platform);
          return `http://${YOUR_COMPUTER_IP}:8080/api`;
        }
      }
    } catch (e) {
      // Nếu có lỗi khi check Capacitor, coi như web browser
      // Không log để tránh spam console
    }

    // Web browser - LUÔN sử dụng proxy (relative URL)
    // Proxy sẽ forward đến http://localhost:8080/api
    // Đảm bảo luôn dùng relative URL để proxy hoạt động
    return '/api';
  }

  // Fallback: sử dụng proxy cho web
  return '/api';
}

export const environment = {
  production: false,
  apiUrl: getApiUrl(),
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
