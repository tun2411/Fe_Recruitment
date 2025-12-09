import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Filesystem, Directory } from '@capacitor/filesystem';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonTextarea,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  ToastController,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  documentTextOutline,
  downloadOutline,
  personOutline,
  mailOutline,
  callOutline,
  notificationsOutline,
  removeOutline,
  radioButtonOffOutline,
  briefcaseOutline,
  timeOutline,
  informationCircleOutline,
  gridOutline,
} from 'ionicons/icons';
import {
  ApplicationService,
  Application,
  UpdateApplicationStatusRequest,
  ApplicationStatusResponse,
} from '../../services/application.service';
import { JobPostService } from '../../services/job-post.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-application-detail',
  templateUrl: './application-detail.page.html',
  styleUrls: ['./application-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonTextarea,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonBadge,
    AppHeaderComponent,
  ],
})
export class ApplicationDetailPage implements OnInit {
  applicationId: number | null = null;
  application: Application | null = null;
  jobTitle: string = '';
  loading: boolean = false;
  processing: boolean = false;
  note: string = '';
  currentRoundIndex: number = 0;
  statusHistory: ApplicationStatusResponse[] = [];
  statusHistoryLoaded: boolean = false; // Flag để biết statusHistory đã load xong chưa
  unreadCount: number = 0;
  showNoteInput: boolean = false;
  showFailModal: boolean = false;
  showPassModal: boolean = false;
  private authService = inject(AuthService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private applicationService: ApplicationService,
    private jobPostService: JobPostService,
    private notificationService: NotificationService,
    private toastController: ToastController
  ) {
    addIcons({
      checkmarkCircleOutline,
      closeCircleOutline,
      documentTextOutline,
      downloadOutline,
      personOutline,
      mailOutline,
      callOutline,
      notificationsOutline,
      removeOutline,
      radioButtonOffOutline,
      briefcaseOutline,
      timeOutline,
      informationCircleOutline,
      gridOutline,
    });
  }

  ngOnInit() {
    // Debug: Kiểm tra token chi tiết
    const token = this.authService.getToken();
    const directToken =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const refreshToken = this.authService.getRefreshToken();

    console.log('[ApplicationDetail] ngOnInit - Token exists:', !!token);
    console.log(
      '[ApplicationDetail] ngOnInit - Direct localStorage token:',
      !!directToken
    );
    console.log(
      '[ApplicationDetail] ngOnInit - Refresh token exists:',
      !!refreshToken
    );

    if (token) {
      console.log('[ApplicationDetail] Token length:', token.length);
      console.log(
        '[ApplicationDetail] Token preview:',
        token.substring(0, 20) + '...'
      );
    } else {
      console.error('[ApplicationDetail] ⚠️ No token found in AuthService!');
      if (directToken) {
        console.warn(
          '[ApplicationDetail] ⚠️ But token exists in localStorage directly!'
        );
        console.warn(
          '[ApplicationDetail] This suggests AuthService.getToken() is not working correctly'
        );
      } else {
        console.error(
          '[ApplicationDetail] ❌ No token in localStorage either!'
        );
        console.error('[ApplicationDetail] User needs to login again');
      }
    }

    // Kiểm tra authentication trước khi load data
    if (!this.authService.isAuthenticated()) {
      console.warn(
        '[ApplicationDetail] User not authenticated, redirecting to login'
      );
      this.showToast(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        'warning'
      );
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }

    const idParam = this.route.snapshot.paramMap.get('applicationId');
    if (idParam) {
      this.applicationId = parseInt(idParam);
      console.log(
        '[ApplicationDetail] Loading application ID:',
        this.applicationId
      );
      this.loadApplication();
      // Load notifications only if authenticated (optional, non-critical)
      this.loadNotifications();
    } else {
      console.error('[ApplicationDetail] No applicationId in route params!');
      this.showToast('Không tìm thấy ID đơn ứng tuyển', 'warning');
      this.router.navigate(['/candidates']);
    }
  }

