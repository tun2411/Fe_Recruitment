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

  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '314046144776-pfepr9d4bj6btmjfnd4kqjo6qciu5te9.apps.googleusercontent.com', // Web Client ID (fallback)
      androidClientId: '314046144776-8obdffstu3en9ighi2j1khar67d4q9d7.apps.googleusercontent.com', // Android Client ID
      serverClientId: '314046144776-pfepr9d4bj6btmjfnd4kqjo6qciu5te9.apps.googleusercontent.com', // Server Client ID for offline access
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
