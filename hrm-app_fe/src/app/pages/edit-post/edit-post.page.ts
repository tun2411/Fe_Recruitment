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
  IonItem,
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
import { JobPostService, UpdateJobRequest, JobResponse, JobRoundDTO } from '../../services/job-post.service';

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
    IonItem,
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
  jobId: number | null = null;
  jobData: JobResponse | null = null;

  statusOptions = [
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' },
    { value: 'closed', label: 'Đã đóng' },
  ];

  experienceUnitOptions = [
    { value: 'year', label: 'Năm' },
    { value: 'month', label: 'Tháng' },
  ];

  workTimeOptions = [
    { value: 'fulltime', label: 'Fulltime' },
    { value: 'parttime', label: 'Parttime' },
    { value: 'internship', label: 'Internship' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private jobPostService: JobPostService,
    private toastController: ToastController,
    private loadingController: LoadingController
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
      salaryFrom: [''],
      salaryTo: [''],
      address: ['', [Validators.required]],
      minExperience: [''],
      experienceUnit: ['year'],
      workTime: [''],
      status: ['', [Validators.required]],
      deadline: [''],
      recruitmentRound: ['', [Validators.required, Validators.min(1)]],
      content: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    // Khởi tạo minDate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.minDate = today.toISOString();
    this.minDateValue = today;

    // Lấy jobId từ route params
    this.route.params.subscribe((params) => {
      this.jobId = params['id'] ? parseInt(params['id']) : null;
      if (this.jobId) {
        this.loadJobData();
      } else {
        this.showToast('Không tìm thấy ID bài đăng', 'danger');
        this.router.navigate(['/home']);
      }
    });
  }

  async loadJobData() {
    if (!this.jobId) return;

    const loading = await this.loadingController.create({
      message: 'Đang tải dữ liệu...',
      spinner: 'crescent',
    });
    await loading.present();

    this.jobPostService.getJobPostById(this.jobId).subscribe({
      next: (job: JobResponse) => {
        this.jobData = job;
        this.populateForm(job);
        loading.dismiss();
      },
      error: async (error) => {
        loading.dismiss();
        this.showToast(error.message || 'Không thể tải dữ liệu bài đăng', 'danger');
        this.router.navigate(['/home']);
      },
    });
  }

  populateForm(job: JobResponse) {
    // Backend trả về salaryFrom và salaryTo trực tiếp (number), không phải salaryRange string
    let salaryFrom = '';
    let salaryTo = '';
    if (job.salaryFrom !== undefined && job.salaryFrom !== null) {
      salaryFrom = job.salaryFrom.toString();
    }
    if (job.salaryTo !== undefined && job.salaryTo !== null) {
      salaryTo = job.salaryTo.toString();
    }

    // Parse yoe (years of experience) từ backend
    let minExperience = '';
    if (job.yoe !== undefined && job.yoe !== null) {
      minExperience = job.yoe.toString();
    }

    // Lấy unit từ backend
    const experienceUnit = job.unit || 'year';

    this.editPostForm.patchValue({
      title: job.title || '',
      salaryFrom: salaryFrom,
      salaryTo: salaryTo,
      address: job.location || '',
      minExperience: minExperience,
      experienceUnit: experienceUnit,
      workTime: job.workTime || '',
      status: job.status || 'active',
      recruitmentRound: job.roundCount || 1,
      content: job.description || '',
    });

    // Set deadline từ job.deadline (LocalDateTime format từ backend)
    if (job.deadline) {
      // Parse LocalDateTime string (yyyy-MM-ddTHH:mm:ss) thành Date object
      const deadlineDate = new Date(job.deadline);
      this.editPostForm.patchValue({ deadline: deadlineDate });
    } else if (job.publishedAt) {
      // Fallback: sử dụng publishedAt nếu không có deadline
      const deadlineDate = new Date(job.publishedAt);
      this.editPostForm.patchValue({ deadline: deadlineDate });
    }
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
      const date = new Date(dateValue);
      date.setHours(0, 0, 0, 0);
      const isoString = date.toISOString();
      this.editPostForm.patchValue({ deadline: isoString });
      this.editPostForm.get('deadline')?.markAsTouched();
    }
  }

  onDatePickerChange(event: any) {
    if (event.value) {
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
    if (this.editPostForm.invalid || !this.jobId) {
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

    const loading = await this.loadingController.create({
      message: 'Đang cập nhật bài đăng...',
      spinner: 'crescent',
    });
    await loading.present();

    const formValue = this.editPostForm.value;
    
    // Parse salaryFrom và salaryTo từ form (backend yêu cầu number)
    let salaryFrom: number | undefined = undefined;
    let salaryTo: number | undefined = undefined;
    if (formValue.salaryFrom) {
      salaryFrom = parseInt(formValue.salaryFrom) || undefined;
    }
    if (formValue.salaryTo) {
      salaryTo = parseInt(formValue.salaryTo) || undefined;
    }

    // Parse yoe (years of experience) từ minExperience (backend yêu cầu Double/number)
    let yoe: number | undefined = undefined;
    if (formValue.minExperience) {
      yoe = parseFloat(formValue.minExperience) || undefined;
    }

    // Lấy unit từ experienceUnit
    const unit: string | undefined = formValue.experienceUnit || undefined;

    // Format deadline thành LocalDateTime format (yyyy-MM-ddTHH:mm:ss)
    let deadline: string | undefined = undefined;
    if (formValue.deadline) {
      const deadlineDate = new Date(formValue.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      // Format: yyyy-MM-ddTHH:mm:ss (LocalDateTime format)
      const year = deadlineDate.getFullYear();
      const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
      const day = String(deadlineDate.getDate()).padStart(2, '0');
      deadline = `${year}-${month}-${day}T00:00:00`;
    }

    // Tạo rounds từ recruitmentRound (hoặc giữ nguyên rounds hiện tại)
    const roundCount = formValue.recruitmentRound || 1;
    let rounds: JobRoundDTO[] | undefined = undefined;
    
    // Nếu roundCount thay đổi, tạo rounds mới
    if (this.jobData && roundCount !== this.jobData.roundCount) {
      rounds = [];
      for (let i = 0; i < roundCount; i++) {
        rounds.push({
          roundIndex: i, // Backend yêu cầu bắt đầu từ 0
          roundName: `Vòng ${i + 1}`,
          isConfirmed: false,
        });
      }
    }

    // Tạo UpdateJobRequest theo đúng format backend
    const updateJobRequest: UpdateJobRequest = {
      title: formValue.title,
      description: formValue.content || '',
      location: formValue.address || undefined,
      salaryFrom: salaryFrom,
      salaryTo: salaryTo,
      workTime: formValue.workTime || undefined,
      yoe: yoe,
      unit: unit,
      rounds: rounds,
      status: formValue.status || 'active',
      deadline: deadline,
    };

    // Gọi API
    this.jobPostService.updateJobPost(this.jobId, updateJobRequest).subscribe({
      next: async (response) => {
        await loading.dismiss();

        const toast = await this.toastController.create({
          message: response.message || 'Cập nhật bài đăng thành công!',
          duration: 3000,
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
          message: error.message || 'Cập nhật bài đăng thất bại. Vui lòng thử lại.',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
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

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
    });
    await toast.present();
  }
}