  async loadApplication() {
    if (!this.applicationId) return;

    this.loading = true;

    // Load application directly by ID (more efficient)
    this.applicationService.getApplicationById(this.applicationId).subscribe({
      next: async (app) => {
        this.application = app;
        this.currentRoundIndex = app.currentRoundIndex;

        // Use jobTitle from response if available, otherwise try to load it
        if (app.jobTitle) {
          this.jobTitle = app.jobTitle;
        } else {
          // Fallback: try to load job title if we have jobId
          const jobId = app.jobId || this.route.snapshot.queryParams['jobId'];
          if (jobId) {
            await this.loadJobTitle(parseInt(jobId.toString()));
          }
        }

        await this.loadStatusHistory();
        this.loading = false;
      },
      error: async (error) => {
        console.error('Error loading application:', error);
        this.loading = false;

        // Handle 401/403 errors gracefully
        if (error.status === 401 || error.status === 403) {
          await this.showToast(
            'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            'warning'
          );
          // Don't navigate immediately, let interceptor handle it
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          await this.showToast(
            error.message || 'Không thể tải thông tin đơn ứng tuyển',
            'danger'
          );
          // Navigate back to candidates if we have jobId
          const jobId = this.route.snapshot.queryParams['jobId'];
          if (jobId) {
            this.router.navigate(['/candidates'], {
              queryParams: { postId: jobId },
            });
          } else {
            this.router.navigate(['/home']);
          }
        }
      },
    });
  }

  async loadJobTitle(jobId: number) {
    // Only load if we don't already have jobTitle from application response
    if (this.jobTitle) {
      return;
    }

    this.jobPostService.getJobPostById(jobId).subscribe({
      next: (job) => {
        this.jobTitle = job.title;
      },
      error: (error) => {
        // Silently fail - job title is not critical
        console.warn('Could not load job title (non-critical):', error);
        // Don't show error to user, just use empty string or keep existing value
        if (!this.jobTitle) {
          this.jobTitle = '';
        }
      },
    });
  }

  async loadStatusHistory() {
    if (!this.applicationId) return;

    this.statusHistoryLoaded = false; // Reset flag khi bắt đầu load
    this.applicationService
      .getApplicationStatusHistory(this.applicationId)
      .subscribe({
        next: (history) => {
          this.statusHistory = history || [];
          this.statusHistoryLoaded = true; // Đánh dấu đã load xong
        },
        error: (error) => {
          console.error('Error loading status history:', error);
          this.statusHistory = []; // Set empty array nếu có lỗi
          this.statusHistoryLoaded = true; // Vẫn đánh dấu đã load xong để không bị stuck
        },
      });
  }

