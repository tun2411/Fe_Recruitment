import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  informationCircleOutline,
  logoGoogle,
  logoFacebook,
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
// Hybrid approach: Plugin cho Android, Web approach cho ionic serve
import { GoogleSignInService } from '../../services/google-signin.service';
import { GoogleSignInHybridService } from '../../services/google-signin-hybrid.service';
import { Capacitor } from '@capacitor/core';
import { FacebookSignInService } from '../../services/facebook-signin.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    CommonModule,
  ],
})
export class LoginPage implements OnInit {
  isLoading = false;
  errorMessage = '';
  loginProvider: 'google' | 'facebook' | null = null;

  private activeGoogleService: GoogleSignInService | GoogleSignInHybridService;

  constructor(
    private authService: AuthService,
    private googleSignInService: GoogleSignInService,
    private googleSignInHybridService: GoogleSignInHybridService,
    private facebookSignInService: FacebookSignInService,
    private router: Router,
    private http: HttpClient,
    private toastController: ToastController
  ) {
    // Auto-select service dựa trên platform
    this.activeGoogleService = Capacitor.isNativePlatform()
      ? this.googleSignInHybridService // Android/iOS: Use plugin
      : this.googleSignInService; // Web: Use old approach
    addIcons({
      alertCircleOutline,
      informationCircleOutline,
      logoGoogle,
      logoFacebook,
    });
  }

  ngOnInit() {
    // Nếu đã đăng nhập → thông báo + chuyển thẳng về home, thay entry history
    if (this.authService.isAuthenticated()) {
      this.showRedirectMessage();
      this.router.navigate(['/home'], { replaceUrl: true }).catch((error) => {
        console.error('Navigation error:', error);
        // Nếu không thể navigate, có thể token không hợp lệ, clear nó để user login lại
        this.authService.clearToken();
      });
      return;
    }

    // Chưa đăng nhập → khởi tạo Google/Facebook Sign-In
    this.initializeGoogleSignInWithRetry();
    this.initializeFacebookSignInWithRetry();
  }

  /**
   * Khởi tạo Google Sign-In với retry logic (cho Android)
   */
  private initializeGoogleSignInWithRetry(
    retryCount = 0,
    maxRetries = 3
  ): void {
    this.activeGoogleService
      .initialize()
      .then(() => {
        console.log('Google Sign-In initialized successfully');
      })
      .catch((error) => {
        console.warn(
          'Google Sign-In initialization failed (attempt',
          retryCount + 1,
          '):',
          error
        );

        if (retryCount < maxRetries) {
          // Retry sau 2 giây
          setTimeout(() => {
            console.log('Retrying Google Sign-In initialization...');
            this.initializeGoogleSignInWithRetry(retryCount + 1, maxRetries);
          }, 2000);
        } else {
          console.error(
            'Google Sign-In initialization failed after',
            maxRetries,
            'attempts'
          );
          // Không hiển thị lỗi cho user, chỉ log
          // User vẫn có thể thử click button để trigger lại
        }
      });
  }

  /**
   * Khởi tạo Facebook Sign-In với retry logic (cho Android)
   */
  private initializeFacebookSignInWithRetry(
    retryCount = 0,
    maxRetries = 3
  ): void {
    this.facebookSignInService
      .initialize()
      .then(() => {
        console.log('Facebook Sign-In initialized successfully');
      })
      .catch((error) => {
        console.warn(
          'Facebook Sign-In initialization failed (attempt',
          retryCount + 1,
          '):',
          error
        );

        if (retryCount < maxRetries) {
          // Retry sau 2 giây
          setTimeout(() => {
            console.log('Retrying Facebook Sign-In initialization...');
            this.initializeFacebookSignInWithRetry(retryCount + 1, maxRetries);
          }, 2000);
        } else {
          console.error(
            'Facebook Sign-In initialization failed after',
            maxRetries,
            'attempts'
          );
          // Không hiển thị lỗi cho user, chỉ log
          // User vẫn có thể thử click button để trigger lại
        }
      });
  }

