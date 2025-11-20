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
const YOUR_COMPUTER_IP = '192.168.1.9'; // ⚠️ THAY ĐỔI IP NÀY THÀNH IP CỦA BẠN!
// =====================================================

// Tự động detect platform và set API URL
function getApiUrl(): string {
  // Nếu chạy trên Android/iOS (Capacitor)
  if (Capacitor.isNativePlatform()) {
    return `http://${YOUR_COMPUTER_IP}:8080/api`;
  }

  // Nếu chạy trên web browser (development)
  // Sử dụng proxy hoặc localhost
  return '/api'; // Proxy sẽ forward đến http://localhost:8080/api
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