  async loadNotifications() {
    // Load notifications silently - if fails, just don't show count
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.unreadCount = notifications.filter((n) => !n.isRead).length;
      },
      error: (error) => {
        // Silently fail - notifications are not critical for this page
        console.warn('Could not load notifications (non-critical):', error);
        this.unreadCount = 0;
      },
    });
  }

  canUpdateStatus(): boolean {
    // Không có application → không thể update
    if (!this.application) {
      return false;
    }

    // Application đã kết thúc (PASS hoặc FAIL) → không thể update
    const status = this.application.status?.toUpperCase();
    if (status === 'PASS' || status === 'FAIL') {
      return false;
    }

    // Nếu statusHistory chưa load xong → không hiển thị nút tạm thời
    // Điều này tránh flickering và đảm bảo logic chính xác
    if (!this.statusHistoryLoaded) {
      return false;
    }

    // Nếu không có statusHistory (empty array sau khi load xong)
    // → có thể là ứng viên mới chưa có rounds, hoặc có lỗi
    // Trong trường hợp này, nếu status là NEW → vẫn cho phép update
    if (!this.statusHistory || this.statusHistory.length === 0) {
      // Ứng viên mới (NEW) chưa có rounds → vẫn cho phép update
      return status === 'NEW';
    }

    // Tìm round hiện tại (round đang được xử lý)
    const currentRound = this.statusHistory.find((r) => r.isCurrentRound);

    // Nếu không tìm thấy currentRound
    // → có thể là ứng viên mới chưa bắt đầu vòng nào, hoặc đã hết vòng
    if (!currentRound) {
      // Nếu status là NEW → vẫn cho phép update (ứng viên mới)
      // Nếu status là IN_PROCESS nhưng không có currentRound → không cho phép
      return status === 'NEW';
    }

    // Cho phép update nếu:
    // 1. Round hiện tại chưa có status (chưa được đánh giá pass/fail)
    // 2. Application status là NEW hoặc IN_PROCESS
    const canUpdate =
      !currentRound.status && (status === 'NEW' || status === 'IN_PROCESS');

    return canUpdate;
  }

  async onPass() {
    if (!this.application || !this.applicationId) {
      await this.showToast('Không tìm thấy thông tin đơn ứng tuyển', 'warning');
      return;
    }

    if (!this.canUpdateStatus()) {
      await this.showToast(
        'Không thể cập nhật trạng thái. Đơn ứng tuyển đã được xử lý.',
        'warning'
      );
      return;
    }

    // Hiển thị modal xác nhận
    this.showPassModal = true;
  }

  async confirmPass() {
    this.showPassModal = false;

    // Chuyển hướng đến trang xác nhận email
    if (this.applicationId) {
      this.router.navigate(['/confirm-email'], {
        queryParams: {
          applicationId: this.applicationId,
          status: 'pass',
        },
      });
    }
  }

  cancelPass() {
    this.showPassModal = false;
  }

  async onFail() {
    if (!this.application || !this.applicationId) {
      await this.showToast('Không tìm thấy thông tin đơn ứng tuyển', 'warning');
      return;
    }

    if (!this.canUpdateStatus()) {
      await this.showToast(
        'Không thể cập nhật trạng thái. Đơn ứng tuyển đã được xử lý.',
        'warning'
      );
      return;
    }

    // Hiển thị modal xác nhận
    this.showFailModal = true;
  }

  async confirmFail() {
    this.showFailModal = false;

    // Chuyển hướng đến trang xác nhận email
    if (this.applicationId) {
      this.router.navigate(['/confirm-email'], {
        queryParams: {
          applicationId: this.applicationId,
          status: 'fail',
        },
      });
    }
  }

  cancelFail() {
    this.showFailModal = false;
  }

  async updateStatus(request: UpdateApplicationStatusRequest) {
    if (!this.applicationId) {
      await this.showToast('Không tìm thấy ID đơn ứng tuyển', 'warning');
      return;
    }

    this.processing = true;

    this.applicationService
      .updateApplicationStatus(this.applicationId, request)
      .subscribe({
        next: async (response) => {
          this.processing = false;

          // Reset note sau khi update thành công
          this.note = '';
          this.showNoteInput = false;

          await this.showToast(
            response.message || 'Cập nhật trạng thái thành công',
            'success'
          );

          // Reload application and status history để cập nhật UI
          await this.loadApplication();
        },
        error: async (error) => {
          this.processing = false;

          console.error('[ApplicationDetail] Error updating status:', error);

          let errorMessage = 'Có lỗi xảy ra khi cập nhật trạng thái';
          if (error.message) {
            errorMessage = error.message;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          await this.showToast(errorMessage, 'danger');
        },
      });
  }

  /**
   * Fix URL: Đồng bộ host CV với IP trong environment, dùng cho cả web và mobile
   */
  private fixUrlForMobile(url: string): string {
    const apiUrl = environment.apiUrl;
    // Lấy phần host:port từ apiUrl, ví dụ http://192.168.1.22:8080/api -> http://192.168.1.22:8080
    const hostMatch = apiUrl.match(/^(http:\/\/[^/]+:\d+)/);
    const targetBase = hostMatch ? hostMatch[1] : 'http://192.168.1.22:8080';

    // Thay mọi host :8080 (localhost hoặc IP cũ) bằng host mới
    return url.replace(/http:\/\/[^/]+:8080/g, targetBase);
  }

  async onViewCV() {
    if (!this.application?.cvUrl) {
      this.showToast('CV không có sẵn', 'warning');
      return;
    }

    try {
      const cvUrl = this.application.cvUrl;
      // Chuyển download thành view nếu cần
      let viewUrl = cvUrl.replace('/cv/download?', '/cv/view?');

      // Fix URL cho mobile (thay localhost bằng IP thực tế)
      viewUrl = this.fixUrlForMobile(viewUrl);

      console.log('[ApplicationDetail] Opening CV URL:', viewUrl);

      // Trên mobile: Dùng Capacitor Browser để mở PDF
      if (Capacitor.isNativePlatform()) {
        try {
          await Browser.open({
            url: viewUrl,
            windowName: '_system', // Mở trong browser mặc định
          });
          return;
        } catch (error) {
          console.error('[ApplicationDetail] Browser.open failed:', error);
          // Fallback: dùng HttpClient
        }
      }

      // Web hoặc fallback: Dùng blob approach
      this.http.get(viewUrl, { responseType: 'blob' }).subscribe({
        next: async (blob) => {

          // Tạo blob URL và mở trong tab mới
          const blobUrl = URL.createObjectURL(blob);
          console.log('[ApplicationDetail] Blob URL created, opening...');
          window.open(blobUrl, '_blank');

          // Clean up blob URL sau 1 phút
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        },
        error: async (error) => {
          console.error('[ApplicationDetail] Error loading CV:', error);
          console.error('[ApplicationDetail] Error status:', error.status);
          console.error('[ApplicationDetail] Error URL:', error.url);
          this.showToast('Không thể tải CV. Vui lòng thử lại.', 'danger');
        },
      });
    } catch (error) {
      console.error('[ApplicationDetail] Error opening CV:', error);
      this.showToast('Không thể mở CV. Vui lòng thử lại.', 'danger');
    }
  }

  async onDownloadCV() {
    if (!this.application?.cvUrl) {
      this.showToast('CV không có sẵn', 'warning');
      return;
    }

    try {
      const cvUrl = this.application.cvUrl;
      // Chuyển view thành download
      let downloadUrl = cvUrl.replace('/cv/view?', '/cv/download?');

      // Fix URL cho mobile (thay localhost bằng IP thực tế)
      downloadUrl = this.fixUrlForMobile(downloadUrl);

      console.log('[ApplicationDetail] Downloading CV URL:', downloadUrl);

      // Download CV qua HttpClient
      this.http.get(downloadUrl, { responseType: 'blob' }).subscribe({
        next: async (blob) => {

          const fileName = `CV_${
            this.application?.candidateFullName || 'candidate'
          }.pdf`;

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

                  console.log('[ApplicationDetail] File saved:', result.uri);
                  console.log('[ApplicationDetail] File path:', result.uri);

                  this.showToast(
                    `Đã tải CV thành công!\nFile: ${fileName}`,
                    'success'
                  );
                } catch (error) {
                  console.error(
                    '[ApplicationDetail] Error saving file:',
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
                '[ApplicationDetail] Error processing blob:',
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
          console.error('[ApplicationDetail] Error downloading CV:', error);
          console.error('[ApplicationDetail] Error status:', error.status);
          console.error('[ApplicationDetail] Error URL:', error.url);
          this.showToast('Không thể tải CV. Vui lòng thử lại.', 'danger');
        },
      });
    } catch (error) {
      console.error('[ApplicationDetail] Error downloading CV:', error);
      this.showToast('Không thể tải CV. Vui lòng thử lại.', 'danger');
    }
  }

  // Hàm getFullCVUrl() đã KHÔNG CẦN THIẾT nữa
  // Backend trả về full URL sẵn, frontend dùng trực tiếp

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'NEW':
        return 'primary';
      case 'IN_PROCESS':
        return 'warning';
      case 'PASS':
        return 'success';
      case 'FAIL':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toUpperCase()) {
      case 'NEW':
        return 'Mới';
      case 'IN_PROCESS':
        return 'Đang xử lý';
      case 'PASS':
        return 'Đạt';
      case 'FAIL':
        return 'Không đạt';
      default:
        return status || 'N/A';
    }
  }

  getRoundIcon(round: ApplicationStatusResponse): string {
    if (round.status === 'pass') {
      return 'checkmark-circle-outline';
    } else if (round.status === 'fail') {
      return 'close-circle-outline';
    } else if (round.isCurrentRound) {
      return 'remove-outline';
    } else {
      return 'radio-button-off-outline';
    }
  }

  getRoundIconClass(round: ApplicationStatusResponse): string {
    if (round.status === 'pass') {
      return 'icon-success';
    } else if (round.status === 'fail') {
      return 'icon-danger';
    } else if (round.isCurrentRound) {
      return 'icon-current';
    } else {
      return 'icon-pending';
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
    });
    await toast.present();
  }

  onNotificationClick() {
    this.router.navigate(['/notifications']);
  }

  getNextRoundName(): string {
    if (!this.statusHistory || this.statusHistory.length === 0) {
      return '';
    }

    // Tìm round hiện tại (round đang được xử lý)
    const currentRound = this.statusHistory.find(r => r.isCurrentRound);
    
    if (!currentRound) {
      return '';
    }

    // Tìm index của round hiện tại
    const currentRoundIndex = this.statusHistory.findIndex(r => r.roundId === currentRound.roundId);
    
    if (currentRoundIndex === -1 || currentRoundIndex >= this.statusHistory.length - 1) {
      return '';
    }

    // Lấy round tiếp theo
    const nextRound = this.statusHistory[currentRoundIndex + 1];
    return nextRound?.roundName || '';
  }
}
