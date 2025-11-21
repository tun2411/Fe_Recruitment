import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { GoogleSignInService } from './services/google-signin.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private googleSignInService: GoogleSignInService) {}

  async ngOnInit() {
    // Khởi tạo Google Sign-In khi app start
    try {
      await this.googleSignInService.initialize();
    } catch (error) {
      console.warn('Google Sign-In initialization failed:', error);
      // Không block app nếu Google Sign-In init fail
    }
  }
}
