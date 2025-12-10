import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonInput,
  IonItem,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, copyOutline } from 'ionicons/icons';
import { JobPostService, JobResponse } from '../../services/job-post.service';
import { JdFormatPipe } from '../../pipes/jd-format.pipe';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-job-detail',
  templateUrl: './job-detail.page.html',
  styleUrls: ['./job-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    JdFormatPipe,
    AppHeaderComponent,
  ],
})
export class JobDetailPage implements OnInit {
  jobId: number | null = null;
  jobData: JobResponse | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private jobPostService: JobPostService,
    private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      copyOutline,
    });
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.jobId = parseInt(id);
        this.loadJobData();
      } else {
        this.showToast('Không tìm thấy ID bài đăng', 'danger');
        this.router.navigate(['/home']);
      }
    });
  }

  async loadJobData() {
    if (!this.jobId) return;

    this.jobPostService.getJobPostById(this.jobId).subscribe({
      next: (job: JobResponse) => {
        this.jobData = job;
      },
      error: async (error) => {
        this.showToast(
          error.message || 'Không thể tải dữ liệu bài đăng',
          'danger'
        );
        this.router.navigate(['/home']);
      },
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Chưa có';
    try {
      // Parse LocalDateTime string (yyyy-MM-ddTHH:mm:ss) từ backend
      // LocalDateTime không có timezone, nên parse như local date
      let date: Date;
      if (dateString.includes('T')) {
        const [datePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        // Tạo Date object với local date (không bị ảnh hưởng timezone)
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) return 'Chưa có';
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (e) {
      return 'Chưa có';
    }
  }

  formatSalary(): string {
    if (!this.jobData) return 'Thỏa thuận';
    if (
      this.jobData.salaryFrom !== undefined &&
      this.jobData.salaryFrom !== null
    ) {
      if (
        this.jobData.salaryTo !== undefined &&
        this.jobData.salaryTo !== null
      ) {
        return `${this.formatCurrency(
          this.jobData.salaryFrom
        )} - ${this.formatCurrency(this.jobData.salaryTo)} VNĐ`;
      } else {
        return `Từ ${this.formatCurrency(this.jobData.salaryFrom)} VNĐ`;
      }
    } else if (
      this.jobData.salaryTo !== undefined &&
      this.jobData.salaryTo !== null
    ) {
      return `Lên tới ${this.formatCurrency(this.jobData.salaryTo)} VNĐ`;
    }
    return 'Thỏa thuận';
  }

  formatCurrency(amount: number): string {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  formatWorkTime(): string {
    if (!this.jobData?.workTime) return 'Chưa có';
    const workTimeMap: { [key: string]: string } = {
      fulltime: 'Fulltime',
      parttime: 'Parttime',
      internship: 'Internship',
      contract: 'Contract',
      freelance: 'Freelance',
    };
    return (
      workTimeMap[this.jobData.workTime.toLowerCase()] || this.jobData.workTime
    );
  }

  formatExperience(): string {
    if (!this.jobData) return 'Không yêu cầu';
    if (this.jobData.yoe !== undefined && this.jobData.yoe !== null) {
      return `${this.jobData.yoe} ${this.jobData.unit || 'năm'}`;
    }
    return 'Không yêu cầu';
  }

  onBack() {
    this.router.navigate(['/home']);
  }

  onUpdate() {
    if (this.jobId) {
      this.router.navigate(['/edit-post', this.jobId]);
    }
  }

  onCancel() {
    this.router.navigate(['/home']);
  }

  async copyApplyUrl() {
    if (!this.jobData?.applyUrl) {
      await this.showToast('Không có URL để copy', 'danger');
      return;
    }

    try {
      await navigator.clipboard.writeText(this.jobData.applyUrl);
      await this.showToast('Đã copy URL vào clipboard', 'success');
    } catch (e) {
      await this.showToast('Không thể copy URL', 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: color as any,
      position: 'top',
    });
    await toast.present();
  }
}
