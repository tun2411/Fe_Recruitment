import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

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
  username: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userInfoKey = 'user_info';
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(
    this.getUserInfo()
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Gọi API thật
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
    this.clearUserInfo();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
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
    // Kiểm tra token có hết hạn không (nếu cần)
    // Có thể decode JWT và kiểm tra exp
    return true;
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
