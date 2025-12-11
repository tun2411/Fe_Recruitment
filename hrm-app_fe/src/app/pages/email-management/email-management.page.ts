import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
  IonLabel,
  IonList,
  IonItem,
  IonMenu,
  ToastController,
} from '@ionic/angular/standalone';
import { MenuController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  mailOutline,
  createOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  chevronForwardOutline,
  addOutline,
  logOutOutline,
  personCircleOutline,
} from 'ionicons/icons';
import {
  TemplateService,
  TemplateResponse,
} from '../../services/template.service';
import { AuthService } from '../../services/auth.service';
import { BusinessService } from '../../services/business.service';
import {
  NotificationService,
  Notification,
} from '../../services/notification.service';
import { firstValueFrom } from 'rxjs';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

export interface EmailTemplateItem {
  id: number;
  name: string;
  type: 'pass' | 'fail' | 'apply_confirm';
  subject: string;
  content: string;
  lastModified: string;
  isActive: boolean;
}

@Component({
  selector: 'app-email-management',
  templateUrl: './email-management.page.html',
  styleUrls: ['./email-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonLabel,
    IonList,
    IonItem,
    IonMenu,
    BottomNavComponent,
    AppHeaderComponent,
  ],
})
export class EmailManagementPage implements OnInit {
  emailTemplates: EmailTemplateItem[] = [];
  selectedCategory: 'pass' | 'fail' | 'apply_confirm' | null = null;
  templatesByCategory: { [key: string]: EmailTemplateItem[] } = {
    pass: [],
    fail: [],
    apply_confirm: [],
  };
  userName: string = '';
  currentDate: string = '';
  notificationCount: number = 0;
  userInfo: any = null;

  categories = [
    {
      type: 'apply_confirm' as const,
      label: 'Mẫu email khi ứng viên nộp CV',
      icon: 'mail-outline',
      color: '#3880ff',
      bgColor: '#e3f2fd',
    },
    {
      type: 'pass' as const,
      label: 'Mẫu email Pass',
      icon: 'checkmark-circle-outline',
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      type: 'fail' as const,
      label: 'Mẫu email Fail',
      icon: 'close-circle-outline',
      color: '#c62828',
      bgColor: '#ffebee',
    },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private templateService: TemplateService,
    private toastController: ToastController,
    private authService: AuthService,
    private businessService: BusinessService,
    private notificationService: NotificationService,
    private menuController: MenuController
  ) {
    addIcons({
      arrowBackOutline,
      mailOutline,
      createOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      chevronForwardOutline,
      addOutline,
      logOutOutline,
      personCircleOutline,
    });
  }

  async ngOnInit() {
    this.updateCurrentDate();
    this.loadUserInfo();
    this.loadNotificationCount();
    this.loadEmailTemplates();
  }

  ionViewWillEnter() {
    const openMenu = this.route.snapshot.queryParamMap.get('openMenu');
    if (openMenu === 'true') {
      this.menuController
        .open('main-menu')
        .catch((err) =>
          console.error(
            '[EmailManagementPage] Error auto opening main-menu:',
            err
          )
        );
    }
    // Reload templates khi quay lại từ template-editor
    this.loadEmailTemplates();
  }

  updateCurrentDate() {
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    this.currentDate = `${days[today.getDay()]}, ${today.getDate()} ${
      months[today.getMonth()]
    }`;
  }

  loadUserInfo() {
    // Load userInfo từ AuthService
    this.authService.currentUser$.subscribe((user: any) => {
      this.userInfo = user;
    });

    // Option 1: Lấy từ BusinessService (companyName)
    this.businessService.getCurrentBusiness().subscribe({
      next: (business: any) => {
        this.userName = business.companyName || business.email || 'User';
      },
      error: (error: any) => {
        console.error('Error loading business info:', error);
        // Fallback: Lấy từ AuthService
        this.authService.currentUser$.subscribe((user: any) => {
          this.userName = user?.fullName || user?.username || 'User';
        });
      },
    });
  }

  loadNotificationCount() {
    this.notificationService.getNotifications().subscribe({
      next: (notifications: Notification[]) => {
        this.notificationCount = notifications.filter((n) => !n.isRead).length;
      },
      error: (error: any) => {
        console.error(
          '[EmailManagementPage] Error loading notification count:',
          error
        );
        this.notificationCount = 0;
      },
    });
  }

  onNotificationClick() {
    this.router.navigate(['/notifications']);
  }