  async showRedirectMessage() {
    const toast = await this.toastController.create({
      message: 'Bạn đã đăng nhập. Đang chuyển hướng...',
      duration: 1500,
      color: 'primary',
      position: 'top',
    });
    await toast.present();
  }

  async onGoogleLogin() {
    this.isLoading = true;
    this.errorMessage = '';
    this.loginProvider = 'google';

    try {
      // Sử dụng activeGoogleService (auto-selected based on platform)
      this.activeGoogleService
        .signIn()
        .then(async (idToken: string) => {
          // Gọi API Google login với idToken
          const googleLoginRequest = {
            idToken: idToken,
            // accessToken và refreshToken là optional, không cần gửi
          };

          this.authService.googleLogin(googleLoginRequest).subscribe({
            next: async () => {
              this.isLoading = false;
              this.loginProvider = null;

              const toast = await this.toastController.create({
                message: 'Đăng nhập bằng Google thành công!',
                duration: 2000,
                color: 'success',
                position: 'top',
              });
              await toast.present();

              this.router
                .navigate(['/home'], { replaceUrl: true })
                .catch((error) => {
                  console.error('Navigation error after login:', error);
                });
            },
            error: async (error: any) => {
              this.isLoading = false;
              this.loginProvider = null;

              this.errorMessage =
                error.message ||
                'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';

              const toast = await this.toastController.create({
                message: this.errorMessage,
                duration: 3000,
                color: 'danger',
                position: 'top',
              });
              await toast.present();
            },
          });
        })
        .catch(async (error: any) => {
          this.isLoading = false;
          this.loginProvider = null;

          this.errorMessage =
            error.message ||
            'Không thể đăng nhập bằng Google. Vui lòng thử lại.';

          const toast = await this.toastController.create({
            message: this.errorMessage,
            duration: 3000,
            color: 'danger',
            position: 'top',
          });
          await toast.present();
        });
    } catch (error: any) {
      this.isLoading = false;
      this.loginProvider = null;

      this.errorMessage =
        error.message || 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';

      const toast = await this.toastController.create({
        message: this.errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    }
  }

  async onFacebookLogin() {
    this.isLoading = true;
    this.errorMessage = '';
    this.loginProvider = 'facebook';

    try {
      // Sử dụng Facebook Sign-In Service để lấy access token thật
      this.facebookSignInService
        .signIn()
        .then(async (accessToken: string) => {
          // Gọi API Facebook login với access token
          const facebookLoginRequest = {
            accessToken: accessToken,
          };

          this.authService.facebookLogin(facebookLoginRequest).subscribe({
            next: async () => {
              this.isLoading = false;
              this.loginProvider = null;

              const toast = await this.toastController.create({
                message: 'Đăng nhập bằng Facebook thành công!',
                duration: 2000,
                color: 'success',
                position: 'top',
              });
              await toast.present();

              this.router
                .navigate(['/home'], { replaceUrl: true })
                .catch((error) => {
                  console.error('Navigation error after login:', error);
                });
            },
            error: async (error: any) => {
              this.isLoading = false;
              this.loginProvider = null;

              this.errorMessage =
                error.message ||
                'Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.';

              const toast = await this.toastController.create({
                message: this.errorMessage,
                duration: 3000,
                color: 'danger',
                position: 'top',
              });
              await toast.present();
            },
          });
        })
        .catch(async (error: any) => {
          this.isLoading = false;
          this.loginProvider = null;

          this.errorMessage =
            error.message ||
            'Không thể đăng nhập bằng Facebook. Vui lòng thử lại.';

          const toast = await this.toastController.create({
            message: this.errorMessage,
            duration: 3000,
            color: 'danger',
            position: 'top',
          });
          await toast.present();
        });
    } catch (error: any) {
      this.isLoading = false;
      this.loginProvider = null;

      this.errorMessage =
        error.message || 'Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.';

      const toast = await this.toastController.create({
        message: this.errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    }
  }
}
