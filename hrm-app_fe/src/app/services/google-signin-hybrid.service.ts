import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

declare global {
  interface Window {
    google: any;
  }
}

/**
 * Hybrid Google Sign-In Service - Best Practice 2025
 * - Web: Google JavaScript SDK (WebView)
 * - Android/iOS: Native plugin @codetrix-studio/capacitor-google-auth
 *
 * Plugin này tự động handle:
 * - Native flow trên Android/iOS
 * - Web fallback khi chạy trong browser
 * - Không cần if (platform) logic phức tạp
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleSignInHybridService {
  private readonly GOOGLE_CLIENT_ID_WEB =
    '314046144776-pfepr9d4bj6btmjfnd4kqjo6qciu5te9.apps.googleusercontent.com';

  private isInitialized = false;

  constructor(private platform: Platform) {}

  /**
   * Initialize Google Sign-In
   * Plugin tự động handle web vs native
   */
  async initialize(): Promise<void> {
    try {
      // Plugin tự động detect platform:
      // - Native (Android/iOS): Dùng native Google Sign-In
      // - Web: Dùng Google JavaScript SDK
      await GoogleAuth.initialize({
        clientId: this.GOOGLE_CLIENT_ID_WEB,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });

      this.isInitialized = true;
      console.log('✅ Google Auth plugin initialized');
    } catch (error) {
      console.error('❌ Google Auth init failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   * Plugin tự động xử lý:
   * - Web: Google popup/prompt
   * - Android: Chrome Custom Tabs (native)
   * - iOS: Safari View Controller (native)
   */
  async signIn(): Promise<string> {
    try {
      console.log('🔐 Starting Google Sign-In...');

      const result = await GoogleAuth.signIn();

      console.log('✅ Google Sign-In success');
      console.log('📧 Email:', result.email);
      console.log('👤 Name:', result.name);
      console.log('📦 Result:', result);

      // Return ID token để gửi cho backend
      // Plugin return structure có thể khác nhau giữa platforms
      const idToken =
        (result as any).authentication?.idToken || (result as any).idToken;

      if (!idToken) {
        console.error('❌ No idToken in result');
        throw new Error('Không nhận được ID token từ Google');
      }

      console.log('✅ ID Token received');
      return idToken;
    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error);

      // Parse error messages
      if (error.error === '12501') {
        throw new Error('User hủy đăng nhập');
      } else if (error.error === '10') {
        throw new Error(
          'SHA-1 fingerprint chưa đúng. Vui lòng check Google Console.'
        );
      } else {
        throw new Error('Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await GoogleAuth.signOut();
      console.log('✅ Google Sign-Out success');
    } catch (error) {
      console.warn('⚠️ Google Sign-Out failed:', error);
    }
  }

  /**
   * Refresh auth token
   */
  async refresh(): Promise<any> {
    try {
      const result = await GoogleAuth.refresh();
      console.log('✅ Google token refreshed');
      const idToken =
        (result as any).authentication?.idToken || (result as any).idToken;
      return idToken;
    } catch (error) {
      console.error('❌ Google refresh failed:', error);
      throw error;
    }
  }

  /**
   * Check if ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
