import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonCard,
  IonCardContent,
  IonButton,
  IonItem,
  IonLabel,
  IonBadge,
  IonList,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  settingsOutline,
  briefcaseOutline,
  peopleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  documentTextOutline,
  megaphoneOutline,
  gridOutline,
  mailOutline,
} from 'ionicons/icons';
import {
  NotificationService,
  Notification,
} from '../../services/notification.service';
import { ApplicationService } from '../../services/application.service';
import { JobPostService } from '../../services/job-post.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonBadge,
    IonList,
  ],
})
export class DashboardPage implements OnInit {
  metrics = {
    openJobs: 0,
    newCandidates: 0,
    passed: 0,
    failed: 0,
  };

  notifications: Notification[] = [];
  unreadCount: number = 0;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private applicationService: ApplicationService,
    private jobPostService: JobPostService,
    private toastController: ToastController
  ) {
    addIcons({
      personCircleOutline,
      settingsOutline,
      briefcaseOutline,
      peopleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      documentTextOutline,
      megaphoneOutline,
      gridOutline,
      mailOutline,
    });
  }

  ngOnInit() {
    this.loadNotifications();
    this.loadJobCount();
  }

  loadJobCount() {
    this.jobPostService.getAllJobPosts('active').subscribe({
      next: (jobs: any[]) => {
        this.metrics.openJobs = jobs.length;
      },
      error: (error: any) => {
        console.error('Error loading job count:', error);
      },
    });
  }

  async loadNotifications() {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.unreadCount = notifications.filter((n) => !n.isRead).length;
        this.updateMetrics();
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      },
    });
  }

  updateMetrics() {
    // Count applications by status from notifications
    this.metrics.newCandidates = this.notifications.filter(
      (n) => n.type === 'new_application' && !n.isRead
    ).length;
    this.metrics.passed = this.notifications.filter(
      (n) => n.type === 'pass'
    ).length;
    this.metrics.failed = this.notifications.filter(
      (n) => n.type === 'fail'
    ).length;
  }

  async onNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        },
      });
    }

    // Navigate based on notification type
    if (notification.applicationId) {
      // Navigate to application detail
      // We need jobId, so we might need to load it or pass it differently
      this.router.navigate(['/application-detail', notification.applicationId]);
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'new_application':
        return 'document-text-outline';
      case 'pass':
        return 'checkmark-circle-outline';
      case 'fail':
        return 'close-circle-outline';
      case 'system':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'new_application':
        return 'primary';
      case 'pass':
        return 'success';
      case 'fail':
        return 'danger';
      case 'system':
        return 'medium';
      default:
        return 'primary';
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }

  onSettingsClick() {
    console.log('Settings clicked');
  }

  onProfileClick() {
    this.router.navigate(['/personal-info']);
  }

  navigateToDashboard() {
    // Already on dashboard, do nothing
  }

  navigateToJobs() {
    this.router.navigate(['/home']);
  }

  navigateToMessages() {
    console.log('Navigate to messages');
  }
}
