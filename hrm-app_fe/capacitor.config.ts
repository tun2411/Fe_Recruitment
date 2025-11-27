import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hrm.app',
  appName: 'HRM+',
  webDir: 'www',

  // =====================================================
  // 🔥 LIVE RELOAD MODE (Optional - for faster development)
  // =====================================================
  // Uncomment phần này nếu muốn hot reload khi dev:
  // 1. Chạy: ionic serve --host=0.0.0.0
  // 2. Uncomment phần server bên dưới
  // 3. Thay YOUR_IP bằng IP máy tính (chạy script: .\setup-mobile-ip.ps1)
  // 4. Build: npx cap sync android && npx cap open android
  // =====================================================
  // server: {
  //   url: 'http://192.168.1.9:4200', // ⚠️ THAY YOUR_IP:4200
  //   cleartext: true,
  // },

  android: {
    allowMixedContent: true, // Cho phép HTTP (dev mode)
  },

  server: {
    // Cho phép load từ bất kỳ nguồn nào (bypass CSP issues)
    cleartext: true,
    androidScheme: 'http',
  },
};

export default config;
