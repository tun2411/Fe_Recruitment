import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonModal,
  IonDatetime,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  personOutline,
  arrowBackOutline,
  calendarOutline,
  chevronDownOutline,
  closeOutline,
} from 'ionicons/icons';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from "@angular/material/core";
import {MatIconModule} from "@angular/material/icon";
import {CustomDateAdapter, CUSTOM_DATE_FORMATS} from "../create-post/custom-date-adapter";
import { JobPostService } from '../../services/job-post.service';

@Component({
  selector: 'app-edit-post',
  templateUrl: './edit-post.page.html',
  styleUrls: ['./edit-post.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonLabel,
    IonModal,
    IonDatetime,
    IonButtons,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'vi-VN' },
  ],
})
export class EditPostPage implements OnInit {
  editPostForm: FormGroup;
  notificationCount: number = 2;
  minDate: string = '';
  minDateValue: Date = new Date();
  postId: number | null = null;
  isLoading: boolean = false;

  statusOptions = [
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'closed', label: 'Đã đóng' },
  ];

  experienceUnitOptions = [
    { value: 'year', label: 'Năm' },
    { value: 'month', label: 'Tháng' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private jobPostService: JobPostService
  ) {
    addIcons({
      notificationsOutline,
      personOutline,
      arrowBackOutline,
      calendarOutline,
      chevronDownOutline,
      closeOutline,
    });

    this.editPostForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      salaryFrom: ['', [Validators.required]],
      salaryTo: ['', [Validators.required]],
      address: ['', [Validators.required]],
      minExperience: [''],
      experienceUnit: ['year'],
      status: ['', [Validators.required]],
      deadline: ['', [Validators.required]],
      recruitmentRound: ['', [Validators.required, Validators.min(1)]],
      content: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    // Khởi tạo minDate một lần để tránh ExpressionChangedAfterItHasBeenCheckedError
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.minDate = today.toISOString();
    this.minDateValue = today;

    // Lấy postId từ route params
    this.route.params.subscribe(params => {
      this.postId = +params['id'];
      if (this.postId) {
        this.loadPostData();
      }
    });
  }

  loadPostData() {
    if (!this.postId) return;

    this.isLoading = true;
    this.jobPostService.getJobPostById(this.postId).subscribe({
      next: (post: any) => {
        // Parse salary range (format: "from-to" or similar)
        let salaryFrom = '';
        let salaryTo = '';
        if (post.salaryRange) {
          const parts = post.salaryRange.split('-');
          if (parts.length >= 2) {
            salaryFrom = parts[0].trim();
            salaryTo = parts[1].trim();
          }
        }

        // Parse deadline if exists
        let deadline = '';
        if (post.deadline) {
          deadline = new Date(post.deadline);
        }

        // Populate form
        this.editPostForm.patchValue({
          title: post.title || '',
          salaryFrom: salaryFrom,
          salaryTo: salaryTo,
          address: post.location || '',
          minExperience: post.minExperience || '',
          experienceUnit: post.experienceUnit || 'year',
          status: post.status || '',
          deadline: deadline,
          recruitmentRound: post.roundCount || '',
          content: post.description || '',
        });

        this.isLoading = false;
      },
      error: async (error) => {
        this.isLoading = false;
        console.error('Error loading post:', error);
        const toast = await this.toastController.create({
          message: 'Không thể tải dữ liệu bài đăng',
          duration: 2000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
        this.router.navigate(['/home']);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  onDateChange(event: any) {
    const dateValue = event.detail.value;
    if (dateValue) {
      // Chuyển đổi thành ISO string và đặt thời gian về 00:00:00
      const date = new Date(dateValue);
      date.setHours(0, 0, 0, 0);
      const isoString = date.toISOString();
      this.editPostForm.patchValue({ deadline: isoString });
      this.editPostForm.get('deadline')?.markAsTouched();
    }
  }

  onDatePickerChange(event: any) {
    if (event.value) {
      // Lưu Date object để Material Datepicker hiển thị đúng format dd/mm/yyyy
      const date = new Date(event.value);
      date.setHours(0, 0, 0, 0);
      this.editPostForm.patchValue({ deadline: date });
      this.editPostForm.get('deadline')?.markAsTouched();
    }
  }

  confirmDate(dateModal: IonModal) {
    dateModal.dismiss();
  }

  onBack() {
    this.router.navigate(['/home']);
  }

  onNotificationClick() {
    console.log('Notification clicked');
  }

  async onSubmit() {
    if (this.editPostForm.invalid) {
      this.markFormGroupTouched();

      const toast = await this.toastController.create({
        message: 'Vui lòng điền đầy đủ thông tin',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    if (!this.postId) {
      const toast = await this.toastController.create({
        message: 'Không tìm thấy ID bài đăng',
        duration: 2000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Đang cập nhật bài đăng...',
      spinner: 'crescent',
    });
    await loading.present();

    const formValue = this.editPostForm.value;
    const updateData = {
      title: formValue.title,
      description: formValue.content,
      location: formValue.address,
      salaryRange: `${formValue.salaryFrom}-${formValue.salaryTo}`,
      status: formValue.status,
      roundCount: formValue.recruitmentRound,
      deadline: formValue.deadline,
    };

    this.jobPostService.updateJobPost(this.postId, updateData).subscribe({
      next: async () => {
        await loading.dismiss();

        const toast = await this.toastController.create({
          message: 'Cập nhật bài đăng thành công!',
          duration: 2000,
          color: 'success',
          position: 'top',
        });
        await toast.present();

        // Navigate back to home
        this.router.navigate(['/home']);
      },
      error: async (error) => {
        await loading.dismiss();

        const toast = await this.toastController.create({
          message: error.message || 'Có lỗi xảy ra khi cập nhật',
          duration: 2000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      }
    });
  }

  onCancel() {
    this.router.navigate(['/home']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editPostForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched() {
    Object.keys(this.editPostForm.controls).forEach((key) => {
      const control = this.editPostForm.get(key);
      control?.markAsTouched();
    });
  }
}

