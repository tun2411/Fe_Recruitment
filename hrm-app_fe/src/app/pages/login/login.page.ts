import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonItem,
  IonLabel,
  IonNote,
  IonList,
  IonAvatar,
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
  eyeOutline,
  eyeOffOutline,
  alertCircleOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonNote,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  isAlreadyLoggedIn = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      eyeOutline,
      eyeOffOutline,
      alertCircleOutline,
      informationCircleOutline,
    });

    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onLogin() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loading = await this.loadingController.create({
      message: 'Logging in...',
      spinner: 'crescent',
    });
    await loading.present();

    const credentials = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    };

    this.authService.login(credentials).subscribe({
      next: async (response) => {
        await loading.dismiss();
        this.isLoading = false;

        // Hiển thị message từ backend hoặc message mặc định
        const successMessage = response.message || 'Đăng nhập thành công!';

        const toast = await this.toastController.create({
          message: successMessage,
          duration: 2000,
          color: 'success',
          position: 'top',
        });
        await toast.present();


        this.router.navigate(['/home']).catch((error) => {
          console.error('Navigation error after login:', error);
        });
      },
      error: async (error) => {
        await loading.dismiss();
        this.isLoading = false;


        if (error.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else if (error.status === 0) {
          this.errorMessage =
            'Cannot connect to server. Please check your connection.';
        } else {
          this.errorMessage =
            error.error?.message || 'Login failed. Please try again.';
        }

        const toast = await this.toastController.create({
          message: this.errorMessage,
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }

  onForgotPassword() {
    // Navigate to forgot password page (cần tạo page này nếu chưa có)
    console.log('Forgot password clicked');
    // this.router.navigate(['/forgot-password']);
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

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
