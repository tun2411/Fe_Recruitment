import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

// Interfaces theo DTO backend
export interface GoogleLoginRequest {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface FacebookLoginRequest {
  accessToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserDto {
  id: number;
  email: string;
  fullName: string;
}

export interface AuthResponse {
  token: string; // Access token
  refreshToken: string; // Refresh token for long-lived sessions
  user: UserDto;
}

// Interfaces cũ để backward compatibility
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  email: string;
  role: string;
  message: string;
}

export interface UserInfo {
  username?: string;
  email: string;
  fullName?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userInfoKey = 'user_info';
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(
    this.getUserInfo()
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * POST /api/auth/google - Đăng nhập bằng Google OAuth
   * @param request GoogleLoginRequest với idToken hoặc accessToken
   * @returns Observable<AuthResponse>
   */
  googleLogin(request: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/google`, request)
      .pipe(
        tap((response) => {
          if (response.token) {
            // Lưu access token
            this.setToken(response.token);

            // Lưu refresh token nếu có
            if (response.refreshToken) {
              this.setRefreshToken(response.refreshToken);
            }

            // Lưu thông tin user
            const userInfo: UserInfo = {
              email: response.user.email,
              fullName: response.user.fullName,
            };
            this.setUserInfo(userInfo);
            this.currentUserSubject.next(userInfo);
          }
        })
      );
  }

  /**
   * POST /api/auth/facebook - Đăng nhập bằng Facebook OAuth
   * @param request FacebookLoginRequest với accessToken
   * @returns Observable<AuthResponse>
   */
  facebookLogin(request: FacebookLoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/facebook`, request)
      .pipe(
        tap((response) => {
          if (response.token) {
            // Lưu access token
            this.setToken(response.token);

            // Lưu refresh token nếu có
            if (response.refreshToken) {
              this.setRefreshToken(response.refreshToken);
            }

            // Lưu thông tin user
            const userInfo: UserInfo = {
              email: response.user.email,
              fullName: response.user.fullName,
            };
            this.setUserInfo(userInfo);
            this.currentUserSubject.next(userInfo);
          }
        })
      );
  }

