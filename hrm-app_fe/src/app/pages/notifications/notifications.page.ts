import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
  IonLabel,
  LoadingController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmark,
  close,
  documentTextOutline,
  notificationsOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  personAddOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import {
  NotificationService,
  Notification,
} from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardContent,
  ],
})
export class NotificationsPage implements OnInit {
  notifications: Notification[] = [];
  isLoading = false;

  constructor(
    private router: Router,
    private location: Location,
    private notificationService: NotificationService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      checkmark,
      close,
      documentTextOutline,
      notificationsOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      personAddOutline,
      informationCircleOutline,
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  async loadNotifications() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Đang tải thông báo...',
      spinner: 'crescent',
    });
    await loading.present();

    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        // Sort theo thời gian (mới nhất trước)
        this.notifications = notifications.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        loading.dismiss();
        this.isLoading = false;
      },
      error: async (error) => {
        await loading.dismiss();
        this.isLoading = false;
        const toast = await this.toastController.create({
          message: error.message || 'Không thể tải thông báo',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'pass':
        return 'checkmark-circle-outline';
      case 'fail':
        return 'close-circle-outline';
      case 'new_application':
        return 'person-add-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'pass':
        return 'success';
      case 'fail':
        return 'danger';
      case 'new_application':
        return 'primary';
      case 'system':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getNotificationBgColor(type: string): string {
    switch (type) {
      case 'pass':
        return '#e8f5e9';
      case 'fail':
        return '#ffebee';
      case 'new_application':
        return '#e3f2fd';
      case 'system':
        return '#f5f5f5';
      default:
        return '#f5f5f5';
    }
  }

  getNotificationIconColor(type: string): string {
    switch (type) {
      case 'pass':
        return '#2e7d32';
      case 'fail':
        return '#c62828';
      case 'new_application':
        return '#1565c0';
      case 'system':
        return '#666';
      default:
        return '#666';
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;

    // Format full date nếu quá 7 ngày
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('vi-VN', options);
  }

  onBack() {
    // Back về trang trước đó thay vì hardcode về dashboard
    this.location.back();
  }

  async onNotificationClick(notification: Notification) {
    // Mark as read nếu chưa đọc
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          // Update local state
          notification.isRead = true;
        },
        error: async (error) => {
          const toast = await this.toastController.create({
            message: error.message || 'Không thể đánh dấu đã đọc',
            duration: 2000,
            color: 'warning',
            position: 'top',
          });
          await toast.present();
        },
      });
    }

    // Navigate dựa trên type và applicationId
    if (notification.applicationId) {
      // Navigate đến application detail
      this.router.navigate(['/application-detail', notification.applicationId]);
    } else if (notification.type === 'system') {
      // Navigate đến dashboard hoặc jobs list
      this.router.navigate(['/dashboard']);
    }
  }
}
