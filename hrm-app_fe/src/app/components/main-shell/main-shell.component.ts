import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonMenuToggle,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { MenuController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personOutline,
  personCircleOutline,
  briefcaseOutline,
  mailOutline,
  gridOutline,
  logOutOutline,
} from 'ionicons/icons';
// Use hybrid service (plugin-based)
import { GoogleSignInHybridService } from '../../services/google-signin-hybrid.service';
import { AuthService } from '../../services/auth.service';
import { BusinessService } from '../../services/business.service';

@Component({
  selector: 'app-main-shell',
  templateUrl: './main-shell.component.html',
  styleUrls: ['./main-shell.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonMenuToggle,
    IonRouterOutlet,
  ],
})
export class MainShellComponent implements OnInit {
  userInfo: any = null;
  userName: string = '';

  constructor(
    private googleSignInService: GoogleSignInHybridService,
    private authService: AuthService,
    private businessService: BusinessService,
    private router: Router,
    private menuController: MenuController
  ) {
    addIcons({
      personOutline,
      personCircleOutline,
      briefcaseOutline,
      mailOutline,
      gridOutline,
      logOutOutline,
    });
  }

  async ngOnInit() {
    // Enable menu khi shell được load
    try {
      await this.menuController.enable(true, 'main-menu');
    } catch (e) {
      console.warn('[MainShellComponent] Failed to enable menu:', e);
    }

    // Load user info
    this.loadUserInfo();
  }

  loadUserInfo() {
    // Load userInfo từ AuthService
    this.authService.currentUser$.subscribe((user) => {
      this.userInfo = user;
    });

    // Lấy từ BusinessService (companyName)
    this.businessService.getCurrentBusiness().subscribe({
      next: (business) => {
        this.userName = business.companyName || business.email || 'User';
      },
      error: (error) => {
        console.error('Error loading business info:', error);
        // Fallback: Lấy từ AuthService
        this.authService.currentUser$.subscribe((user) => {
          this.userName = user?.fullName || user?.username || 'User';
        });
      },
    });
  }

  async onLogout() {
    try {
      // Đăng xuất khỏi Google (đặc biệt quan trọng trên Android với plugin)
      if (this.googleSignInService && this.googleSignInService.isReady()) {
        await this.googleSignInService.signOut();
        console.log('[MainShellComponent] Google Sign-Out completed');
      }
    } catch (err) {
      console.warn(
        '[MainShellComponent] Google Sign-Out failed (non-blocking):',
        err
      );
    } finally {
      // Đóng và disable menu trước khi điều hướng về màn hình đăng nhập
      try {
        await this.menuController.close('main-menu');
        await this.menuController.enable(false, 'main-menu');
      } catch (e) {
        console.warn('[MainShellComponent] Failed to close menu on logout:', e);
      }
      // Luôn luôn clear session trong app và điều hướng về trang login
      this.authService.logout();
    }
  }

  openPersonalInfoFromMenu() {
    // Đi tới màn Thông tin cá nhân, đánh dấu đến từ menu
    // và lưu lại trang hiện tại để khi Back quay về đúng trang + mở lại menu
    const currentUrl = this.router.url.split('?')[0] || '/home';

    this.router.navigate(['/personal-info'], {
      queryParams: {
        fromMenu: 'true',
        returnUrl: currentUrl,
      },
    });
  }
}

