import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Platform, MenuController } from '@ionic/angular';
import { App } from '@capacitor/app';
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
  IonFab,
  IonFabButton,
  IonBadge,
  IonMenu,
  IonList,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  LoadingController,
  ToastController,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  arrowDownOutline,
  refreshOutline,
  filterOutline,
  addOutline,
  personOutline,
  chevronDownOutline,
  gridOutline,
  briefcaseOutline,
  mailOutline,
  timeOutline,
  cashOutline,
  locationOutline,
  logOutOutline,
  personCircleOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import {
  JobPostService,
  JobPost,
  JobResponse,
} from '../services/job-post.service';
import {
  ApplicationService,
  Application,
} from '../services/application.service';
import {
  NotificationService,
  Notification,
} from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Post {
  id: number;
  title: string;
  description: string;
  updatedAt: string;
  salary?: string;
  address?: string;
  workTime?: string;
  roundCount?: number;
  candidateCount?: number;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
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
    IonFab,
    IonFabButton,
    IonBadge,
    IonMenu,
    IonList,
    IonItem,
    IonLabel,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class HomePage implements OnInit {
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  searchTerm: string = '';
  notificationCount: number = 0;
  filterCount: number = 2;
  userInfo: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private jobPostService: JobPostService,
    private applicationService: ApplicationService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private authService: AuthService,
    private notificationService: NotificationService,
    private menuController: MenuController,
    private platform: Platform
  ) {
    addIcons({
      notificationsOutline,
      arrowDownOutline,
      refreshOutline,
      filterOutline,
      addOutline,
      personOutline,
      chevronDownOutline,
      gridOutline,
      briefcaseOutline,
      mailOutline,
      timeOutline,
      cashOutline,
      locationOutline,
      logOutOutline,
      personCircleOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit() {
    this.loadPosts();
    this.loadUserInfo();
    this.loadNotificationCount();

    // Xử lý nút back cứng trên mobile: ở màn Home chỉ thoát app, không xóa localStorage
    if (this.platform.is('android') || this.platform.is('ios')) {
      this.platform.backButton.subscribeWithPriority(10, () => {
        // Nếu đang ở /home thì thoát app, không đụng tới localStorage
        if (this.router.url === '/home') {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  }

  loadUserInfo() {
    this.authService.currentUser$.subscribe((user) => {
      this.userInfo = user;
    });
  }

  /**
   * Lifecycle hook của Ionic - được gọi mỗi khi vào trang này
   * Tự động reload danh sách job khi quay lại từ trang khác
   */
  ionViewWillEnter() {
    console.log('[HomePage] ionViewWillEnter - reloading posts...');
    this.loadPosts();
    this.loadNotificationCount();

    // Nếu được yêu cầu, tự động mở lại menu sidebar
    const openMenu = this.route.snapshot.queryParamMap.get('openMenu');
    if (openMenu === 'true') {
      this.menuController.open('main-menu');
    }
  }

  /**
   * Chuyển đổi JobResponse từ API thành Post để hiển thị
   */
  private mapJobResponseToPost(job: JobResponse, candidateCount: number): Post {
    // Format date từ ISO string sang định dạng dễ đọc
    let formattedDate = 'Chưa cập nhật';
    if (job.updatedAt && job.updatedAt.trim() !== '') {
      try {
        const date = new Date(job.updatedAt);
        if (!isNaN(date.getTime())) {
          formattedDate =
            date.toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }) +
            ' ' +
            date.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });
        }
      } catch (e) {
        console.warn('Error formatting date:', e);
      }
    }

    // Format salary từ salaryFrom và salaryTo
    let salary = '';
    if (job.salaryFrom !== undefined && job.salaryFrom !== null) {
      if (job.salaryTo !== undefined && job.salaryTo !== null) {
        // Format: "10.000.000 - 20.000.000 VNĐ"
        salary = `${this.formatCurrency(
          job.salaryFrom
        )} - ${this.formatCurrency(job.salaryTo)} VNĐ`;
      } else {
        // Chỉ có salaryFrom
        salary = `Từ ${this.formatCurrency(job.salaryFrom)} VNĐ`;
      }
    } else if (job.salaryTo !== undefined && job.salaryTo !== null) {
      // Chỉ có salaryTo
      salary = `Đến ${this.formatCurrency(job.salaryTo)} VNĐ`;
    } else {
      salary = 'Thỏa thuận';
    }

    // Format workTime
    const workTimeMap: { [key: string]: string } = {
      fulltime: 'Fulltime',
      parttime: 'Parttime',
      internship: 'Internship',
      contract: 'Contract',
      freelance: 'Freelance',
    };
    const workTime = job.workTime
      ? workTimeMap[job.workTime.toLowerCase()] || job.workTime
      : '';

    return {
      id: job.id,
      title: job.title,
      description: job.description || '',
      updatedAt: formattedDate,
      salary: salary,
      address: job.location || '',
      workTime: workTime,
      roundCount: job.roundCount,
      candidateCount,
    };
  }

  /**
   * Format số tiền thành định dạng có dấu chấm ngăn cách
   */
  private formatCurrency(amount: number): string {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  async loadPosts() {
    const loading = await this.loadingController.create({
      message: 'Đang tải dữ liệu...',
      spinner: 'crescent',
    });
    await loading.present();

    // Gọi API để lấy TẤT CẢ job posts của business (không filter status)
    // Sử dụng getAllJobPosts để tự động load nhiều pages nếu cần
    this.jobPostService.getAllJobPosts(undefined).subscribe({
      next: (jobPosts: JobPost[]) => {
        console.log('[HomePage] Loaded job posts:', jobPosts);
        console.log('[HomePage] Job posts count:', jobPosts?.length || 0);

        // Kiểm tra nếu không có jobs
        if (!jobPosts || jobPosts.length === 0) {
          console.warn('[HomePage] No job posts found');
          this.posts = [];
          this.filteredPosts = [];
          loading.dismiss();
          return;
        }

        // Load chi tiết cho từng job để có đầy đủ thông tin (salary, location, workTime, updatedAt)
        const detailRequests = jobPosts.map((jobPost) =>
          this.jobPostService.getJobPostById(jobPost.id).pipe(
            catchError((error) => {
              console.warn(
                `[HomePage] Failed to load details for job ${jobPost.id}:`,
                error
              );
              // Trả về null nếu lỗi, sẽ được filter sau
              return of(null);
            })
          )
        );

        // Load tất cả chi tiết song song
        forkJoin(detailRequests).subscribe({
          next: (jobDetails: (JobResponse | null)[]) => {
            // Filter bỏ các job null
            const validJobs = jobDetails.filter(
              (job): job is JobResponse => job !== null
            );

            if (validJobs.length === 0) {
              this.posts = [];
              this.filteredPosts = [];
              loading.dismiss();
              return;
            }

            // Với mỗi job, gọi API lấy danh sách ứng viên để đếm số lượng
            const candidateCountRequests = validJobs.map((job) =>
              this.applicationService.getApplicationsByJobId(job.id).pipe(
                map((apps: Application[]) => ({
                  jobId: job.id,
                  count: apps.length,
                })),
                catchError((error) => {
                  console.warn(
                    `[HomePage] Failed to load candidate count for job ${job.id}:`,
                    error
                  );
                  return of({ jobId: job.id, count: 0 });
                })
              )
            );

            forkJoin(candidateCountRequests).subscribe({
              next: (counts) => {
                const countMap = new Map<number, number>();
                counts.forEach((c) => countMap.set(c.jobId, c.count));

                this.posts = validJobs.map((job) =>
                  this.mapJobResponseToPost(job, countMap.get(job.id) || 0)
                );

                this.filteredPosts = [...this.posts];
                console.log(
                  '[HomePage] Mapped posts with details and candidate counts:',
                  this.posts
                );
                loading.dismiss();
              },
              error: async (error) => {
                loading.dismiss();
                console.error(
                  '[HomePage] Error loading candidate counts:',
                  error
                );

                // Fallback: không có candidate count, chỉ map job details
                this.posts = validJobs.map((job) =>
                  this.mapJobResponseToPost(job, 0)
                );
                this.filteredPosts = [...this.posts];

                const toast = await this.toastController.create({
                  message:
                    'Đã tải danh sách nhưng số lượng ứng viên chưa đầy đủ',
                  duration: 2000,
                  color: 'warning',
                  position: 'top',
                });
                await toast.present();
              },
            });
          },
          error: async (error) => {
            loading.dismiss();
            console.error('[HomePage] Error loading job details:', error);

            // Fallback: sử dụng dữ liệu cơ bản nếu không load được chi tiết
            this.posts = jobPosts.map((jobPost) => ({
              id: jobPost.id,
              title: jobPost.title,
              description: jobPost.description || '',
              updatedAt: 'Chưa cập nhật',
              salary: 'Thỏa thuận',
              address: jobPost.location || '',
              workTime: '',
              roundCount: jobPost.roundCount,
              candidateCount: 0,
            }));
            this.filteredPosts = [...this.posts];

            const toast = await this.toastController.create({
              message:
                'Đã tải danh sách nhưng một số thông tin chi tiết chưa có',
              duration: 2000,
              color: 'warning',
              position: 'top',
            });
            await toast.present();
          },
        });
      },
      error: async (error) => {
        loading.dismiss();
        console.error('Error loading job posts:', error);

        // Hiển thị thông báo lỗi
        const toast = await this.toastController.create({
          message:
            error.message || 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();

        this.posts = [];
        this.filteredPosts = [];
      },
    });
  }

  private loadNotificationCount() {
    this.notificationService.getNotifications().subscribe({
      next: (notifications: Notification[]) => {
        this.notificationCount = notifications.filter((n) => !n.isRead).length;
      },
      error: (error) => {
        console.error('[HomePage] Error loading notification count:', error);
        this.notificationCount = 0;
      },
    });
  }

  onSearch(event: any) {
    this.searchTerm = event.detail.value || '';
    this.filterPosts();
  }

  filterPosts() {
    if (!this.searchTerm.trim()) {
      this.filteredPosts = [...this.posts];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredPosts = this.posts.filter(
      (post) =>
        post.title.toLowerCase().includes(term) ||
        post.description.toLowerCase().includes(term)
    );
  }

  onSort() {
    this.filteredPosts.reverse();
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.loadPosts().then(() => {
      event.target.complete();
    });
  }

  onFilter() {
    console.log('Filter clicked');
  }

  onViewList(post: Post) {
    this.router.navigate(['/candidates'], {
      queryParams: { postId: post.id },
    });
  }

  onViewDetail(post: Post) {
    this.router.navigate(['/job-detail', post.id]);
  }

  onCreatePost() {
    this.router.navigate(['/create-post']);
  }

  onNotificationClick() {
    this.router.navigate(['/notifications']);
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  onAvatarClick() {
    // Menu sẽ tự động mở khi click vào menu button
  }

  onPersonalInfo() {
    this.router.navigate(['/personal-info']);
  }

  onRecruitmentManagement() {
    // Navigate to home (quản lý tuyển dụng)
    this.router.navigate(['/home']);
  }

  onEmailManagement() {
    // Navigate to email management page
    this.router.navigate(['/email-management']);
  }

  onDashboard() {
    this.router.navigate(['/dashboard']);
  }

  async onLogout() {
    // Logout ngay lập tức
    this.authService.logout();
  }

  /**
   * TrackBy function để optimize *ngFor
   */
  trackByPostId(index: number, post: Post): number {
    return post.id;
  }
}
