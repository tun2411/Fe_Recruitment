import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonBadge,
  IonAvatar,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  personOutline,
  arrowDownOutline,
  refreshOutline,
  filterOutline,
  addOutline,
  starOutline,
  star,
  eyeOutline,
  downloadOutline,
} from 'ionicons/icons';

export interface Candidate {
  id: number;
  fullName: string;
  position: string;
  email: string;
  phone: string;
  status: 'pass' | 'fail' | 'new';
  round: number;
  isFavorite: boolean;
}

@Component({
  selector: 'app-candidates',
  templateUrl: './candidates.page.html',
  styleUrls: ['./candidates.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonBadge,
    IonAvatar,
    IonFab,
    IonFabButton,
  ],
})
export class CandidatesPage implements OnInit {
  candidates: Candidate[] = [];
  filteredCandidates: Candidate[] = [];
  searchTerm: string = '';
  notificationCount: number = 2;
  filterCount: number = 2;
  postId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      notificationsOutline,
      personOutline,
      arrowDownOutline,
      refreshOutline,
      filterOutline,
      addOutline,
      starOutline,
      star,
      eyeOutline,
      downloadOutline,
    });
  }

  ngOnInit() {
    // Lấy postId từ query params nếu có
    this.route.queryParams.subscribe((params) => {
      this.postId = params['postId'] ? parseInt(params['postId']) : null;
      this.loadCandidates();
    });
  }

  loadCandidates() {
    // Fix cứng data ứng viên
    this.candidates = [
      {
        id: 1,
        fullName: 'Nguyễn Văn A',
        position: 'Senior Developer',
        email: 'nguyenvana@email.com',
        phone: '0123456789',
        status: 'pass',
        round: 1,
        isFavorite: false,
      },
      {
        id: 2,
        fullName: 'Trần Thị B',
        position: 'UI/UX Designer',
        email: 'tranthib@email.com',
        phone: '0987654321',
        status: 'fail',
        round: 1,
        isFavorite: true,
      },
      {
        id: 3,
        fullName: 'Lê Văn C',
        position: 'Frontend Developer',
        email: 'levanc@email.com',
        phone: '0111222333',
        status: 'new',
        round: 0,
        isFavorite: true,
      },
      {
        id: 4,
        fullName: 'Phạm Thị D',
        position: 'Backend Developer',
        email: 'phamthid@email.com',
        phone: '0444555666',
        status: 'pass',
        round: 2,
        isFavorite: false,
      },
      {
        id: 5,
        fullName: 'Hoàng Văn E',
        position: 'Full Stack Developer',
        email: 'hoangvane@email.com',
        phone: '0777888999',
        status: 'new',
        round: 0,
        isFavorite: false,
      },
    ];
    this.filteredCandidates = [...this.candidates];
  }

  onSearch(event: any) {
    this.searchTerm = event.detail.value || '';
    this.filterCandidates();
  }

  filterCandidates() {
    if (!this.searchTerm.trim()) {
      this.filteredCandidates = [...this.candidates];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCandidates = this.candidates.filter(
      (candidate) =>
        candidate.fullName.toLowerCase().includes(term) ||
        candidate.position.toLowerCase().includes(term) ||
        candidate.email.toLowerCase().includes(term) ||
        candidate.phone.includes(term)
    );
  }

  onSort() {
    // Toggle sort order
    this.filteredCandidates.reverse();
  }

  onRefresh() {
    setTimeout(() => {
      this.loadCandidates();
    }, 1000);
  }

  onFilter() {
    console.log('Filter clicked');
  }

  toggleFavorite(candidate: Candidate) {
    candidate.isFavorite = !candidate.isFavorite;
  }

  onView(candidate: Candidate) {
    console.log('View candidate:', candidate.id);
    // Navigate to candidate detail page
  }

  onDownload(candidate: Candidate) {
    console.log('Download candidate CV:', candidate.id);
  }

  onNotificationClick() {
    console.log('Notification clicked');
  }

  onAddCandidate() {
    console.log('Add new candidate');
  }

  getStatusLabel(candidate: Candidate): string {
    switch (candidate.status) {
      case 'pass':
        return 'Pass vòng ' + candidate.round;
      case 'fail':
        return 'Fail';
      case 'new':
        return 'New';
      default:
        return '';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pass':
        return 'success';
      case 'fail':
        return 'danger';
      case 'new':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getCardColorClass(status: string): string {
    switch (status) {
      case 'pass':
        return 'card-pass';
      case 'fail':
        return 'card-fail';
      case 'new':
        return 'card-new';
      default:
        return 'card-new';
    }
  }
}

