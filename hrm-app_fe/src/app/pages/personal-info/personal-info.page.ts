import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonLabel,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, arrowBackOutline } from 'ionicons/icons';
import { BusinessService } from '../../services/business.service';

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.page.html',
  styleUrls: ['./personal-info.page.scss'],
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
    IonLabel,
  ],
})
export class PersonalInfoPage implements OnInit {
  personalInfoForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private businessService: BusinessService
  ) {
    addIcons({
      personOutline,
      arrowBackOutline,
    });

    this.personalInfoForm = this.formBuilder.group({
      companyName: ['', [Validators.required]],
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)],
      ],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit() {
    this.loadPersonalInfo();
  }

  async loadPersonalInfo() {
    this.businessService.getCurrentBusiness().subscribe({
      next: (business) => {
        this.personalInfoForm.patchValue({
          companyName: business.companyName || '',
          phoneNumber: business.phone || '',
          email: business.email || '',
        });
      },
      error: async (error) => {
        const toast = await this.toastController.create({
          message: error.message || 'Không thể tải thông tin',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }

  async onUpdate() {
    if (this.personalInfoForm.invalid) {
      this.markFormGroupTouched();

      const toast = await this.toastController.create({
        message: 'Vui lòng điền đầy đủ thông tin hợp lệ',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    const updateRequest = {
      companyName: this.personalInfoForm.value.companyName,
      phone: this.personalInfoForm.value.phoneNumber,
      email: this.personalInfoForm.value.email,
    };

    this.businessService.updateBusiness(updateRequest).subscribe({
      next: async () => {
        const toast = await this.toastController.create({
          message: 'Cập nhật thông tin thành công!',
          duration: 2000,
          color: 'success',
          position: 'top',
        });
        await toast.present();

        // Nếu đi từ menu: quay về Home và yêu cầu mở lại menu
        // Nếu không: quay về Home bình thường
        this.navigateBackToMenu();
      },
      error: async (error) => {
        const toast = await this.toastController.create({
          message: error.message || 'Cập nhật thông tin thất bại',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }

  onBack() {
    this.navigateBackToMenu();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.personalInfoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched() {
    Object.keys(this.personalInfoForm.controls).forEach((key) => {
      const control = this.personalInfoForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Khi ấn Back hoặc Update xong:
   * - Luôn quay về màn Home
   * - Gửi queryParam yêu cầu Home tự mở lại Menu sidebar
   */
  private navigateBackToMenu() {
    this.router.navigate(['/home'], {
      queryParams: { openMenu: 'true' },
    });
  }
}
