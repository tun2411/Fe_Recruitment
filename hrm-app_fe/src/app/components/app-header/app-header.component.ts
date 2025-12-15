import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge,
  IonMenuButton,
  IonBackButton,
  IonAvatar,
  IonMenuToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  personCircleOutline,
  notificationsOutline,
  arrowBackOutline,
  menuOutline,
} from 'ionicons/icons';

export type HeaderType = 'dashboard' | 'standard' | 'simple';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonIcon,
    IonBadge,
    IonMenuButton,
    IonBackButton,
    IonAvatar,
    IonMenuToggle,
  ],
})
export class AppHeaderComponent {
  @Input() type: HeaderType = 'standard';
  @Input() title: string = '';
  @Input() showNotification: boolean = true;
  @Input() notificationCount: number = 0;
  @Input() userName: string = '';
  @Input() currentDate: string = '';
  @Input() showBackButton: boolean = false;
  @Input() showMenuButton: boolean = false;
  @Input() backButtonDefaultHref: string = '';
  @Input() showAvatar: boolean = false; // For standard type with avatar

  @Output() notificationClick = new EventEmitter<void>();
  @Output() backClick = new EventEmitter<void>();
  @Output() menuClick = new EventEmitter<void>();

  constructor() {
    addIcons({
      personOutline,
      personCircleOutline,
      notificationsOutline,
      arrowBackOutline,
      menuOutline,
    });
  }

  onNotificationClick() {
    this.notificationClick.emit();
  }

  onBackClick() {
    this.backClick.emit();
  }

  onMenuClick() {
    this.menuClick.emit();
  }
}