  /**
   * POST /api/auth/refresh-token - Refresh access token
   * @param request RefreshTokenRequest với refreshToken
   * @returns Observable<AuthResponse>
   */
  refreshToken(request: RefreshTokenRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/refresh-token`, request)
      .pipe(
        tap((response) => {
          if (response.token) {
            // Lưu access token mới
            this.setToken(response.token);

            // Lưu refresh token mới nếu có
            if (response.refreshToken) {
              this.setRefreshToken(response.refreshToken);
            }

            // Cập nhật thông tin user
            const userInfo: UserInfo = {
              email: response.user.email,
              fullName: response.user.fullName,
            };
            this.setUserInfo(userInfo);
            this.currentUserSubject.next(userInfo);
          }
        })
      );
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Gọi API thật (nếu có endpoint login truyền thống)
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.token) {
            // Lưu token
            this.setToken(response.token);

            // Lưu thông tin user
            const userInfo: UserInfo = {
              username: response.username,
              email: response.email,
              role: response.role,
            };
            this.setUserInfo(userInfo);
            this.currentUserSubject.next(userInfo);
          }
        })
      );
  }

  logout(): void {
    this.clearToken();
    this.clearRefreshToken();
    this.clearUserInfo();
    this.currentUserSubject.next(null);
    // replaceUrl để không quay lại được trang bảo vệ sau khi logout
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  getToken(): string | null {
    try {
      const token = localStorage.getItem(this.tokenKey);
      // Debug logging
      if (!token) {
        console.warn(
          '[AuthService] getToken() returned null. tokenKey:',
          this.tokenKey
        );
        console.warn(
          '[AuthService] localStorage keys:',
          Object.keys(localStorage)
        );
      }
      return token;
    } catch (error) {
      console.error(
        '[AuthService] Error getting token from localStorage:',
        error
      );
      return null;
    }
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  clearRefreshToken(): void {
    localStorage.removeItem(this.refreshTokenKey);
  }

  getUserInfo(): UserInfo | null {
    const userInfoStr = localStorage.getItem(this.userInfoKey);
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  }

  private setUserInfo(userInfo: UserInfo): void {
    localStorage.setItem(this.userInfoKey, JSON.stringify(userInfo));
  }

  clearUserInfo(): void {
    localStorage.removeItem(this.userInfoKey);
  }

  getCurrentUser(): UserInfo | null {
    return this.getUserInfo();
  }

  getUserRole(): string | null {
    const userInfo = this.getUserInfo();
    return userInfo?.role || null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    // Kiểm tra token có hết hạn không
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      if (exp < now) {
        console.warn(
          '[AuthService] Token has expired. Exp:',
          new Date(exp),
          'Now:',
          new Date(now)
        );
        return false;
      }
      return true;
    } catch (e) {
      console.error('[AuthService] Error decoding token:', e);
      // Nếu không decode được, vẫn return true để backend xử lý
      return true;
    }
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Kiểm tra token có hợp lệ và chưa hết hạn không
   * @returns true nếu token hợp lệ, false nếu không
   */
  checkTokenValidity(): boolean {
    const token = this.getToken();
    if (!token) {
      console.warn('[AuthService] checkTokenValidity: Không có token');
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      if (exp < now) {
        console.warn(
          '[AuthService] checkTokenValidity: Token đã hết hạn. Exp:',
          new Date(exp),
          'Now:',
          new Date(now)
        );
        return false;
      }

      const timeUntilExpiry = exp - now;
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
      console.log(
        `[AuthService] checkTokenValidity: Token còn hiệu lực trong ${minutesUntilExpiry} phút`
      );
      return true;
    } catch (e) {
      console.error('[AuthService] checkTokenValidity: Lỗi decode token:', e);
      // Nếu không decode được, vẫn return true để backend xử lý
      return true;
    }
  }

  /**
   * Kiểm tra token có sắp hết hạn không (trong vòng X phút)
   * @param minutesBeforeExpiry Số phút trước khi hết hạn (mặc định 5 phút)
   * @returns true nếu token sắp hết hạn, false nếu không
   */
  isTokenExpiringSoon(minutesBeforeExpiry: number = 5): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = exp - now;
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);

      return (
        minutesUntilExpiry <= minutesBeforeExpiry && minutesUntilExpiry > 0
      );
    } catch (e) {
      console.error('[AuthService] isTokenExpiringSoon: Lỗi decode token:', e);
      return false;
    }
  }

  /**
   * Proactively refresh token nếu sắp hết hạn
   * @param minutesBeforeExpiry Số phút trước khi hết hạn để refresh (mặc định 5 phút)
   * @returns Observable<AuthResponse | null> - null nếu không cần refresh
   */
  preemptiveRefresh(
    minutesBeforeExpiry: number = 5
  ): Observable<AuthResponse | null> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();

    if (!token || !refreshToken) {
      console.warn(
        '[AuthService] preemptiveRefresh: Không có token hoặc refresh token'
      );
      return of(null);
    }

    // Kiểm tra token có sắp hết hạn không
    if (!this.isTokenExpiringSoon(minutesBeforeExpiry)) {
      console.log(
        '[AuthService] preemptiveRefresh: Token chưa sắp hết hạn, không cần refresh'
      );
      return of(null);
    }

    console.log(
      `[AuthService] preemptiveRefresh: Token sắp hết hạn, đang refresh...`
    );

    const refreshRequest: RefreshTokenRequest = {
      refreshToken: refreshToken,
    };

    return this.refreshToken(refreshRequest).pipe(
      tap((response) => {
        console.log('[AuthService] preemptiveRefresh: Refresh thành công');
      })
    );
  }

  /**
   * Đảm bảo token hợp lệ trước khi gọi API quan trọng
   * Tự động refresh nếu token sắp hết hạn
   * @returns Promise<boolean> - true nếu token hợp lệ hoặc đã refresh thành công, false nếu không thể refresh
   */
  async ensureValidToken(): Promise<boolean> {
    // Kiểm tra token có tồn tại không
    const token = this.getToken();
    if (!token) {
      console.error('[AuthService] ensureValidToken: Không có token');
      // Không có token, logout user
      this.logout();
      return false;
    }

    // Kiểm tra token có hợp lệ không
    const isValid = this.checkTokenValidity();
    if (!isValid) {
      console.warn(
        '[AuthService] ensureValidToken: Token đã hết hạn, đang refresh...'
      );
      // Token đã hết hạn, thử refresh
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.error('[AuthService] ensureValidToken: Không có refresh token');
        this.logout();
        return false;
      }

      try {
        const refreshRequest: RefreshTokenRequest = {
          refreshToken: refreshToken,
        };
        await firstValueFrom(this.refreshToken(refreshRequest));
        console.log('[AuthService] ensureValidToken: Refresh token thành công');
        return true;
      } catch (error: any) {
        console.error(
          '[AuthService] ensureValidToken: Refresh token thất bại:',
          error
        );
        // Refresh token cũng hết hạn hoặc invalid, logout user
        this.logout();
        return false;
      }
    }

    // Nếu token sắp hết hạn (< 5 phút), refresh trước để tránh hết hạn trong lúc gọi API
    if (this.isTokenExpiringSoon(5)) {
      console.log(
        '[AuthService] ensureValidToken: Token sắp hết hạn, đang refresh trước...'
      );
      try {
        const response = await firstValueFrom(this.preemptiveRefresh(5));
        if (response === null) {
          // Không cần refresh (token chưa sắp hết hạn)
          console.log(
            '[AuthService] ensureValidToken: Token chưa sắp hết hạn, không cần refresh'
          );
          return true;
        }
        console.log(
          '[AuthService] ensureValidToken: Preemptive refresh thành công'
        );
        return true;
      } catch (error: any) {
        console.error(
          '[AuthService] ensureValidToken: Preemptive refresh thất bại:',
          error
        );
        // Nếu preemptive refresh fail, nhưng token vẫn còn hiệu lực, vẫn cho phép tiếp tục
        // Vì token chưa hết hạn, chỉ sắp hết
        console.warn(
          '[AuthService] ensureValidToken: Preemptive refresh fail nhưng token vẫn còn hiệu lực, tiếp tục...'
        );
        return true;
      }
    }

    console.log(
      '[AuthService] ensureValidToken: Token hợp lệ, không cần refresh'
    );
    return true;
  }
}
