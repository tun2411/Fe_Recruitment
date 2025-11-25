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

  // Debug log để kiểm tra token
  console.log('[AuthInterceptor] Request URL:', req.url);
  console.log('[AuthInterceptor] Token exists:', !!token);
  if (token) {
    console.log(
      '[AuthInterceptor] Token (first 20 chars):',
      token.substring(0, 20) + '...'
    );
  }

  // Nếu có token, thêm vào header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('[AuthInterceptor] Added Authorization header');
  } else {
    console.warn(
      '[AuthInterceptor] No token found, request will be sent without Authorization header'
    );
  }

  // Xử lý response
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('[AuthInterceptor] Request failed:', {
        url: req.url,
        status: error.status,
        statusText: error.statusText,
        error: error.error,
      });

      // Nếu lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
      if (error.status === 401 || error.status === 403) {
        console.warn('[AuthInterceptor] 401/403 error, logging out user');

        // Chỉ logout nếu không phải là endpoint public
        // Các endpoint public không cần token nên không nên logout khi lỗi
        const isPublicEndpoint =
          req.url.includes('/auth/') ||
          req.url.includes('/jobs/email-templates/samples');

        if (!isPublicEndpoint) {
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
        } else {
          console.log('[AuthInterceptor] Public endpoint, skipping logout');
        }
      }

      return throwError(() => error);
    })
  );
};
