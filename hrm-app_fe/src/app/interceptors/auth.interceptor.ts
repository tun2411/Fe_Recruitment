import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService, RefreshTokenRequest } from '../services/auth.service';
import { ToastController } from '@ionic/angular/standalone';

// Flag để tránh refresh token nhiều lần cùng lúc
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastController = inject(ToastController);

  const url = req.url;

  // Public endpoints không cần token
  const isPublicEndpoint =
    url.includes('/api/auth/') ||
    url.includes('/api/jobs/public') ||
    url.includes('/api/applications/apply/') ||
    url.includes('/api/cv/');

  if (isPublicEndpoint) {
    return next(req);
  }

  // Lấy token từ AuthService (ưu tiên) hoặc localStorage (fallback)
  let token = authService.getToken();
  const directToken =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  if (!token && directToken) {
    console.warn(
      '[AuthInterceptor] AuthService.getToken() trả null nhưng localStorage có token, dùng token từ localStorage'
    );
    token = directToken;
  }

  // Logging để debug
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = exp - now;
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);

      if (timeUntilExpiry < 0) {
        console.warn(
          '[AuthInterceptor] Token đã hết hạn. Exp:',
          new Date(exp),
          'Now:',
          new Date(now)
        );
      } else if (minutesUntilExpiry < 5) {
        console.warn(
          `[AuthInterceptor] Token sắp hết hạn trong ${minutesUntilExpiry} phút`
        );
      } else {
        console.log(
          `[AuthInterceptor] Token còn hiệu lực trong ${minutesUntilExpiry} phút`
        );
      }
    } catch (e) {
      console.warn(
        '[AuthInterceptor] Không thể decode token để check expiry:',
        e
      );
    }
  } else {
    console.warn('[AuthInterceptor] Không có token trong request:', url);
  }

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  } else {
    console.error('[AuthInterceptor] Request không có token:', url);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Chỉ xử lý lỗi auth (401, 403)
      if (error.status === 401 || error.status === 403) {
        console.warn(
          `[AuthInterceptor] Received ${error.status} error for:`,
          url,
          error
        );

        const isRefreshRequest =
          url.includes('/auth/refresh-token') ||
          url.includes('/api/auth/refresh-token');

        const currentRefreshToken = authService.getRefreshToken();

        // Nếu không có refresh token hoặc chính là call refresh-token thì logout luôn
        if (!currentRefreshToken || isRefreshRequest) {
          console.error(
            '[AuthInterceptor] Không có refresh token hoặc đang refresh, logout'
          );
          handleLogout(authService, toastController);
          return throwError(() => error);
        }

        // Nếu chưa refresh -> bắt đầu refresh
        if (!isRefreshing) {
          console.log('[AuthInterceptor] Bắt đầu refresh token...');
          isRefreshing = true;
          refreshTokenSubject.next(null);

          const refreshRequest: RefreshTokenRequest = {
            refreshToken: currentRefreshToken,
          };

          return authService.refreshToken(refreshRequest).pipe(
            switchMap((resp) => {
              isRefreshing = false;
              const newToken = resp.token || authService.getToken();

              if (!newToken) {
                console.error(
                  '[AuthInterceptor] Refresh token thành công nhưng không có token mới'
                );
                handleLogout(authService, toastController);
                return throwError(() => error);
              }

              console.log(
                '[AuthInterceptor] Refresh token thành công, retry request'
              );
              refreshTokenSubject.next(newToken);

              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });

              return next(retryReq);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              refreshTokenSubject.next(null);
              console.error(
                '[AuthInterceptor] Refresh token thất bại:',
                refreshError
              );
              handleLogout(authService, toastController);
              return throwError(() => refreshError);
            })
          );
        }

        // Đang refresh: chờ token mới
        console.log('[AuthInterceptor] Đang chờ token mới từ refresh...');
        return refreshTokenSubject.pipe(
          filter((t) => t !== null),
          take(1),
          switchMap((newToken) => {
            console.log('[AuthInterceptor] Nhận token mới, retry request');
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(retryReq);
          })
        );
      }

      // Các lỗi khác -> để cho caller xử lý
      return throwError(() => error);
    })
  );
};

async function handleLogout(
  authService: AuthService,
  toastController: ToastController
): Promise<void> {
  authService.logout();

  try {
    const toast = await toastController.create({
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
    });
    await toast.present();
  } catch (e) {
    console.error('[AuthInterceptor] Lỗi khi hiển thị toast logout:', e);
  }
}
