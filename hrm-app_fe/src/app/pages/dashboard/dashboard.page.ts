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
    IonButton,
  ],
})
export class DashboardPage implements OnInit {
  metrics = {
    openJobs: 12,
    newCandidates: 25,
    passed: 8,
    failed: 3,
  };

  recentActivities = [
    {
      icon: 'document-text-outline',
      iconColor: 'blue',
      dotColor: 'blue',
      title: 'New application for Senior Product Designer.',
      time: '2 hours ago',
    },
    {
      icon: 'checkmark-circle-outline',
      iconColor: 'green',
      dotColor: 'green',
      title: 'Jane Doe accepted the interview invitation.',
      time: 'Yesterday',
    },
    {
      icon: 'megaphone-outline',
      iconColor: 'grey',
      dotColor: 'grey',
      title: 'Your "UX Researcher" job post is now live.',
      time: '2 days ago',
    },
  ];

  constructor(private router: Router) {
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

  ngOnInit() {}

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

