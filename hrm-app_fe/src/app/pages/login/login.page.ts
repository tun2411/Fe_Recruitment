import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
    private router: Router,
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
    }
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
      // TODO: Implement Google OAuth login
      // This is a placeholder - you'll need to integrate with your OAuth provider
      // Example: await this.authService.loginWithGoogle();
      
      // Simulate API call (replace with actual implementation)
      setTimeout(async () => {
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
      }, 1500);
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
