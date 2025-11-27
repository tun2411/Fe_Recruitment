import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmark,
  close,
  documentTextOutline,
  notificationsOutline,
} from 'ionicons/icons';

export interface Notification {
  id: number;
  type: 'confirmed' | 'rejected' | 'applied';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

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
    IonLabel,
  ],
})
export class NotificationsPage implements OnInit {
  notifications: Notification[] = [];

  constructor(private router: Router) {
    addIcons({
      arrowBackOutline,
      checkmark,
      close,
      documentTextOutline,
      notificationsOutline,
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    // Mock data - sau này sẽ load từ API
    this.notifications = [
      {
        id: 1,
        type: 'confirmed',
        title: 'Ứng viên xác nhận',
        message: '{Name} xác nhận tham gia {Vòng...}',
        timestamp: '12:00 PM',
        isRead: false,
      },
      {
        id: 2,
        type: 'rejected',
        title: 'Ứng viên xác nhận',
        message: '{Name} xác nhận tham gia {Vòng...}',
        timestamp: '12:00 PM',
        isRead: false,
      },
      {
        id: 3,
        type: 'applied',
        title: 'Ứng viên ứng tuyển',
        message: '{Name} ứng tuyển vào {Job Name}',
        timestamp: '12:00 PM',
        isRead: false,
      },
    ];
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'confirmed':
        return 'checkmark';
      case 'rejected':
        return 'close';
      case 'applied':
        return 'document-text-outline';
      default:
        return 'document-text-outline';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'confirmed':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'applied':
        return 'primary';
      default:
        return 'medium';
    }
  }

  getNotificationBgColor(type: string): string {
    switch (type) {
      case 'confirmed':
        return '#e8f5e9';
      case 'rejected':
        return '#ffebee';
      case 'applied':
        return '#e3f2fd';
      default:
        return '#f5f5f5';
    }
  }

  getNotificationIconColor(type: string): string {
    switch (type) {
      case 'confirmed':
        return '#2e7d32';
      case 'rejected':
        return '#c62828';
      case 'applied':
        return '#1565c0';
      default:
        return '#666';
    }
  }

  onBack() {
    this.router.navigate(['/home']);
  }

  onNotificationClick(notification: Notification) {
    // Mark as read
    notification.isRead = true;
    // Có thể navigate đến chi tiết notification hoặc job/candidate
    console.log('Notification clicked:', notification);
  }
}

