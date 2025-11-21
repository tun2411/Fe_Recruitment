import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

@Injectable({
  providedIn: 'root',
})
export class FacebookSignInService {
  // Facebook App ID - CẦN TẠO TRONG FACEBOOK DEVELOPERS
  // TODO: Thay thế bằng App ID của bạn sau khi tạo trong Facebook Developers Console
  private readonly FACEBOOK_APP_ID = '1418777956471770';

  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Khởi tạo Facebook SDK khi service được tạo
    this.ensureFacebookSDKLoaded();
  }

  /**
   * Khởi tạo Facebook SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Kiểm tra xem Facebook SDK đã load chưa
      if (window.FB) {
        this.initFacebookSDK()
          .then(() => {
            this.isInitialized = true;
            resolve();
          })
          .catch(reject);
        return;
      }

      // Đợi Facebook SDK load
      const maxWaitTime = 10000; // 10 giây
      const checkInterval = 100;
      let attempts = 0;
      const maxAttempts = Math.floor(maxWaitTime / checkInterval);

      const checkLoaded = setInterval(() => {
        attempts++;
        if (window.FB) {
          clearInterval(checkLoaded);
          this.initFacebookSDK()
            .then(() => {
              this.isInitialized = true;
              resolve();
            })
            .catch(reject);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkLoaded);
          reject(
            new Error(
              'Facebook SDK failed to load. Please check your internet connection.'
            )
          );
        }
      }, checkInterval);
    });

    return this.initPromise;
  }

  /**
   * Khởi tạo Facebook SDK với App ID
   */
  private initFacebookSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error('Facebook SDK not loaded'));
        return;
      }

      if (this.FACEBOOK_APP_ID.includes('YOUR_FACEBOOK_APP_ID_HERE')) {
        console.warn(
          '⚠️ Facebook App ID chưa được config! ' +
            'Vui lòng tạo Facebook App trong Facebook Developers Console và cập nhật FACEBOOK_APP_ID.'
        );
        reject(
          new Error(
            'Facebook App ID chưa được cấu hình. Vui lòng cập nhật FACEBOOK_APP_ID trong facebook-signin.service.ts'
          )
        );
        return;
      }

      try {
        window.FB.init({
          appId: this.FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0', // Sử dụng version mới nhất
        });

        console.log('Facebook SDK initialized successfully');
        resolve();
      } catch (error) {
        console.error('Error initializing Facebook SDK:', error);
        reject(error);
      }
    });
  }

  /**
   * Đảm bảo Facebook SDK script đã được load
   */
  private ensureFacebookSDKLoaded(): void {
    // Kiểm tra xem script đã tồn tại chưa
    const existingScript = document.querySelector(
      'script[src*="connect.facebook.net"]'
    );

    if (existingScript) {
      console.log('Facebook SDK script already exists');
      return;
    }

    // Script sẽ được load từ index.html
    console.log('Facebook SDK script should be loaded from index.html');
  }

  /**
   * Đăng nhập bằng Facebook
   * Trả về access token để gửi lên backend
   */
  async signIn(): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error('Facebook SDK not available'));
        return;
      }

      // Gọi Facebook Login API
      window.FB.login(
        (response: any) => {
          if (response.authResponse) {
            // Lấy access token
            const accessToken = response.authResponse.accessToken;
            console.log(
              'Facebook login successful, access token:',
              accessToken
            );
            resolve(accessToken);
          } else {
            // User đã cancel hoặc có lỗi
            if (response.status === 'not_authorized') {
              reject(new Error('User cancelled Facebook login'));
            } else {
              reject(new Error('Facebook login failed'));
            }
          }
        },
        {
          scope: 'email,public_profile', // Quyền cần thiết
        }
      );
    });
  }

  /**
   * Kiểm tra xem Facebook SDK đã sẵn sàng chưa
   */
  isReady(): boolean {
    return this.isInitialized && !!window.FB;
  }

  /**
   * Lấy thông tin user từ Facebook (optional, có thể dùng để hiển thị)
   */
  async getUserInfo(accessToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error('Facebook SDK not available'));
        return;
      }

      window.FB.api(
        '/me',
        { fields: 'id,name,email,picture' },
        (response: any) => {
          if (response.error) {
            reject(
              new Error(response.error.message || 'Failed to get user info')
            );
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}
