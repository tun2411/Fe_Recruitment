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
  LoadingController,
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
import { GoogleSignInService } from '../../services/google-signin.service';
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
  isAlreadyLoggedIn = false;
  loginProvider: 'google' | 'facebook' | null = null;

  constructor(
    private authService: AuthService,
    private googleSignInService: GoogleSignInService,
    private router: Router,
    private http: HttpClient,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      alertCircleOutline,
      informationCircleOutline,
      logoGoogle,
      logoFacebook,
    });
  }

  ngOnInit() {
    // Kiểm tra nếu đã đăng nhập
    this.isAlreadyLoggedIn = this.authService.isAuthenticated();

    if (this.isAlreadyLoggedIn) {
      // Hiển thị thông báo và tự động redirect sau 1 giây
      this.showRedirectMessage();

      // Sử dụng setTimeout để đảm bảo component đã render xong
      setTimeout(() => {
        this.router.navigate(['/home']).catch((error) => {
          console.error('Navigation error:', error);
          // Nếu không thể navigate, có thể token không hợp lệ, clear nó
          this.authService.clearToken();
          this.isAlreadyLoggedIn = false;
        });
      }, 1500);
    } else {
      // Khởi tạo Google Sign-In khi component load
      // Retry nếu lần đầu fail (đặc biệt cho Android)
      this.initializeGoogleSignInWithRetry();
    }
  }

  /**
   * Khởi tạo Google Sign-In với retry logic (cho Android)
   */
  private initializeGoogleSignInWithRetry(retryCount = 0, maxRetries = 3): void {
    this.googleSignInService.initialize()
      .then(() => {
        console.log('Google Sign-In initialized successfully');
      })
      .catch((error) => {
        console.warn('Google Sign-In initialization failed (attempt', retryCount + 1, '):', error);
        
        if (retryCount < maxRetries) {
          // Retry sau 2 giây
          setTimeout(() => {
            console.log('Retrying Google Sign-In initialization...');
            this.initializeGoogleSignInWithRetry(retryCount + 1, maxRetries);
          }, 2000);
        } else {
          console.error('Google Sign-In initialization failed after', maxRetries, 'attempts');
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

    const loading = await this.loadingController.create({
      message: 'Đang đăng nhập bằng Google...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      // Sử dụng Google Sign-In Service để lấy idToken thật
      this.googleSignInService.signIn()
        .then(async (idToken: string) => {
          // Gọi API Google login với idToken
          const googleLoginRequest = {
            idToken: idToken,
            // accessToken và refreshToken là optional, không cần gửi
          };

          this.authService.googleLogin(googleLoginRequest).subscribe({
            next: async () => {
              await loading.dismiss();
              this.isLoading = false;
              this.loginProvider = null;

              const toast = await this.toastController.create({
                message: 'Đăng nhập bằng Google thành công!',
                duration: 2000,
                color: 'success',
                position: 'top',
              });
              await toast.present();

              this.router.navigate(['/home']).catch((error) => {
                console.error('Navigation error after login:', error);
              });
            },
            error: async (error: any) => {
              await loading.dismiss();
              this.isLoading = false;
              this.loginProvider = null;

              this.errorMessage = error.message || 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';

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
          await loading.dismiss();
          this.isLoading = false;
          this.loginProvider = null;

          this.errorMessage = error.message || 'Không thể đăng nhập bằng Google. Vui lòng thử lại.';

          const toast = await this.toastController.create({
            message: this.errorMessage,
            duration: 3000,
            color: 'danger',
            position: 'top',
          });
          await toast.present();
        });
    } catch (error: any) {
      await loading.dismiss();
      this.isLoading = false;
      this.loginProvider = null;

      this.errorMessage = error.message || 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';

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

    const loading = await this.loadingController.create({
      message: 'Đang đăng nhập bằng Facebook...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      // TODO: Implement Facebook OAuth login
      // This is a placeholder - you'll need to integrate with your OAuth provider
      // Example: await this.authService.loginWithFacebook();
      
      // Simulate API call (replace with actual implementation)
      setTimeout(async () => {
        await loading.dismiss();
        this.isLoading = false;
        this.loginProvider = null;

        const toast = await this.toastController.create({
          message: 'Đăng nhập bằng Facebook thành công!',
          duration: 2000,
          color: 'success',
          position: 'top',
        });
        await toast.present();

        this.router.navigate(['/home']).catch((error) => {
          console.error('Navigation error after login:', error);
        });
      }, 1500);
    } catch (error: any) {
      await loading.dismiss();
      this.isLoading = false;
      this.loginProvider = null;

      this.errorMessage = error.message || 'Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.';

      const toast = await this.toastController.create({
        message: this.errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    }
  }

  async clearSession() {
    const alert = await this.toastController.create({
      message: 'Đã xóa phiên đăng nhập',
      duration: 2000,
      color: 'success',
      position: 'top',
    });

    this.authService.clearToken();
    await alert.present();

    // Reload page để reset form
    window.location.reload();
  }

}
