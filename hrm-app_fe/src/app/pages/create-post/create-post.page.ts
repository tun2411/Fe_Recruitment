import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { CustomDateAdapter, CUSTOM_DATE_FORMATS } from './custom-date-adapter';
import {
  JobPostService,
  CreateJobRequest,
  JobRoundDTO,
} from '../../services/job-post.service';
import {
  JobCreationStateService,
  RoundConfiguration,
} from '../../services/job-creation-state.service';

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
      status: ['inactive'], // Mặc định inactive khi tạo job cơ bản
      deadline: ['', [Validators.required]],
      content: ['', [Validators.required]],
      roundCount: ['', [Validators.required, Validators.min(1)]], // Thêm roundCount
    });
  }

  ngOnInit() {
    // Khởi tạo minDate là ngày mai (chỉ cho phép chọn ngày lớn hơn ngày hiện tại)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Set minDate là ngày mai (today + 1 day)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString();
    this.minDateValue = tomorrow;

    // Clear state khi vào create-post (không cần xóa draft job vì không tạo draft nữa)
    this.jobCreationState.clear();
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

      // Validation: Kiểm tra ngày phải lớn hơn ngày hiện tại
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date <= today) {
        // Nếu ngày chọn <= ngày hiện tại, hiển thị lỗi và không lưu
        this.createPostForm.get('deadline')?.setErrors({ invalidDate: true });
        this.createPostForm.get('deadline')?.markAsTouched();

        // Hiển thị toast thông báo
        this.toastController
          .create({
            message: 'Hạn bài đăng phải lớn hơn ngày hiện tại',
            duration: 2000,
            color: 'warning',
            position: 'top',
          })
          .then((toast) => toast.present());
        return;
      }

      const isoString = date.toISOString();
      this.createPostForm.patchValue({ deadline: isoString });
      this.createPostForm.get('deadline')?.setErrors(null);
      this.createPostForm.get('deadline')?.markAsTouched();
    }
  }

  onDatePickerChange(event: any) {
    if (event.value) {
      // Lưu Date object để Material Datepicker hiển thị đúng format dd/mm/yyyy
      const date = new Date(event.value);
      date.setHours(0, 0, 0, 0);

      // Validation: Kiểm tra ngày phải lớn hơn ngày hiện tại
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date <= today) {
        // Nếu ngày chọn <= ngày hiện tại, hiển thị lỗi và không lưu
        this.createPostForm.get('deadline')?.setErrors({ invalidDate: true });
        this.createPostForm.get('deadline')?.markAsTouched();

        // Clear giá trị không hợp lệ
        this.createPostForm.patchValue({ deadline: null });

        // Hiển thị toast thông báo
        this.toastController
          .create({
            message: 'Hạn bài đăng phải lớn hơn ngày hiện tại',
            duration: 2000,
            color: 'warning',
            position: 'top',
          })
          .then((toast) => toast.present());
        return;
      }

      this.createPostForm.patchValue({ deadline: date });
      this.createPostForm.get('deadline')?.setErrors(null);
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

    // Validation: salaryFrom < salaryTo
    const salaryFrom = parseInt(this.createPostForm.value.salaryFrom);
    const salaryTo = parseInt(this.createPostForm.value.salaryTo);
    if (salaryFrom >= salaryTo) {
      const toast = await this.toastController.create({
        message: 'Mức lương "Từ" phải nhỏ hơn "Đến"',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Validation: deadline phải lớn hơn ngày hiện tại
    const deadlineValue = this.createPostForm.value.deadline;
    if (deadlineValue) {
      const deadlineDate = new Date(deadlineValue);
      deadlineDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate <= today) {
        const toast = await this.toastController.create({
          message: 'Hạn bài đăng phải lớn hơn ngày hiện tại',
          duration: 2000,
          color: 'warning',
          position: 'top',
        });
        await toast.present();
        this.createPostForm.get('deadline')?.setErrors({ invalidDate: true });
        this.createPostForm.get('deadline')?.markAsTouched();
        return;
      }
    }

    const loading = await this.loadingController.create({
      message: 'Đang tạo job...',
      spinner: 'crescent',
    });
    await loading.present();

    // Lấy giá trị từ form
    const formValue = this.createPostForm.value;

    // Parse salaryFrom và salaryTo từ form (backend yêu cầu số, không phải string)
    let salaryFromNum: number | undefined = undefined;
    let salaryToNum: number | undefined = undefined;
    if (formValue.salaryFrom) {
      salaryFromNum = parseInt(formValue.salaryFrom) || undefined;
    }
    if (formValue.salaryTo) {
      salaryToNum = parseInt(formValue.salaryTo) || undefined;
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

    // Parse roundCount
    const roundCount = parseInt(formValue.roundCount) || 1;

    // Tạo CreateJobRequest (Bước 1: Lưu job data vào state để tạo job hoàn chỉnh ở bước sau)
    const createJobRequest: CreateJobRequest = {
      title: formValue.title,
      description: formValue.content || '',
      location: formValue.address || undefined,
      salaryFrom: salaryFromNum,
      salaryTo: salaryToNum,
      workTime: formValue.workTime || undefined,
      yoe: yoe,
      unit: unit,
      roundCount: roundCount,
      // Lấy status đúng từ form (có thể là 'active', 'inactive', hoặc 'closed')
      status: formValue.status as any,
      deadline: deadline,
    };

    // Không tạo draft job nữa, chỉ lưu data vào state
    // Job sẽ được tạo hoàn chỉnh khi user submit ở configure-rounds
    await loading.dismiss();

    // Lưu job data vào state (KHÔNG tạo job trong database)
    this.jobCreationState.setJobData(createJobRequest);
    this.jobCreationState.setRoundCount(createJobRequest.roundCount);

    // Khởi tạo rounds mặc định
    const defaultRounds: RoundConfiguration[] = [];
    for (let i = 0; i < createJobRequest.roundCount; i++) {
      defaultRounds.push({
        roundIndex: i,
        roundName: `Vòng ${i + 1}`,
        isConfirmed: false,
      });
    }
    this.jobCreationState.setRounds(defaultRounds);

    // Navigate sang trang configure-rounds (KHÔNG có jobId vì chưa tạo job)
    this.router.navigate(['/configure-rounds']).then(() => {
      // Hiển thị toast sau khi đã navigate
      setTimeout(async () => {
        const toast = await this.toastController.create({
          message: 'Tiếp tục cấu hình rounds...',
          duration: 2000,
          color: 'success',
          position: 'top',
        });
        await toast.present();
      }, 300);
    });
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
