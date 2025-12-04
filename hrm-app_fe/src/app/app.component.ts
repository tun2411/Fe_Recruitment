import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
// Use hybrid service (plugin-based)
import { GoogleSignInHybridService } from './services/google-signin-hybrid.service';
import { AuthService } from './services/auth.service';
import { WebSocketService } from './services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  private authSubscription?: Subscription;

  constructor(
    private googleSignInService: GoogleSignInHybridService,
    private authService: AuthService,
    private wsService: WebSocketService
  ) {}

  async ngOnInit() {
    // Khởi tạo Google Sign-In khi app start
    // Plugin tự động handle web vs native
    try {
      await this.googleSignInService.initialize();
      console.log('✅ App initialized');
    } catch (error) {
      console.warn('⚠️ Google Sign-In init failed (non-blocking):', error);
      // Không block app nếu Google Sign-In init fail
    }

    // Kết nối WebSocket khi user đăng nhập
    this.authSubscription = this.authService.isLoggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        console.log('[AppComponent] User logged in, connecting WebSocket...');
        this.wsService.connect();
      } else {
        console.log('[AppComponent] User logged out, disconnecting WebSocket...');
        this.wsService.disconnect();
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    this.wsService.disconnect();
  }
}
