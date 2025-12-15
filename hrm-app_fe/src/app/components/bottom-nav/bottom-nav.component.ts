import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  briefcaseOutline,
  mailOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class BottomNavComponent {
  @Input() activeTab: 'dashboard' | 'jobs' | 'mail' = 'jobs';

  constructor(private router: Router) {
    addIcons({
      gridOutline,
      briefcaseOutline,
      mailOutline,
    });
  }

  navigateToDashboard() {
    if (this.activeTab !== 'dashboard') {
      this.router.navigate(['/dashboard']);
    }
  }

  navigateToJobs() {
    if (this.activeTab !== 'jobs') {
      this.router.navigate(['/home']);
    }
  }

  navigateToMail() {
    if (this.activeTab !== 'mail') {
      this.router.navigate(['/email-management']);
    }
  }
}

