import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    google: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleSignInService {
  private readonly GOOGLE_CLIENT_ID =
    '314046144776-pfepr9d4bj6btmjfnd4kqjo6qciu5te9.apps.googleusercontent.com';
  private isInitialized = false;
  private currentResolve: ((idToken: string) => void) | null = null;
  private currentReject: ((error: any) => void) | null = null;

  /**
   * Khởi tạo Google Sign-In API
   */
  initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Kiểm tra nếu Google API đã load
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        this.initializeGoogleSignIn();
        resolve();
        return;
      }

      // Đảm bảo script được load (đặc biệt quan trọng cho Android)
      this.ensureGoogleScriptLoaded()
        .then(() => {
          // Đợi Google API load - tăng timeout cho Android
          let attempts = 0;
          const maxAttempts = 200; // 20 giây với interval 100ms

          const checkInterval = setInterval(() => {
            attempts++;
            if (
              window.google &&
              window.google.accounts &&
              window.google.accounts.id
            ) {
              clearInterval(checkInterval);
              this.initializeGoogleSignIn();
              resolve();
            } else if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              console.error(
                'Google Sign-In API failed to load after',
                maxAttempts * 100,
                'ms'
              );
              reject(
                new Error(
                  'Google Sign-In API failed to load. Please check your internet connection and try again.'
                )
              );
            }
          }, 100);
        })
        .catch((error) => {
          console.error('Failed to load Google Sign-In script:', error);
          reject(
            new Error(
              'Failed to load Google Sign-In script. Please check your internet connection.'
            )
          );
        });
    });
  }

  /**
   * Đảm bảo Google Sign-In script được load (quan trọng cho Android WebView)
   */
  private ensureGoogleScriptLoaded(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Kiểm tra xem script đã tồn tại và đã load chưa
      const existingScript = document.querySelector(
        'script[src*="accounts.google.com/gsi/client"]'
      ) as HTMLScriptElement;

      if (existingScript) {
        // Script đã có trong DOM
        if (
          window.google &&
          window.google.accounts &&
          window.google.accounts.id
        ) {
          // Đã load xong
          resolve();
          return;
        }

        // Script có nhưng chưa load xong, đợi thêm
        const checkLoaded = setInterval(() => {
          if (
            window.google &&
            window.google.accounts &&
            window.google.accounts.id
          ) {
            clearInterval(checkLoaded);
            resolve();
          }
        }, 100);

        // Timeout sau 5 giây
        setTimeout(() => {
          clearInterval(checkLoaded);
          // Thử load lại script
          this.loadGoogleScriptDynamically().then(resolve).catch(reject);
        }, 5000);
      } else {
        // Script chưa có, load mới
        this.loadGoogleScriptDynamically().then(resolve).catch(reject);
      }
    });
  }

  /**
   * Load Google Sign-In script dynamically với error handling tốt hơn
   * Được tối ưu cho Android WebView
   */
  private loadGoogleScriptDynamically(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Kiểm tra nếu đang chạy trên Android
      const isAndroid =
        Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

      // Đảm bảo document đã sẵn sàng (quan trọng cho Android WebView)
      const ensureDocumentReady = (callback: () => void) => {
        if (
          document.readyState === 'complete' ||
          document.readyState === 'interactive'
        ) {
          // Đợi thêm một chút để đảm bảo WebView đã sẵn sàng
          setTimeout(callback, isAndroid ? 500 : 100);
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(callback, isAndroid ? 500 : 100);
          });
        }
      };

      ensureDocumentReady(() => {
        // Xóa script cũ nếu có (để tránh conflict)
        const oldScript = document.querySelector(
          'script[src*="accounts.google.com/gsi/client"]'
        );
        if (oldScript) {
          oldScript.remove();
        }

        // Tạo script mới
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = false; // Không dùng defer để có thể handle onload
        // KHÔNG dùng crossOrigin vì script tags không cần CORS khi load từ external domain
        // crossOrigin sẽ trigger CORS check và bị block bởi Google
        script.type = 'text/javascript';

        // Thêm integrity và crossorigin nếu không phải Android (có thể gây vấn đề trên WebView)
        if (!isAndroid) {
          // Có thể thêm integrity check cho web browser
        }

        let scriptLoaded = false;
        let apiReady = false;

        // Handle khi script load thành công
        script.onload = () => {
          scriptLoaded = true;
          console.log('Google Sign-In script loaded successfully');

          // Đợi lâu hơn cho Android WebView
          const initialDelay = isAndroid ? 1000 : 500;
          const checkInterval = isAndroid ? 150 : 100;
          const maxAttempts = isAndroid ? 100 : 50; // 15 giây cho Android, 5 giây cho web

          setTimeout(() => {
            if (
              window.google &&
              window.google.accounts &&
              window.google.accounts.id
            ) {
              apiReady = true;
              resolve();
            } else {
              // Đợi thêm với polling
              let attempts = 0;
              const checkIntervalId = setInterval(() => {
                attempts++;
                if (
                  window.google &&
                  window.google.accounts &&
                  window.google.accounts.id
                ) {
                  apiReady = true;
                  clearInterval(checkIntervalId);
                  resolve();
                } else if (attempts >= maxAttempts) {
                  clearInterval(checkIntervalId);
                  if (!apiReady) {
                    reject(
                      new Error('Google API not available after script loaded')
                    );
                  }
                }
              }, checkInterval);
            }
          }, initialDelay);
        };

        // Handle khi script load thất bại
        script.onerror = (error) => {
          console.error('Failed to load Google Sign-In script:', error);
          // Trên Android, có thể là vấn đề network hoặc CSP
          const errorMessage = isAndroid
            ? 'Failed to load Google Sign-In script. Please check your internet connection and ensure the app has network permissions.'
            : 'Failed to load Google Sign-In script. Check internet connection.';
          reject(new Error(errorMessage));
        };

        // Thêm script vào head
        try {
          if (document.head) {
            document.head.appendChild(script);
          } else {
            // Fallback: thêm vào body nếu head chưa có
            document.body.appendChild(script);
          }
        } catch (e) {
          console.error('Error appending script:', e);
          reject(new Error('Failed to append Google Sign-In script to DOM'));
          return;
        }

        // Timeout dài hơn cho Android
        const timeoutDuration = isAndroid ? 20000 : 10000;
        setTimeout(() => {
          if (!scriptLoaded) {
            reject(
              new Error(
                'Google Sign-In script load timeout (script not loaded)'
              )
            );
          } else if (
            !apiReady &&
            (!window.google ||
              !window.google.accounts ||
              !window.google.accounts.id)
          ) {
            reject(
              new Error('Google Sign-In script load timeout (API not ready)')
            );
          }
        }, timeoutDuration);
      });
    });
  }

  private initializeGoogleSignIn(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize với callback để handle credential response
      window.google.accounts.id.initialize({
        client_id: this.GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          this.handleCredentialResponse(response);
        },
        auto_select: false,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
      throw error;
    }
  }

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
   * Trigger Google Sign-In và trả về Promise với idToken
   */
  signIn(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Đảm bảo đã initialize
      if (!this.isInitialized) {
        this.initialize()
          .then(() => {
            this.performSignIn(resolve, reject);
          })
          .catch(reject);
      } else {
        this.performSignIn(resolve, reject);
      }
    });
  }

  private performSignIn(
    resolve: (idToken: string) => void,
    reject: (error: any) => void
  ): void {
    try {
      // Lưu callbacks
      this.currentResolve = resolve;
      this.currentReject = reject;

      // Tạo một button container ẩn để render Google button
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

      // Clear container trước
      buttonContainer.innerHTML = '';

      // Render Google Sign-In button vào container
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        locale: 'vi',
        width: '300',
      });

      // Sau khi render, tìm và click button
      setTimeout(() => {
        // Tìm button được render bởi Google
        const googleButton = buttonContainer.querySelector(
          'div[role="button"]'
        ) as HTMLElement;
        if (googleButton) {
          // Trigger click event
          googleButton.click();
        } else {
          // Fallback: thử dùng One Tap prompt
          window.google.accounts.id.prompt((notification: any) => {
            if (
              notification.isNotDisplayed() ||
              notification.isSkippedMoment() ||
              notification.isDismissedMoment()
            ) {
              // Nếu One Tap không hiển thị, thử lại với button
              setTimeout(() => {
                const retryButton = buttonContainer.querySelector(
                  'div[role="button"]'
                ) as HTMLElement;
                if (retryButton) {
                  retryButton.click();
                } else {
                  reject(
                    new Error(
                      'Không thể hiển thị Google Sign-In. Vui lòng thử lại sau.'
                    )
                  );
                }
              }, 500);
            }
          });
        }
      }, 300);
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Kiểm tra xem Google API đã sẵn sàng chưa
   */
  isReady(): boolean {
    return (
      this.isInitialized &&
      !!(window.google && window.google.accounts && window.google.accounts.id)
    );
  }
}
