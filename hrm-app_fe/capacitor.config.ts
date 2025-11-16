import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hrm.app',
  appName: 'HRM+',
  webDir: 'www',
  // server: {
  //   // Uncomment để test trên Android với dev server (Live Reload)
  //   url: 'http://192.168.1.21:4200', // IP Wi-Fi của máy bạn
  //   cleartext: true,
  // },
  android: {
    allowMixedContent: true,
    // Cấu hình cho Android
  },
};

export default config;
