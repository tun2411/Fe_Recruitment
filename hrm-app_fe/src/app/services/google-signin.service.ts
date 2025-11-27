import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';

// LƯU Ý: @codetrix-studio/capacitor-google-auth chỉ tương thích với Capacitor 6
// Project đang dùng Capacitor 7, nên không dùng plugin
// Sử dụng web-based approach (hoạt động tốt trên web, Android, iOS với Client ID đúng)
// Web-based approach không cần plugin, chỉ cần Google JavaScript SDK (đã load trong index.html)

declare global {
  interface Window {
    google: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleSignInService {
  // Client ID cho Web (development và production)
  private readonly GOOGLE_CLIENT_ID_WEB =
    '314046144776-pfepr9d4bj6btmjfnd4kqjo6qciu5te9.apps.googleusercontent.com';

  // Client ID cho Android - CẦN TẠO TRONG GOOGLE CONSOLE
  // Xem hướng dẫn trong GOOGLE_SIGNIN_SETUP.md
  private readonly GOOGLE_CLIENT_ID_ANDROID =
    '314046144776-8obdffstu3en9ighi2j1khar67d4q9d7.apps.googleusercontent.com';

  // Client ID cho iOS - CẦN TẠO TRONG GOOGLE CONSOLE
  // Xem hướng dẫn trong GOOGLE_SIGNIN_SETUP.md
  private readonly GOOGLE_CLIENT_ID_IOS =
    'YOUR_IOS_CLIENT_ID_HERE.apps.googleusercontent.com';

  private isInitialized = false;
  private currentResolve: ((idToken: string) => void) | null = null;
  private currentReject: ((error: any) => void) | null = null;

  constructor(private platform: Platform) {}

  /**
   * Khởi tạo Google Sign-In
   * - Web: Dùng JavaScript SDK (window.google)
   * - Android/iOS: Dùng Capacitor Google Auth plugin (nếu có) hoặc web-based approach
   */
  async initialize(): Promise<void> {
    const isNative = Capacitor.isNativePlatform();
    const isAndroid = isNative && Capacitor.getPlatform() === 'android';
    const isIOS = isNative && Capacitor.getPlatform() === 'ios';

    // Luôn dùng web-based approach (hoạt động tốt trên web, Android, iOS với Client ID đúng)
    await this.initializeWebAuth();
  }

  // Native auth methods đã được loại bỏ vì plugin không tương thích với Capacitor 7
  // Sử dụng web-based approach cho tất cả platforms (web, Android, iOS)

  /**
   * Khởi tạo Google Sign-In cho web platform
   */
  private async initializeWebAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Kiểm tra nếu Google API đã load
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        console.log('Google Sign-In API already available, initializing...');
        this.initializeGoogleSignInWeb();
        resolve();
        return;
      }

      // Đảm bảo script được load
      console.log('Ensuring Google Sign-In script is loaded...');
      this.ensureGoogleScriptLoaded()
        .then(() => {
          console.log('Google Sign-In script loaded, initializing...');
          this.initializeGoogleSignInWeb();
          resolve();
        })
        .catch((error) => {
          console.error('Failed to load Google Sign-In script:', error);
          reject(error);
        });
    });
  }

  /**
   * Đảm bảo Google Sign-In script được load trên web
   */
  private ensureGoogleScriptLoaded(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Kiểm tra xem Google API đã sẵn sàng chưa
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        console.log('Google Sign-In API already available');
        resolve();
        return;
      }

      // Kiểm tra xem script đã tồn tại chưa
      const existingScript = document.querySelector(
        'script[src*="accounts.google.com/gsi/client"]'
      );

      if (existingScript) {
        // Script đã có, đợi Google API sẵn sàng
        // Tăng timeout cho Android WebView (có thể chậm hơn)
        let attempts = 0;
        const maxAttempts = 300; // 30 giây cho Android WebView (chậm hơn web)
        const checkInterval = setInterval(() => {
          attempts++;
          if (
            window.google &&
            window.google.accounts &&
            window.google.accounts.id
          ) {
            clearInterval(checkInterval);
            console.log(
              '✅ Google Sign-In API loaded after',
              attempts * 100,
              'ms'
            );
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error(
              '❌ Google Sign-In script timeout after',
              maxAttempts * 100,
              'ms'
            );
            console.error(
              '💡 Hãy kiểm tra: 1) Internet connection, 2) SHA-1 fingerprint trong Google Console, 3) Package name đúng'
            );
            reject(
              new Error(
                'Google Sign-In không load được. Vui lòng kiểm tra kết nối internet và thử lại.'
              )
            );
          }
        }, 100);
      } else {
        // Script chưa có, thử load lại
        console.log('Google Sign-In script not found, loading...');
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.type = 'text/javascript';
        script.onload = () => {
          console.log('Google Sign-In script loaded, waiting for API...');
          // Đợi API sẵn sàng sau khi script load
          let attempts = 0;
          const maxAttempts = 300; // 30 giây cho Android
          const checkInterval = setInterval(() => {
            attempts++;
            if (
              window.google &&
              window.google.accounts &&
              window.google.accounts.id
            ) {
              clearInterval(checkInterval);
              console.log(
                '✅ Google Sign-In API ready after',
                attempts * 100,
                'ms'
              );
              resolve();
            } else if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              console.error(
                '❌ Google Sign-In API timeout. Kiểm tra: 1) Internet, 2) SHA-1 fingerprint, 3) Package name'
              );
              reject(
                new Error(
                  'Google Sign-In không khởi tạo được. Vui lòng kiểm tra kết nối internet.'
                )
              );
            }
          }, 100);
        };
        script.onerror = () => {
          console.error('Failed to load Google Sign-In script');
          reject(
            new Error(
              'Failed to load Google Sign-In script. Please check your internet connection.'
            )
          );
        };
        document.head.appendChild(script);
      }
    });
  }

  /**
   * Initialize Google Sign-In cho web
   * Cũng dùng cho Android/iOS nếu không có native plugin
   */
  private initializeGoogleSignInWeb(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      // Lấy Client ID đúng cho platform
      const clientId = this.getClientIdForPlatform();

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          this.handleCredentialResponse(response);
        },
        auto_select: false,
      });
      this.isInitialized = true;
      console.log('Google Sign-In initialized with Client ID:', clientId);
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
      throw error;
    }
  }

  /**
   * Lấy Client ID đúng cho platform hiện tại
   */
  private getClientIdForPlatform(): string {
    const isNative = Capacitor.isNativePlatform();
    const isAndroid = isNative && Capacitor.getPlatform() === 'android';
    const isIOS = isNative && Capacitor.getPlatform() === 'ios';

    if (isAndroid) {
      if (
        this.GOOGLE_CLIENT_ID_ANDROID.includes('YOUR_ANDROID_CLIENT_ID_HERE')
      ) {
        console.warn(
          '⚠️ Android Client ID chưa được config! ' +
            'Vui lòng tạo OAuth Client ID cho Android trong Google Console. ' +
            'Đang sử dụng Web Client ID (có thể không hoạt động).'
        );
        return this.GOOGLE_CLIENT_ID_WEB;
      }
      return this.GOOGLE_CLIENT_ID_ANDROID;
    } else if (isIOS) {
      if (this.GOOGLE_CLIENT_ID_IOS.includes('YOUR_IOS_CLIENT_ID_HERE')) {
        console.warn(
          '⚠️ iOS Client ID chưa được config! ' +
            'Vui lòng tạo OAuth Client ID cho iOS trong Google Console. ' +
            'Đang sử dụng Web Client ID (có thể không hoạt động).'
        );
        return this.GOOGLE_CLIENT_ID_WEB;
      }
      return this.GOOGLE_CLIENT_ID_IOS;
    }

    return this.GOOGLE_CLIENT_ID_WEB;
  }

  /**
   * Handle credential response từ web
   */
  private handleCredentialResponse(response: any): void {
    if (response.credential && this.currentResolve) {
      this.currentResolve(response.credential);
      this.currentResolve = null;
      this.currentReject = null;
    } else if (response.error && this.currentReject) {
      this.currentReject(new Error(response.error));
      this.currentResolve = null;
      this.currentReject = null;
    }
  }

  /**
   * Đăng nhập bằng Google
   * Trả về idToken để gửi lên backend
   * Tương tự như FacebookSignInService.signIn() trả về accessToken
   */
  async signIn(): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Luôn dùng web-based approach (hoạt động tốt trên web, Android, iOS với Client ID đúng)
    return this.signInWeb();
  }

  // Native sign-in method đã được loại bỏ vì plugin không tương thích với Capacitor 7
  // Sử dụng web-based approach cho tất cả platforms

  /**
   * Đăng nhập trên web platform
   */
  private signInWeb(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        this.initialize()
          .then(() => {
            this.performSignInWeb(resolve, reject);
          })
          .catch(reject);
      } else {
        this.performSignInWeb(resolve, reject);
      }
    });
  }

  /**
   * Thực hiện đăng nhập trên web
   * Tương tự như FacebookSignInService.signIn() - trả về token để gửi lên backend
   */
  private performSignInWeb(
    resolve: (idToken: string) => void,
    reject: (error: any) => void
  ): void {
    try {
      // Kiểm tra Google API đã sẵn sàng chưa
      if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
      ) {
        reject(
          new Error('Google Sign-In API chưa sẵn sàng. Vui lòng thử lại sau.')
        );
        return;
      }

      this.currentResolve = resolve;
      this.currentReject = reject;

      // Dùng prompt() thay vì button click cho Android WebView
      // Popup có khả năng hoạt động tốt hơn trong WebView
      const isAndroid =
        Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

      if (isAndroid) {
        console.log(
          '🤖 Android detected: Using prompt() for better WebView compatibility'
        );
        window.google.accounts.id.prompt((notification: any) => {
          console.log('📱 Prompt notification:', notification);
          if (notification.isNotDisplayed()) {
            console.warn(
              '⚠️ Prompt not displayed:',
              notification.getNotDisplayedReason()
            );
          }
          if (notification.isSkippedMoment()) {
            console.warn('⚠️ Prompt skipped:', notification.getSkippedReason());
          }
          if (notification.isDismissedMoment()) {
            console.warn(
              '⚠️ Prompt dismissed:',
              notification.getDismissedReason()
            );
            // Fallback to button click if prompt dismissed
            this.fallbackToButtonClick(resolve, reject);
          }
        });
        return;
      }

      // Tạo button container ẩn
      let buttonContainer = document.getElementById(
        'google-signin-trigger-container'
      );
      if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.id = 'google-signin-trigger-container';
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '-9999px';
        buttonContainer.style.left = '-9999px';
        buttonContainer.style.width = '1px';
        buttonContainer.style.height = '1px';
        buttonContainer.style.overflow = 'hidden';
        document.body.appendChild(buttonContainer);
      }

      buttonContainer.innerHTML = '';

      // Lấy Client ID đúng cho platform
      const clientId = this.getClientIdForPlatform();

      // Render Google button với Client ID đúng
      window.google.accounts.id.renderButton(buttonContainer, {
        client_id: clientId, // Đảm bảo dùng Client ID đúng
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        locale: 'vi',
        width: '300',
      });

      // Click button sau khi render (fallback cho web)
      setTimeout(() => {
        this.fallbackToButtonClick(resolve, reject);
      }, 300);
    } catch (error: any) {
      console.error('Error performing Google Sign-In:', error);
      reject(error);
    }
  }

  /**
   * Fallback method: Click hidden button
   */
  private fallbackToButtonClick(
    resolve: (idToken: string) => void,
    reject: (error: any) => void
  ): void {
    const buttonContainer = document.getElementById(
      'google-signin-trigger-container'
    );
    if (!buttonContainer) {
      reject(new Error('Google Sign-In button container not found'));
      return;
    }

    const googleButton = buttonContainer.querySelector(
      'div[role="button"]'
    ) as HTMLElement;
    if (googleButton) {
      console.log('🖱️ Clicking Google Sign-In button...');
      googleButton.click();
    } else {
      // Final fallback: dùng prompt
      console.log('📱 Button not found, using prompt fallback...');
      window.google.accounts.id.prompt((notification: any) => {
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.isDismissedMoment()
        ) {
          reject(
            new Error(
              'Không thể hiển thị Google Sign-In. Vui lòng kiểm tra internet và thử lại.'
            )
          );
        }
      });
    }
  }

  /**
   * Kiểm tra xem Google Sign-In đã sẵn sàng chưa
   */
  isReady(): boolean {
    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      return this.isInitialized;
    } else {
      return (
        this.isInitialized &&
        !!(window.google && window.google.accounts && window.google.accounts.id)
      );
    }
  }
}
