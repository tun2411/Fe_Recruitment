import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
} from '@angular/common/http';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  switchMap,
  throwError,
  BehaviorSubject,
  filter,
  take,
} from 'rxjs';
import { AuthService, RefreshTokenRequest } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService, RefreshTokenRequest } from '../services/auth.service';
import { ToastController } from '@ionic/angular/standalone';

// Flag để tránh refresh token nhiều lần cùng lúc
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastController = inject(ToastController);

  // Kiểm tra xem đây có phải là public endpoint không
  const url = req.url;
  const isPublicEndpoint =
    url.includes('/api/auth/') ||
    url.includes('/api/jobs/public') ||
    url.includes('/api/applications/apply/') ||
    url.includes('/api/cv/');

  // Nếu là public endpoint, không cần thêm token
  if (isPublicEndpoint) {
    return next(req);
  }

  // Lấy token: Ưu tiên từ AuthService, fallback về localStorage trực tiếp
  let token = authService.getToken();
  const directToken =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // Nếu AuthService không trả về token nhưng localStorage có, sử dụng token từ localStorage
  if (!token && directToken) {
    console.warn(
      '[AuthInterceptor] ⚠️ AuthService.getToken() returned null, but token exists in localStorage'
    );
    console.warn(
      '[AuthInterceptor] Using token directly from localStorage as fallback'
    );
    token = directToken;
  }

  // Debug: Log token status
  console.log('[AuthInterceptor] Request URL:', url);
  console.log('[AuthInterceptor] Token available:', !!token);
  if (token) {
    console.log('[AuthInterceptor] Token length:', token.length);
    console.log(
      '[AuthInterceptor] Token preview:',
      token.substring(0, 20) + '...'
    );
  } else {
    console.error(
      '[AuthInterceptor] ⚠️ No token found for authenticated request:',
      url
    );
    console.error(
      '[AuthInterceptor] Direct localStorage token:',
      !!directToken
    );
    console.error(
      '[AuthInterceptor] AuthService.getToken():',
      !!authService.getToken()
    );
  }

  // Log để debug (chỉ trong development)
  if (!token) {
    console.warn('[AuthInterceptor] No token found for request:', req.url);
  } else {
    console.log('[AuthInterceptor] Adding token to request:', req.url);
  }

  // Nếu có token, thêm vào header
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('[AuthInterceptor] ✅ Token added to request headers');
    console.log(
      '[AuthInterceptor] Authorization header:',
      `Bearer ${token.substring(0, 20)}...`
    );
    return next(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Nếu lỗi 401 (Unauthorized) và không phải là request refresh token
        if (error.status === 401 && !url.includes('/api/auth/refresh-token')) {
          console.error(
            '[AuthInterceptor] ❌ Received 401 Unauthorized for:',
            url
          );
          console.error('[AuthInterceptor] Token may be expired or invalid');

          // Thử refresh token nếu có refreshToken
          let refreshToken = authService.getRefreshToken();
          const directRefreshToken =
            typeof window !== 'undefined'
              ? localStorage.getItem('refresh_token')
              : null;

          // Fallback: Nếu AuthService không trả về refresh token nhưng localStorage có
          if (!refreshToken && directRefreshToken) {
            console.warn(
              '[AuthInterceptor] ⚠️ AuthService.getRefreshToken() returned null, but refresh token exists in localStorage'
            );
            console.warn(
              '[AuthInterceptor] Using refresh token directly from localStorage as fallback'
            );
            refreshToken = directRefreshToken;
          }

          console.log('[AuthInterceptor] Has refresh token:', !!refreshToken);
          if (refreshToken) {
            console.log(
              '[AuthInterceptor] Refresh token length:',
              refreshToken.length
            );
            console.log(
              '[AuthInterceptor] Refresh token preview:',
              refreshToken.substring(0, 20) + '...'
            );
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
          if (refreshToken && !isRefreshing) {
            console.log('[AuthInterceptor] 🔄 Attempting to refresh token...');
            isRefreshing = true;
            refreshTokenSubject.next(null);

            const refreshRequest: RefreshTokenRequest = { refreshToken };

            return authService.refreshToken(refreshRequest).pipe(
              switchMap((response) => {
                console.log(
                  '[AuthInterceptor] ✅ Token refreshed successfully'
                );
                isRefreshing = false;
                refreshTokenSubject.next(response.token);

                // Retry request với token mới
                const clonedRequest = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.token}`,
                  },
                });
                return next(clonedRequest);
              }),
              catchError((refreshError) => {
                // Refresh token thất bại, logout
                console.error('[AuthInterceptor] ❌ Token refresh failed');
                console.error(
                  '[AuthInterceptor] Refresh error status:',
                  refreshError.status
                );
                console.error(
                  '[AuthInterceptor] Refresh error message:',
                  refreshError.message
                );
                if (refreshError.error) {
                  console.error(
                    '[AuthInterceptor] Refresh error details:',
                    refreshError.error
                  );
                }
                isRefreshing = false;
                refreshTokenSubject.next(null);

                authService.logout();

                toastController
                  .create({
                    message:
                      'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
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

                return throwError(() => refreshError);
              })
            );
          } else if (isRefreshing) {
            // Đang refresh token, chờ token mới
            console.log('[AuthInterceptor] ⏳ Waiting for token refresh...');
            return refreshTokenSubject.pipe(
              filter((token) => token !== null),
              take(1),
              switchMap((newToken) => {
                console.log('[AuthInterceptor] ✅ Using refreshed token');
                const clonedRequest = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                });
                return next(clonedRequest);
              })
            );
          } else {
            // Không có refreshToken hoặc refresh thất bại, logout
            console.error(
              '[AuthInterceptor] ❌ No refresh token available, logging out'
            );
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
        } else if (error.status === 403) {
          // Forbidden - không có quyền
          console.error(
            '[AuthInterceptor] ❌ Received 403 Forbidden for:',
            url
          );
          toastController
            .create({
              message: 'Bạn không có quyền thực hiện thao tác này.',
              duration: 3000,
              color: 'danger',
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
  } else {
    // Không có token và không phải public endpoint
    console.error('[AuthInterceptor] ❌ No token available, request will fail');
    // Vẫn gửi request, để backend trả về 401 và xử lý
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.error(
            '[AuthInterceptor] ❌ 401 Unauthorized - No token was sent'
          );
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
  }
};
