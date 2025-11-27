import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
// Use hybrid service (plugin-based)
import { GoogleSignInHybridService } from './services/google-signin-hybrid.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private googleSignInService: GoogleSignInHybridService) {}

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
  }
}
