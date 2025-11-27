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
  LoadingController,
  ToastController,
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
import { ApplicationService, Application } from '../../services/application.service';
import { JobPostService } from '../../services/job-post.service';
import { environment } from '../../../environments/environment';

export interface Candidate {
  id: number;
  applicationId: number;
  fullName: string;
  position: string;
  email: string;
  phone: string;
  status: 'pass' | 'fail' | 'new';
  round: number;
  isFavorite: boolean;
  cvFileId?: number;
  cvFilePath?: string;
  cvFileName?: string;
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
  jobTitle: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private applicationService: ApplicationService,
    private jobPostService: JobPostService,
    private loadingController: LoadingController,
    private toastController: ToastController
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
      if (this.postId) {
        this.loadJobTitle();
        this.loadCandidates();
      } else {
        // Nếu không có postId, hiển thị thông báo
        this.showToast('Không tìm thấy bài đăng', 'warning');
        this.candidates = [];
        this.filteredCandidates = [];
      }
    });
  }

  /**
   * Load job title để hiển thị position cho ứng viên
   */
  loadJobTitle() {
    if (!this.postId) return;

    this.jobPostService.getJobPostById(this.postId).subscribe({
      next: (jobPost) => {
        this.jobTitle = jobPost.title;
        // Cập nhật position cho tất cả candidates nếu đã load
        if (this.candidates.length > 0) {
          this.candidates.forEach(candidate => {
            candidate.position = this.jobTitle;
          });
          this.filteredCandidates = [...this.candidates];
        }
      },
      error: (error) => {
        console.error('Error loading job title:', error);
      },
    });
  }

  /**
   * Load danh sách ứng viên từ API
   */
  async loadCandidates() {
    if (!this.postId) {
      this.candidates = [];
      this.filteredCandidates = [];
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Đang tải danh sách ứng viên...',
      spinner: 'crescent',
    });
    await loading.present();

    this.applicationService.getApplicationsByJobId(this.postId).subscribe({
      next: (applications: Application[]) => {
        // Map Application từ API thành Candidate để hiển thị
        this.candidates = applications.map((app) => this.mapApplicationToCandidate(app));
        this.filteredCandidates = [...this.candidates];
        loading.dismiss();

        if (this.candidates.length === 0) {
          this.showToast('Chưa có ứng viên nào ứng tuyển cho bài đăng này', 'info');
        }
      },
      error: async (error) => {
        loading.dismiss();
        console.error('Error loading candidates:', error);
        this.showToast('Không thể tải danh sách ứng viên. Vui lòng thử lại sau.', 'danger');
        this.candidates = [];
        this.filteredCandidates = [];
      },
    });
  }

  /**
   * Chuyển đổi Application từ API thành Candidate để hiển thị
   */
  private mapApplicationToCandidate(application: Application): Candidate {
    // Map status từ API (NEW, IN_PROCESS, PASS, FAIL) sang status của Candidate
    let status: 'pass' | 'fail' | 'new' = 'new';
    const statusUpper = application.status?.toUpperCase();
    if (statusUpper === 'NEW' || statusUpper === 'IN_PROCESS') {
      status = 'new';
    } else if (statusUpper === 'PASS' || statusUpper === 'PASSED') {
      status = 'pass';
    } else if (statusUpper === 'FAIL' || statusUpper === 'FAILED') {
      status = 'fail';
    }

    // Backend trả về cvUrl thay vì cvFilePath, cvFileName, cvFileId
    // Parse cvUrl để lấy fileName nếu cần
    let cvFileName = '';
    let cvFilePath = application.cvUrl || '';
    if (cvFilePath) {
      // Extract filename from URL path
      const pathParts = cvFilePath.split('/');
      cvFileName = pathParts[pathParts.length - 1] || '';
    }

    return {
      id: application.candidateId,
      applicationId: application.applicationId,
      fullName: application.candidateFullName,
      position: this.jobTitle || 'Ứng viên',
      email: application.candidateEmail,
      phone: application.candidatePhone,
      status: status,
      round: application.currentRoundIndex,
      isFavorite: false,
      cvFilePath: cvFilePath, // Sử dụng cvUrl từ backend
      cvFileName: cvFileName,
    };
  }

  /**
   * Hiển thị toast message
   */
  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
    });
    await toast.present();
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
    this.loadCandidates();
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
    if (candidate.cvFilePath) {
      // Backend trả về cvUrl (có thể là relative path hoặc full URL)
      let downloadUrl = candidate.cvFilePath;

      // Nếu là relative path (bắt đầu bằng /), cần thêm backend URL
      if (downloadUrl.startsWith('/') && !downloadUrl.startsWith('http')) {
        // Nếu dùng proxy, backend URL là http://localhost:8080
        // Nếu không dùng proxy, lấy từ environment
        const backendUrl = environment.apiUrl.startsWith('http')
          ? environment.apiUrl.replace('/api', '')
          : 'http://localhost:8080';
        downloadUrl = `${backendUrl}${candidate.cvFilePath}`;
      }

      // Mở link download trong tab mới
      window.open(downloadUrl, '_blank');
      console.log('Download CV:', candidate.cvFileName || candidate.cvFilePath);
    } else {
      this.showToast('Không tìm thấy file CV', 'warning');
    }
  }

  onNotificationClick() {
    console.log('Notification clicked');
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

