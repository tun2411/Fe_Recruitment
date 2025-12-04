import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonCard,
  IonCardContent,
  IonButton,
  IonBadge,
  IonSelect,
  IonSelectOption,
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
  notificationsOutline,
  calendarOutline,
  alertCircleOutline,
  arrowUpOutline,
  trophyOutline,
  chevronDownOutline,
} from 'ionicons/icons';
import { JobPostService } from '../../services/job-post.service';
import { NotificationService, Notification } from '../../services/notification.service';
import { WebSocketService } from '../../services/websocket.service';

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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    IonCard,
    IonCardContent,
    IonButton,
    IonBadge,
    IonSelect,
    IonSelectOption,
  ],
})
export class DashboardPage implements OnInit, OnDestroy {
  // User info - TODO: Get from authentication service
  userName: string = 'Alex Johnson';
  currentDate: string = '';
  notificationCount: number = 0;
  private subscriptions: Subscription[] = [];

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
    private jobPostService: JobPostService,
    private notificationService: NotificationService,
    private wsService: WebSocketService,
    private cdr: ChangeDetectorRef
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
    });
  }

  ngOnInit() {
    this.updateCurrentDate();
    this.loadJobsList(); // Load danh sách jobs trước
    this.loadAllJobs(); // Load thống kê
    this.loadNotificationCount(); // Load notification count
    this.subscribeToWebSocketNotifications(); // Subscribe vào WebSocket
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    this.currentDate = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]}`;
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
      console.log('[Dashboard] Loading statistics for jobId:', this.selectedJobId);

      const response = await firstValueFrom(
        this.jobPostService.getDetailJob(this.selectedJobId)
      );

      console.log('[Dashboard] API Response:', response);
      console.log('[Dashboard] Response passFailRatio:', response.passFailRatio);

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
        console.warn('[Dashboard] No passFailRatio in response, resetting to 0');
        console.warn('[Dashboard] Full response:', JSON.stringify(response, null, 2));
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
        const roundName = apiInsights.topFailRoundName || 'Vòng có nhiều ứng viên fail nhất';
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

  /**
   * Load notification count từ API
   */
  async loadNotificationCount() {
    try {
      const notifications = await firstValueFrom(
        this.notificationService.getNotifications()
      );
      // Đếm số notification chưa đọc
      this.notificationCount = notifications.filter(n => !n.isRead).length;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('[Dashboard] Error loading notification count:', error);
    }
  }

  /**
   * Subscribe vào WebSocket để cập nhật notification count real-time
   */
  private subscribeToWebSocketNotifications() {
    const wsSubscription = this.wsService.notifications$.subscribe((notifications) => {
      // Khi có notification mới từ WebSocket, reload notification count từ API
      // để đảm bảo số đếm chính xác (bao gồm cả notifications cũ)
      this.loadNotificationCount();
    });
    
    this.subscriptions.push(wsSubscription);
  }

  onNotificationClick() {
    this.router.navigate(['/notifications']);
  }

  onProfileClick() {
    this.router.navigate(['/personal-info']);
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
