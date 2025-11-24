import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import {CustomDateAdapter, CUSTOM_DATE_FORMATS} from "./custom-date-adapter";
import { JobPostService, CreateJobRequest, JobRoundDTO } from '../../services/job-post.service';
import { JobCreationStateService } from '../../services/job-creation-state.service';

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.page.html',
  styleUrls: ['./create-post.page.scss'],
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
export class CreatePostPage implements OnInit {
  createPostForm: FormGroup;
  notificationCount: number = 2;
  minDate: string = '';
  minDateValue: Date = new Date();

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
    private jobPostService: JobPostService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private jobCreationState: JobCreationStateService
  ) {
    addIcons({
      notificationsOutline,
      personOutline,
      arrowBackOutline,
      calendarOutline,
      chevronDownOutline,
      closeOutline,
    });

    this.createPostForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      salaryFrom: ['', [Validators.required]],
      salaryTo: ['', [Validators.required]],
      address: ['', [Validators.required]],
      minExperience: [''],
      experienceUnit: ['year'],
      workTime: ['', [Validators.required]],
      status: ['', [Validators.required]],
      deadline: ['', [Validators.required]],
      content: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    // Khởi tạo minDate một lần để tránh ExpressionChangedAfterItHasBeenCheckedError
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.minDate = today.toISOString();
    this.minDateValue = today;
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
      this.createPostForm.patchValue({ deadline: isoString });
      this.createPostForm.get('deadline')?.markAsTouched();
    }
  }

  onDatePickerChange(event: any) {
    if (event.value) {
      // Lưu Date object để Material Datepicker hiển thị đúng format dd/mm/yyyy
      const date = new Date(event.value);
      date.setHours(0, 0, 0, 0);
      this.createPostForm.patchValue({ deadline: date });
      this.createPostForm.get('deadline')?.markAsTouched();
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
    if (this.createPostForm.invalid) {
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

    // Lấy giá trị từ form
    const formValue = this.createPostForm.value;
    
    // Parse salaryFrom và salaryTo từ form (backend yêu cầu số, không phải string)
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

    // Lưu dữ liệu vào service (chưa có rounds)
    const jobData: Partial<CreateJobRequest> = {
      title: formValue.title,
      description: formValue.content || '',
      location: formValue.address || undefined,
      salaryFrom: salaryFrom,
      salaryTo: salaryTo,
      workTime: formValue.workTime || undefined,
      yoe: yoe,
      unit: unit,
      status: formValue.status || 'active',
      deadline: deadline,
    };

    this.jobCreationState.setJobData(jobData);

    // Navigate sang trang chọn số vòng tuyển dụng
    this.router.navigate(['/select-rounds']);
  }

  onCancel() {
    this.router.navigate(['/home']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.createPostForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched() {
    Object.keys(this.createPostForm.controls).forEach((key) => {
      const control = this.createPostForm.get(key);
      control?.markAsTouched();
    });
  }
}