  async loadEmailTemplates() {
    try {
      // Load tất cả templates (không filter)
      const response = await firstValueFrom(
        this.templateService.getTemplates()
      );

      // Convert TemplateResponse sang EmailTemplateItem và group theo type
      this.emailTemplates = (response.templates || []).map((template) => ({
        id: template.formId,
        name: template.formName || 'Unnamed Template',
        type: template.type,
        subject: template.subject || '',
        content: template.content || '',
        lastModified: this.formatDate(template.updatedAt || template.createdAt),
        isActive: true,
      }));

      // Group templates theo category
      this.templatesByCategory = {
        pass: [],
        fail: [],
        apply_confirm: [],
      };

      this.emailTemplates.forEach((template) => {
        if (this.templatesByCategory[template.type]) {
          this.templatesByCategory[template.type].push(template);
        }
      });
    } catch (error: any) {
      console.error('Error loading email templates:', error);

      // Fallback: khởi tạo empty arrays
      this.templatesByCategory = {
        pass: [],
        fail: [],
        apply_confirm: [],
      };
    }
  }

  onCategoryClick(categoryType: 'pass' | 'fail' | 'apply_confirm') {
    // Toggle: nếu đã chọn category này thì đóng lại, nếu chưa thì mở
    if (this.selectedCategory === categoryType) {
      this.selectedCategory = null;
    } else {
      this.selectedCategory = categoryType;
      // Load templates cho category này nếu chưa có
      if (this.templatesByCategory[categoryType].length === 0) {
        this.loadTemplatesForCategory(categoryType);
      }
    }
  }

  async loadTemplatesForCategory(
    categoryType: 'pass' | 'fail' | 'apply_confirm'
  ) {
    try {
      const response = await firstValueFrom(
        this.templateService.getTemplates(categoryType)
      );

      this.templatesByCategory[categoryType] = (response.templates || []).map(
        (template) => ({
          id: template.formId,
          name: template.formName || 'Unnamed Template',
          type: template.type,
          subject: template.subject || '',
          content: template.content || '',
          lastModified: this.formatDate(
            template.updatedAt || template.createdAt
          ),
          isActive: true,
        })
      );
    } catch (error: any) {
      console.error(`Error loading templates for ${categoryType}:`, error);
    }
  }

  getTemplatesForCategory(
    categoryType: 'pass' | 'fail' | 'apply_confirm'
  ): EmailTemplateItem[] {
    return this.templatesByCategory[categoryType] || [];
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Chưa có';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Chưa có';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;

      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      return 'Chưa có';
    }
  }

  getTemplateTypeLabel(type: string): string {
    switch (type) {
      case 'apply_confirm':
        return 'Xác nhận ứng tuyển';
      case 'pass':
        return 'Thông báo Pass';
      case 'fail':
        return 'Thông báo Fail';
      default:
        return 'Email template';
    }
  }

  getTemplateIcon(type: string): string {
    switch (type) {
      case 'apply_confirm':
        return 'mail-outline';
      case 'pass':
        return 'checkmark-circle-outline';
      case 'fail':
        return 'close-circle-outline';
      default:
        return 'document-text-outline';
    }
  }

  getTemplateColor(type: string): string {
    switch (type) {
      case 'apply_confirm':
        return '#3880ff';
      case 'pass':
        return '#2e7d32';
      case 'fail':
        return '#c62828';
      default:
        return '#666';
    }
  }

  getTemplateBgColor(type: string): string {
    switch (type) {
      case 'apply_confirm':
        return '#e3f2fd';
      case 'pass':
        return '#e8f5e9';
      case 'fail':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  }

  onBack() {
    this.router.navigate(['/home']);
  }

  onTemplateClick(template: EmailTemplateItem) {
    // Navigate to template editor để chỉnh sửa
    this.router.navigate(['/template-editor'], {
      queryParams: {
        templateId: template.id,
        type: template.type,
        editMode: 'true',
        formName: template.name,
        subject: template.subject,
        content: template.content,
      },
    });
  }

  onCreateNew(categoryType?: 'pass' | 'fail' | 'apply_confirm') {
    const queryParams: any = {};
    if (categoryType) {
      queryParams.type = categoryType;
    }
    this.router.navigate(['/template-editor'], { queryParams });
  }

  isCategorySelected(categoryType: 'pass' | 'fail' | 'apply_confirm'): boolean {
    return this.selectedCategory === categoryType;
  }

  getCategoryLabel(
    categoryType: 'pass' | 'fail' | 'apply_confirm' | null
  ): string {
    if (!categoryType) return '';
    const category = this.categories.find((c) => c.type === categoryType);
    return category?.label || '';
  }

  // Bottom navigation handlers (đồng bộ với Home & Dashboard)
  onNavigateDashboard() {
    this.router.navigate(['/dashboard']);
  }

  onNavigateJobs() {
    this.router.navigate(['/home']);
  }
}
