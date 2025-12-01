import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService, RefreshTokenRequest } from '../services/auth.service';
import { ToastController } from '@ionic/angular/standalone';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastController = inject(ToastController);

  const token = authService.getToken();

  // Log để debug (chỉ trong development)
  if (!token) {
    console.warn('[AuthInterceptor] No token found for request:', req.url);
  } else {
    console.log('[AuthInterceptor] Adding token to request:', req.url);
  }

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
        console.error('[AuthInterceptor] Authentication error:', {
          status: error.status,
          url: error.url,
          message: error.message,
          hasToken: !!token,
          hasRefreshToken: !!authService.getRefreshToken(),
        });

        // Thử refresh token nếu có refresh token và chưa phải là request refresh token
        const refreshToken = authService.getRefreshToken();
        const isRefreshTokenRequest = req.url.includes('/auth/refresh-token');
        
        if (refreshToken && !isRefreshTokenRequest) {
          console.log('[AuthInterceptor] Attempting to refresh token...');
          
          const refreshRequest: RefreshTokenRequest = { refreshToken };
          
          return authService.refreshToken(refreshRequest).pipe(
            switchMap((authResponse) => {
              console.log('[AuthInterceptor] Token refreshed successfully, retrying original request');
              
              // Retry original request với token mới
              const newToken = authService.getToken();
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              
              return next(clonedReq);
            }),
            catchError((refreshError) => {
              console.error('[AuthInterceptor] Token refresh failed, logging out:', refreshError);
              // Refresh token thất bại, logout
              handleLogout(authService, toastController);
              return throwError(() => error);
            })
          );
        } else {
          // Không có refresh token hoặc đang gọi refresh token endpoint, logout ngay
          console.log('[AuthInterceptor] No refresh token available or refresh request failed, logging out');
          handleLogout(authService, toastController);
        }
      }

      return throwError(() => error);
    })
  );
};

function handleLogout(authService: AuthService, toastController: ToastController): void {
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
