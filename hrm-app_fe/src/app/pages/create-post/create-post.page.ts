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
  ],
})
export class CreatePostPage implements OnInit {
  createPostForm: FormGroup;
  notificationCount: number = 2;
  minDate: string = '';

  statusOptions = [
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'closed', label: 'Đã đóng' },
  ];

  autoFormOptions = [
    { value: 'form1', label: 'Form 1' },
    { value: 'form2', label: 'Form 2' },
    { value: 'form3', label: 'Form 3' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
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

    this.createPostForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      salary: ['', [Validators.required]],
      address: ['', [Validators.required]],
      status: ['', [Validators.required]],
      deadline: ['', [Validators.required]],
      recruitmentRound: ['', [Validators.required, Validators.min(1)]],
      autoForm: ['', [Validators.required]],
      content: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    // Khởi tạo minDate một lần để tránh ExpressionChangedAfterItHasBeenCheckedError
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.minDate = today.toISOString();
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

    const loading = await this.loadingController.create({
      message: 'Đang tạo bài đăng...',
      spinner: 'crescent',
    });
    await loading.present();

    // Simulate API call
    setTimeout(async () => {
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Tạo bài đăng thành công!',
        duration: 2000,
        color: 'success',
        position: 'top',
      });
      await toast.present();

      // Navigate back to home
      this.router.navigate(['/home']);
    }, 1500);
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

