import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonContent,
  IonIcon,
  IonCard,
  IonCardContent,
  IonButton,
  IonBadge,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { MenuController } from '@ionic/angular';
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
  notificationsOutline,
  calendarOutline,
  alertCircleOutline,
  arrowUpOutline,
  trophyOutline,
  chevronDownOutline,
  logOutOutline,
} from 'ionicons/icons';
import { JobPostService } from '../../services/job-post.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { BusinessService } from '../../services/business.service';
import { AuthService } from '../../services/auth.service';
// TODO: Uncomment when backend is ready
// import { NotificationService, Notification } from '../../services/notification.service';
// import { ApplicationService } from '../../services/application.service';

interface DashboardMetrics {
  pendingReview: number;
  newCandidates: number;
  activeJobs: number;
  passAll: number;
}

interface PassFailRatio {
  passAll: number;
  fail: number;
  pending: number;
}

interface FunnelData {
  label: string;
  value: number;
}

interface InsightItem {
  number: number;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonCard,
    IonCardContent,
    IonButton,
    IonSelect,
    IonSelectOption,
    BottomNavComponent,
    AppHeaderComponent,
  ],
})
export class DashboardPage implements OnInit {
  // User info - Lấy từ database
  userName: string = '';
  currentDate: string = '';
  notificationCount: number = 2;
  userInfo: any = null;

  // Filter state
  selectedFilter: 'all' | 'week' = 'all';

  // Jobs list for dropdown
  jobs: Array<{ id: number; title: string }> = [];
  selectedJobId: number | null = null; // null = All Jobs

  // Metrics data - TODO: Replace with API calls
  metrics: DashboardMetrics = {
    pendingReview: 14,
    newCandidates: 5,
    activeJobs: 8,
    passAll: 12,
  };

  // Tổng số ứng viên ứng tuyển (hiển thị ở giữa vòng tròn)
  totalCandidates: number = 0;

  // Pass/Fail Ratio data - TODO: Replace with API calls
  passFailRatio: PassFailRatio = {
    passAll: 60, // 60%
    fail: 25, // 25%
    pending: 15, // 15%
  };

  // Recruitment Funnel data - TODO: Replace with API calls
  funnelData: FunnelData[] = [
    { label: 'Ứng tuyển', value: 100 },
    { label: 'Pass v1', value: 70 },
    { label: 'Pass v2', value: 50 },
    { label: 'Pass hết', value: 30 },
  ];

