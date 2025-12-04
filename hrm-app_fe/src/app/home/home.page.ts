import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  LoadingController,
  ToastController,
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
import { JobPostService, JobPost, JobResponse } from '../services/job-post.service';
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
  ],
})
export class HomePage implements OnInit {
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  searchTerm: string = '';
  notificationCount: number = 2;
  filterCount: number = 2;
  userInfo: any = null;
  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  pages: number[] = [];

  constructor(
    private router: Router,
    private jobPostService: JobPostService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private authService: AuthService
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
  }

  get displayedPosts(): Post[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPosts.slice(startIndex, startIndex + this.pageSize);
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
  }

  /**
   * Chuyển đổi JobResponse từ API thành Post để hiển thị
   */
  private mapJobResponseToPost(job: JobResponse): Post {
    // Format date từ ISO string sang định dạng dễ đọc
    let formattedDate = 'Chưa cập nhật';
    if (job.updatedAt && job.updatedAt.trim() !== '') {
      try {
        const date = new Date(job.updatedAt);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }) + ' ' + date.toLocaleTimeString('vi-VN', {
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
        salary = `${this.formatCurrency(job.salaryFrom)} - ${this.formatCurrency(job.salaryTo)} VNĐ`;
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
      'fulltime': 'Fulltime',
      'parttime': 'Parttime',
      'internship': 'Internship',
      'contract': 'Contract',
      'freelance': 'Freelance',
    };
    const workTime = job.workTime ? (workTimeMap[job.workTime.toLowerCase()] || job.workTime) : '';

    return {
      id: job.id,
      title: job.title,
      description: job.description || '',
      updatedAt: formattedDate,
      salary: salary,
      address: job.location || '',
      workTime: workTime,
      roundCount: job.roundCount,
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
              console.warn(`[HomePage] Failed to load details for job ${jobPost.id}:`, error);
              // Trả về null nếu lỗi, sẽ được filter sau
              return of(null);
            })
          )
        );

        // Load tất cả chi tiết song song
        forkJoin(detailRequests).subscribe({
          next: (jobDetails: (JobResponse | null)[]) => {
            // Filter bỏ các job null và map sang Post
            this.posts = jobDetails
              .filter((job): job is JobResponse => job !== null)
              .map((job) => this.mapJobResponseToPost(job));

            this.filteredPosts = [...this.posts];
            this.currentPage = 1;
            this.updatePagination();
            console.log('[HomePage] Mapped posts with details:', this.posts);
            loading.dismiss();
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
            }));
            this.filteredPosts = [...this.posts];
            this.currentPage = 1;
            this.updatePagination();

            const toast = await this.toastController.create({
              message: 'Đã tải danh sách nhưng một số thông tin chi tiết chưa có',
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

  onSearch(event: any) {
    this.searchTerm = event.detail.value || '';
    this.filterPosts();
  }

  filterPosts() {
    if (!this.searchTerm.trim()) {
      this.filteredPosts = [...this.posts];
      this.currentPage = 1;
      this.updatePagination();
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredPosts = this.posts.filter(
      (post) =>
        post.title.toLowerCase().includes(term) ||
        post.description.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  onSort() {
    this.filteredPosts.reverse();
  }

  onRefresh(event?: any) {
    this.loadPosts().then(() => {
      if (event?.target) {
        event.target.complete();
      }
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

  private updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredPosts.length / this.pageSize));
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}
