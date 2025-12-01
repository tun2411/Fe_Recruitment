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
  IonLabel,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  arrowBackOutline,
} from 'ionicons/icons';
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
    private toastController: ToastController,
    private loadingController: LoadingController,
    private businessService: BusinessService
  ) {
    addIcons({
      personOutline,
      arrowBackOutline,
    });

    this.personalInfoForm = this.formBuilder.group({
      companyName: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit() {
    this.loadPersonalInfo();
  }

  async loadPersonalInfo() {
    const loading = await this.loadingController.create({
      message: 'Đang tải thông tin...',
      spinner: 'crescent',
    });
    await loading.present();

    this.businessService.getCurrentBusiness().subscribe({
      next: (business) => {
        this.personalInfoForm.patchValue({
          companyName: business.companyName || '',
          phoneNumber: business.phone || '',
          email: business.email || '',
        });
        loading.dismiss();
      },
      error: async (error) => {
        await loading.dismiss();
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

    const loading = await this.loadingController.create({
      message: 'Đang cập nhật thông tin...',
      spinner: 'crescent',
    });
    await loading.present();

    const updateRequest = {
      companyName: this.personalInfoForm.value.companyName,
      phone: this.personalInfoForm.value.phoneNumber,
      email: this.personalInfoForm.value.email,
    };

    this.businessService.updateBusiness(updateRequest).subscribe({
      next: async () => {
        await loading.dismiss();

        const toast = await this.toastController.create({
          message: 'Cập nhật thông tin thành công!',
          duration: 2000,
          color: 'success',
          position: 'top',
        });
        await toast.present();

        // Navigate back
        this.router.navigate(['/dashboard']);
      },
      error: async (error) => {
        await loading.dismiss();

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
    this.router.navigate(['/dashboard']);
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
}

