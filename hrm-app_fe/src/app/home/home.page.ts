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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  arrowDownOutline,
  refreshOutline,
  filterOutline,
  addOutline,
  personOutline,
} from 'ionicons/icons';

export interface Post {
  id: number;
  title: string;
  description: string;
  updatedAt: string;
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

  constructor(private router: Router) {
    addIcons({
      notificationsOutline,
      arrowDownOutline,
      refreshOutline,
      filterOutline,
      addOutline,
      personOutline,
    });
  }

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.posts = [
      {
        id: 1,
        title: 'Thông báo về chính sách nghỉ phép mới',
        description: 'Công ty đã cập nhật chính sách nghỉ phép năm 2024 với nhiều thay đổi quan trọng...',
        updatedAt: '2024-01-15 10:30',
      },
      {
        id: 2,
        title: 'Lịch đào tạo nhân viên tháng 2',
        description: 'Phòng HR thông báo lịch đào tạo các khóa học kỹ năng mềm và chuyên môn...',
        updatedAt: '2024-01-14 14:20',
      },
      {
        id: 3,
        title: 'Thông báo tuyển dụng vị trí mới',
        description: 'Công ty đang tuyển dụng các vị trí: Developer, Designer, Marketing...',
        updatedAt: '2024-01-13 09:15',
      },
      {
        id: 4,
        title: 'Kế hoạch team building quý 1',
        description: 'Thông báo về chương trình team building dự kiến tổ chức vào cuối tháng 3...',
        updatedAt: '2024-01-12 16:45',
      },
      {
        id: 5,
        title: 'Cập nhật quy định làm việc từ xa',
        description: 'Công ty ban hành quy định mới về chế độ làm việc từ xa và hybrid...',
        updatedAt: '2024-01-11 11:00',
      },
    ];
    this.filteredPosts = [...this.posts];
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
    setTimeout(() => {
      this.loadPosts();
      if (event?.target) {
        event.target.complete();
      }
    }, 1000);
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
    console.log('View detail for post:', post.id);
  }

  onCreatePost() {
    this.router.navigate(['/create-post']);
  }

  onNotificationClick() {
    console.log('Notification clicked');
  }
}
