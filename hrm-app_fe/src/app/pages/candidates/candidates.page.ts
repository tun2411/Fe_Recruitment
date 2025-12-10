import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import {
  IonContent,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonBadge,
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
  chevronDownOutline,
} from 'ionicons/icons';
import {
  ApplicationService,
  Application,
} from '../../services/application.service';
import {
  NotificationService,
  Notification,
} from '../../services/notification.service';
import { JobPostService } from '../../services/job-post.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

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
    IonContent,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonBadge,
    AppHeaderComponent,
  ],
})
export class CandidatesPage implements OnInit {
  candidates: Candidate[] = [];
  filteredCandidates: Candidate[] = [];
  searchTerm: string = '';
  notificationCount: number = 0;
  filterCount: number = 2;
  postId: number | null = null;
  jobTitle: string = '';
  userInfo: any = null;
  userName: string = '';
  currentDate: string = '';
  private authService = inject(AuthService);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private applicationService: ApplicationService,
    private jobPostService: JobPostService,
    private toastController: ToastController,
    private notificationService: NotificationService
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
      chevronDownOutline,
    });
  }

  ngOnInit() {
    // Debug: Kiểm tra token
    const token = this.authService.getToken();
    console.log('[Candidates] ngOnInit - Token exists:', !!token);
    if (token) {
      console.log('[Candidates] Token length:', token.length);
    }

    // Kiểm tra authentication trước khi load data
    if (!this.authService.isAuthenticated()) {
      console.warn('[Candidates] User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    this.updateCurrentDate();
    this.loadUserInfo();
    this.loadNotificationCount();

    // Lấy postId từ query params nếu có
    this.route.queryParams.subscribe((params) => {
      this.postId = params['postId'] ? parseInt(params['postId']) : null;
      if (this.postId) {
        this.loadJobTitle();
        this.loadCandidates();
      } else {
        // Nếu không có postId, không cho truy cập trang này vì không gắn với job nào
        this.showToast(
          'Không tìm thấy bài đăng. Đang quay về danh sách bài đăng.',
          'warning'
        );
        this.candidates = [];
        this.filteredCandidates = [];
        this.router.navigate(['/home']);
      }
    });
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
    this.authService.currentUser$.subscribe((user) => {
      this.userInfo = user;
      this.userName = user?.fullName || user?.username || 'User';
    });
  }

  /**
   * Load job title để hiển thị position cho ứng viên
   */
  loadJobTitle() {
    if (!this.postId) return;

    // Try to load job title, but don't fail if it doesn't work
    this.jobPostService.getJobPostById(this.postId).subscribe({
      next: (jobPost) => {
        this.jobTitle = jobPost.title;
        // Cập nhật position cho tất cả candidates nếu đã load
        if (this.candidates.length > 0) {
          this.candidates.forEach((candidate) => {
            candidate.position = this.jobTitle;
          });
          this.filteredCandidates = [...this.candidates];
        }
      },
      error: (error) => {
        // Silently fail - job title is not critical for candidates list
        console.warn('Could not load job title (non-critical):', error);
        // Use job title from candidates if available
        if (this.candidates.length > 0 && this.candidates[0].position) {
          this.jobTitle = this.candidates[0].position;
        }
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

    this.applicationService.getApplicationsByJobId(this.postId).subscribe({
      next: (applications: Application[]) => {
        // Map Application từ API thành Candidate để hiển thị
        this.candidates = applications.map((app) =>
          this.mapApplicationToCandidate(app)
        );
        this.filteredCandidates = [...this.candidates];
      },
      error: async (error) => {
        console.error('Error loading candidates:', error);
        this.showToast(
          'Không thể tải danh sách ứng viên. Vui lòng thử lại sau.',
          'danger'
        );
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
    this.loadNotificationCount();
  }

  onFilter() {
    console.log('Filter clicked');
  }

  toggleFavorite(candidate: Candidate) {
    candidate.isFavorite = !candidate.isFavorite;
  }

  onView(candidate: Candidate) {
    // Kiểm tra authentication trước khi navigate
    const token = this.authService.getToken();
    console.log('[Candidates] onView - Token exists:', !!token);
    console.log(
      '[Candidates] onView - Application ID:',
      candidate.applicationId
    );

    if (!token) {
      console.error(
        '[Candidates] onView - No token found! Redirecting to login...'
      );
      this.showToast(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        'warning'
      );
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isAuthenticated()) {
      console.warn(
        '[Candidates] onView - User not authenticated! Redirecting to login...'
      );
      this.showToast(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        'warning'
      );
      this.router.navigate(['/login']);
      return;
    }

    if (this.postId) {
      console.log(
        '[Candidates] onView - Navigating to application detail:',
        candidate.applicationId
      );
      this.router.navigate(['/application-detail', candidate.applicationId], {
        queryParams: { jobId: this.postId },
      });
    } else {
      console.error('[Candidates] onView - No postId available!');
      this.showToast('Không tìm thấy thông tin bài đăng', 'warning');
    }
  }

  /**
   * Fix URL: Đồng bộ host CV với IP trong environment, dùng cho cả web và mobile
   */
  private fixUrlForMobile(url: string): string {
    const apiUrl = environment.apiUrl;

    // Lấy base URL từ environment.apiUrl
    let targetBase: string;

    // Nếu apiUrl là full URL (http://IP:port/api)
    const hostMatch = apiUrl.match(/^(https?:\/\/[^/]+:\d+)/);
    if (hostMatch) {
      targetBase = hostMatch[1];
    } else {
      // Nếu apiUrl là relative URL (/api), cần lấy từ window.location hoặc environment
      if (typeof window !== 'undefined') {
        // Web: dùng window.location.origin
        targetBase = window.location.origin;
      } else {
        // Fallback: thử parse từ environment (nếu có YOUR_COMPUTER_IP)
        // Hoặc dùng localhost mặc định
        targetBase = 'http://localhost:8080';
      }
    }

    // Nếu URL không có protocol (relative URL), thêm base URL
    if (!url.match(/^https?:\/\//)) {
      return `${targetBase}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    // Thay mọi host:port (localhost:8080 hoặc IP:8080 cũ) bằng host mới từ environment
    return url.replace(/https?:\/\/[^/]+:\d+/g, targetBase);
  }

  async onDownload(candidate: Candidate) {
    if (!candidate.cvFilePath) {
      this.showToast('Không tìm thấy file CV', 'warning');
      return;
    }

    try {
      const cvUrl = candidate.cvFilePath;
      // Chuyển view thành download
      let downloadUrl = cvUrl.replace('/cv/view?', '/cv/download?');

      // Fix URL cho mobile (thay localhost bằng IP thực tế)
      downloadUrl = this.fixUrlForMobile(downloadUrl);

      console.log('[Candidates] Downloading CV URL:', downloadUrl);

      // Download CV qua HttpClient
      this.http.get(downloadUrl, { responseType: 'blob' }).subscribe({
        next: async (blob) => {
          const fileName = `CV_${candidate.fullName || 'candidate'}.pdf`;

          // Trên mobile: Lưu vào Filesystem
          if (Capacitor.isNativePlatform()) {
            try {
              // Convert blob to base64 (PDF là binary file)
              const reader = new FileReader();
              reader.onloadend = async () => {
                try {
                  // Lấy base64 data (bỏ phần data:application/pdf;base64,)
                  const base64Data = (reader.result as string).split(',')[1];

                  // Lưu file PDF vào Documents directory (KHÔNG dùng encoding cho binary file)
                  const result = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Documents,
                    // KHÔNG set encoding cho binary file (PDF)
                  });

                  console.log('[Candidates] File saved:', result.uri);
                  console.log('[Candidates] File path:', result.uri);

                  this.showToast(
                    `Đã tải CV thành công!\nFile: ${fileName}`,
                    'success'
                  );
                } catch (error) {
                  console.error('[Candidates] Error saving file:', error);
                  this.showToast(
                    'Không thể lưu CV. Vui lòng thử lại.',
                    'danger'
                  );
                }
              };
              reader.onerror = () => {
                this.showToast('Lỗi khi đọc file CV.', 'danger');
              };
              // Đọc blob dưới dạng data URL (base64)
              reader.readAsDataURL(blob);
            } catch (error) {
              console.error('[Candidates] Error processing blob:', error);
              this.showToast('Không thể xử lý file CV.', 'danger');
            }
          } else {
            // Web: Dùng blob download approach
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up blob URL
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

            this.showToast('Đã tải CV thành công', 'success');
          }
        },
        error: async (error) => {
          console.error('[Candidates] Error downloading CV:', error);
          console.error('[Candidates] Error status:', error.status);
          console.error('[Candidates] Error URL:', error.url);
          this.showToast('Không thể tải CV. Vui lòng thử lại.', 'danger');
        },
      });
    } catch (error) {
      console.error('[Candidates] Error downloading CV:', error);
      this.showToast('Không thể tải CV. Vui lòng thử lại.', 'danger');
    }
  }

  // getFullCVUrl() đã bị xóa - Backend trả về full URL sẵn, không cần xử lý

  onNotificationClick() {
    this.router.navigate(['/notifications']);
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

  private loadNotificationCount() {
    this.notificationService.getNotifications().subscribe({
      next: (notifications: Notification[]) => {
        this.notificationCount = notifications.filter((n) => !n.isRead).length;
      },
      error: (error) => {
        console.error(
          '[CandidatesPage] Error loading notification count:',
          error
        );
        this.notificationCount = 0;
      },
    });
  }
}
