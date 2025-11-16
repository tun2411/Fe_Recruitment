import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular/standalone';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastController = inject(ToastController);

  const token = authService.getToken();

  // Nếu có token, thêm vào header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Xử lý response
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Nếu lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
      if (error.status === 401 || error.status === 403) {
        // Xóa token và redirect về login
        authService.logout();

        toastController
          .create({
            message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            duration: 3000,
            color: 'warning',
            position: 'top',
            buttons: [
              {
                text: 'Đóng',
                role: 'cancel',
              },
            ],
          })
          .then((toast) => toast.present());
      }

      return throwError(() => error);
    })
  );
};
