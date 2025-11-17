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
  IonIcon,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonModal,
  IonDatetime,
  IonBadge,
  IonAvatar,
  IonButtons,
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
    IonBadge,
    IonAvatar,
    IonButtons,
  ],
})
export class CreatePostPage implements OnInit {
  createPostForm: FormGroup;
  notificationCount: number = 2;

  statusOptions = [
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'closed', label: 'Đã đóng' },
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
    });

    this.createPostForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      salary: ['', [Validators.required]],
      address: ['', [Validators.required]],
      status: ['', [Validators.required]],
      deadline: ['', [Validators.required]],
      recruitmentRound: ['', [Validators.required, Validators.min(1)]],
      content: ['', [Validators.required]],
    });
  }

  ngOnInit() {}

  getTodayDate(): string {
    return new Date().toISOString();
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
    this.createPostForm.patchValue({ deadline: dateValue });
  }

  closeDateModal() {
    // Modal will close automatically when clicking outside or using the close button
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

