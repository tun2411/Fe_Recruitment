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
  IonAvatar,
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
} from 'ionicons/icons';
import { JobPostService, JobPost } from '../services/job-post.service';

export interface Post {
  id: number;
  title: string;
  description: string;
  updatedAt: string;
  salary?: string;
  address?: string;
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
    IonAvatar,
  ],
})
export class HomePage implements OnInit {
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  searchTerm: string = '';
  notificationCount: number = 2;
  filterCount: number = 2;

  constructor(
    private router: Router,
    private jobPostService: JobPostService,
    private loadingController: LoadingController,
    private toastController: ToastController
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
    });
  }

  ngOnInit() {
    this.loadPosts();
  }

  /**
   * Chuyển đổi JobPost từ API thành Post để hiển thị
   */
  private mapJobPostToPost(jobPost: JobPost): Post {
    // Format date từ ISO string sang định dạng dễ đọc
    // Nếu updatedAt là chuỗi rỗng hoặc không hợp lệ, dùng "Chưa cập nhật"
    let formattedDate = 'Chưa cập nhật';
    if (jobPost.updatedAt && jobPost.updatedAt.trim() !== '') {
      try {
        const date = new Date(jobPost.updatedAt);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch (e) {
        console.warn('Error formatting date:', e);
      }
    }

    // Parse salaryRange nếu có
    let salary = '';
    if (jobPost.salaryRange) {
      salary = jobPost.salaryRange;
    }

    return {
      id: jobPost.id,
      title: jobPost.title,
      description: jobPost.description || '',
      updatedAt: formattedDate,
      salary: salary,
      address: jobPost.location || '',
    };
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

        // Chuyển đổi JobPost thành Post
        this.posts = jobPosts.map((jobPost) => this.mapJobPostToPost(jobPost));
        this.filteredPosts = [...this.posts];
        console.log('[HomePage] Mapped posts:', this.posts);
        console.log('[HomePage] Filtered posts:', this.filteredPosts);
        console.log('[HomePage] Posts count:', this.posts.length);
        loading.dismiss();
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
    this.router.navigate(['/edit-post', post.id]);
  }

  onCreatePost() {
    this.router.navigate(['/create-post']);
  }

  onNotificationClick() {
    console.log('Notification clicked');
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  /**
   * TrackBy function để optimize *ngFor
   */
  trackByPostId(index: number, post: Post): number {
    return post.id;
  }
}
