import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
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
import {
  ApplicationService,
  Application,
} from '../../services/application.service';
import { JobPostService } from '../../services/job-post.service';
import { AuthService } from '../../services/auth.service';
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
  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  pages: number[] = [];
  private authService = inject(AuthService);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
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
        this.updatePagination();
      }
    });
  }

  /**
   * Getter để lấy danh sách candidates hiển thị trên trang hiện tại (tối đa 5 items)
   */
  get displayedCandidates(): Candidate[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredCandidates.slice(startIndex, startIndex + this.pageSize);
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
          this.candidates.forEach(candidate => {
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

    const loading = await this.loadingController.create({
      message: 'Đang tải danh sách ứng viên...',
      spinner: 'crescent',
    });
    await loading.present();

    this.applicationService.getApplicationsByJobId(this.postId).subscribe({
      next: (applications: Application[]) => {
        // Map Application từ API thành Candidate để hiển thị
        this.candidates = applications.map((app) =>
          this.mapApplicationToCandidate(app)
        );
        this.filteredCandidates = [...this.candidates];
        this.currentPage = 1;
        this.updatePagination();
        loading.dismiss();

        if (this.candidates.length === 0) {
          this.showToast(
            'Chưa có ứng viên nào ứng tuyển cho bài đăng này',
            'info'
          );
        }
      },
      error: async (error) => {
        loading.dismiss();
        console.error('Error loading candidates:', error);
        this.showToast(
          'Không thể tải danh sách ứng viên. Vui lòng thử lại sau.',
          'danger'
        );
        this.candidates = [];
        this.filteredCandidates = [];
        this.updatePagination();
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
      this.currentPage = 1;
      this.updatePagination();
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
    this.currentPage = 1;
    this.updatePagination();
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
   * Fix URL: Thay localhost bằng IP thực tế trên mobile
   */
  private fixUrlForMobile(url: string): string {
    if (!Capacitor.isNativePlatform()) {
      return url; // Web: giữ nguyên
    }

    // Mobile: Thay localhost bằng IP từ environment
    // Extract IP từ apiUrl: http://192.168.1.10:8080/api -> 192.168.1.10
    const apiUrl = environment.apiUrl;
    const ipMatch = apiUrl.match(/http:\/\/([^:]+):/);
    if (ipMatch && ipMatch[1]) {
      const ip = ipMatch[1];
      return url.replace(/http:\/\/localhost:8080/g, `http://${ip}:8080`);
    }

    // Fallback: dùng IP mặc định
    return url.replace(/http:\/\/localhost:8080/g, 'http://192.168.1.10:8080');
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

      const loading = await this.loadingController.create({
        message: 'Đang tải CV...',
      });
      await loading.present();

      // Download CV qua HttpClient
      this.http.get(downloadUrl, { responseType: 'blob' }).subscribe({
        next: async (blob) => {
          await loading.dismiss();

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
                  console.error(
                    '[Candidates] Error saving file:',
                    error
                  );
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
              console.error(
                '[Candidates] Error processing blob:',
                error
              );
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
          await loading.dismiss();
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

  /**
   * Cập nhật thông tin phân trang
   */
  private updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredCandidates.length / this.pageSize));
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  /**
   * Chuyển đến trang cụ thể
   */
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  /**
   * Chuyển đến trang tiếp theo
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /**
   * Chuyển đến trang trước
   */
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}