  // Insights data - TODO: Replace with API calls
  insights: InsightItem[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private jobPostService: JobPostService,
    private cdr: ChangeDetectorRef,
    private businessService: BusinessService,
    private authService: AuthService,
    private menuController: MenuController
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
      notificationsOutline,
      calendarOutline,
      alertCircleOutline,
      arrowUpOutline,
      trophyOutline,
      chevronDownOutline,
      logOutOutline,
    });
  }

  async ngOnInit() {
    this.updateCurrentDate();
    this.loadUserInfo();
    this.loadJobsList(); // Load danh sách jobs trước
    this.loadAllJobs(); // Load thống kê
  }

  ionViewWillEnter() {
    // Nếu được yêu cầu, tự động mở lại menu sidebar
    const openMenu = this.route.snapshot.queryParamMap.get('openMenu');
    if (openMenu === 'true') {
      this.menuController
        .open('main-menu')
        .catch((err) =>
          console.error('[DashboardPage] Error auto opening main-menu:', err)
        );
    }
  }

  loadUserInfo() {
    // Load userInfo từ AuthService
    this.authService.currentUser$.subscribe((user) => {
      this.userInfo = user;
    });

    // Option 1: Lấy từ BusinessService (companyName)
    this.businessService.getCurrentBusiness().subscribe({
      next: (business) => {
        this.userName = business.companyName || business.email || 'User';
      },
      error: (error) => {
        console.error('Error loading business info:', error);
        // Fallback: Lấy từ AuthService
        this.authService.currentUser$.subscribe((user) => {
          this.userName = user?.fullName || user?.username || 'User';
        });
      },
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

  /**
   * Load danh sách jobs để hiển thị trong dropdown
   */
  async loadJobsList() {
    try {
      const response = await firstValueFrom(
        this.jobPostService.getJobPosts(undefined, 1, 100)
      );

      this.jobs = response.jobs.map((job) => ({
        id: job.id,
        title: job.title,
      }));

      console.log('[Dashboard] Loaded jobs list:', this.jobs);
    } catch (error) {
      console.error('[Dashboard] Error loading jobs list:', error);
    }
  }

  /**
   * Load dashboard statistics from backend
   * GET /api/jobdetail - Lấy thông tin thống kê (tổng job, tổng ứng viên, etc.)
   * @param jobId ID của job (optional) - nếu có sẽ lấy thống kê theo job đó
   */
  async loadAllJobs() {
    try {
      console.log(
        '[Dashboard] Loading statistics for jobId:',
        this.selectedJobId
      );

      const response = await firstValueFrom(
        this.jobPostService.getDetailJob(this.selectedJobId)
      );

      console.log('[Dashboard] API Response:', response);
      console.log(
        '[Dashboard] Response passFailRatio:',
        response.passFailRatio
      );

      this.metrics = {
        activeJobs: response.activeJobs || 0,
        pendingReview: response.pendingReview || 0,
        newCandidates: response.newCandidates || 0,
        passAll: response.passAll || 0,
      };

      // Lưu tổng số ứng viên để hiển thị ở giữa vòng tròn
      this.totalCandidates = response.totalCandidates || 0;

      if (
        response.passFailRatio &&
        (response.passFailRatio.passAll !== undefined ||
          response.passFailRatio.fail !== undefined ||
          response.passFailRatio.pending !== undefined)
      ) {
        const newPassFailRatio = {
          passAll: Number(response.passFailRatio.passAll) || 0,
          fail: Number(response.passFailRatio.fail) || 0,
          pending: Number(response.passFailRatio.pending) || 0,
        };

        console.log(
          '[Dashboard] Updating passFailRatio from:',
          this.passFailRatio,
          'to:',
          newPassFailRatio
        );
        this.passFailRatio = newPassFailRatio;
      } else {
        console.warn(
          '[Dashboard] No passFailRatio in response, resetting to 0'
        );
        console.warn(
          '[Dashboard] Full response:',
          JSON.stringify(response, null, 2)
        );
        this.passFailRatio = {
          passAll: 0,
          fail: 0,
          pending: 0,
        };
      }

      console.log('[Dashboard] Final passFailRatio:', this.passFailRatio);
      console.log('[Dashboard] Donut chart data:', this.getDonutChartData());

      // Build Insights từ response.insights
      const insights: InsightItem[] = [];
      const apiInsights = (response as any).insights || {};

      // 1) Job có nhiều ứng viên ứng tuyển nhất
      if (apiInsights.topAppliedJobName) {
        insights.push({
          number: insights.length + 1,
          title: apiInsights.topAppliedJobName,
          subtitle: 'Job có nhiều ứng viên ứng tuyển nhất',
        });
      }

      // 2) Vòng có nhiều ứng viên fail nhất + tên job của vòng đó (gộp thành một mục)
      if (apiInsights.topFailRoundName || apiInsights.topFailRoundJobName) {
        const roundName =
          apiInsights.topFailRoundName || 'Vòng có nhiều ứng viên fail nhất';
        const jobName = apiInsights.topFailRoundJobName
          ? `Job: ${apiInsights.topFailRoundJobName}`
          : '';

        insights.push({
          number: insights.length + 1,
          title: roundName,
          subtitle: jobName
            ? `${jobName} - vòng có nhiều ứng viên fail nhất`
            : 'Vòng có nhiều ứng viên fail nhất',
        });
      }

      this.insights = insights;

      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        console.log('[Dashboard] Change detection triggered');
      }, 0);
    } catch (error) {
      console.error('[Dashboard] Error loading statistics:', error);
      this.passFailRatio = {
        passAll: 0,
        fail: 0,
        pending: 0,
      };
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle khi user chọn job từ dropdown
   */
  onJobChange(event: any) {
    const jobId = event.detail.value;
    this.selectedJobId = jobId === 'all' ? null : parseInt(jobId, 10);

    // Khi chọn job: bỏ trạng thái "This Week" để mất màu xanh
    this.selectedFilter = 'all';

    console.log('[Dashboard] Job changed:', {
      selectedValue: jobId,
      selectedJobId: this.selectedJobId,
      selectedFilter: this.selectedFilter,
    });

    this.loadAllJobs();
  }

  /**
   * Lấy title của job đang được chọn để hiển thị trong dropdown
   */
  getSelectedJobTitle(): string {
    if (this.selectedJobId === null) {
      return 'All Jobs';
    }
    const selectedJob = this.jobs.find((job) => job.id === this.selectedJobId);
    return selectedJob ? selectedJob.title : 'All Jobs';
  }

  onFilterChange(filter: 'all' | 'week') {
    this.selectedFilter = filter;

    if (filter === 'week') {
      // Khi chọn This Week: xem thống kê 1 tuần, không filter theo job cụ thể
      this.selectedJobId = null;
    }

    this.loadAllJobs();
  }

  onNotificationClick() {
    this.router.navigate(['/notifications']);
  }

  onSettingsClick() {
    console.log('Settings clicked');
  }

  navigateToDashboard() {
    // Already on dashboard
  }

  navigateToJobs() {
    this.router.navigate(['/home']);
  }

  navigateToMessages() {
    this.router.navigate(['/email-management']);
  }

  // Calculate donut chart percentages
  getDonutChartData() {
    const total =
      this.passFailRatio.passAll +
      this.passFailRatio.fail +
      this.passFailRatio.pending;

    if (total === 0) {
      return {
        passAll: 0,
        fail: 0,
        pending: 0,
      };
    }

    return {
      passAll: (this.passFailRatio.passAll / total) * 100,
      fail: (this.passFailRatio.fail / total) * 100,
      pending: (this.passFailRatio.pending / total) * 100,
    };
  }

  // Calculate funnel bar widths (percentage of max value)
  getFunnelBarWidth(value: number): number {
    const maxValue = Math.max(...this.funnelData.map((d) => d.value));
    return (value / maxValue) * 100;
  }
}
