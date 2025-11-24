import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
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
  IonTextarea,
  IonToggle,
  IonItem,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { JobCreationStateService, RoundConfiguration } from '../../services/job-creation-state.service';
import { JobPostService } from '../../services/job-post.service';

@Component({
  selector: 'app-configure-rounds',
  templateUrl: './configure-rounds.page.html',
  styleUrls: ['./configure-rounds.page.scss'],
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
    IonToggle,
    IonItem,
    IonLabel,
  ],
})
export class ConfigureRoundsPage implements OnInit {
  roundsForm: FormGroup;
  roundCount: number = 0;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private jobCreationState: JobCreationStateService,
    private jobPostService: JobPostService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      arrowBackOutline,
      checkmarkOutline,
      chevronForwardOutline,
    });

    this.roundsForm = this.formBuilder.group({
      rounds: this.formBuilder.array([]),
    });
  }

  ngOnInit() {
    // Kiểm tra xem có dữ liệu không
    const roundCount = this.jobCreationState.getRoundCount();
    if (!roundCount || roundCount < 1) {
      this.router.navigate(['/select-rounds']);
      return;
    }

    this.roundCount = roundCount;
    this.initializeRounds();
  }

  get roundsArray(): FormArray {
    return this.roundsForm.get('rounds') as FormArray;
  }

  private initializeRounds() {
    const roundsArray = this.roundsForm.get('rounds') as FormArray;
    roundsArray.clear();

    for (let i = 0; i < this.roundCount; i++) {
      const roundGroup = this.formBuilder.group({
        roundName: [`Vòng ${i + 1}`, [Validators.required]],
        passEmailTemplate: [''],
        failEmailTemplate: [''],
        isConfirmed: [false],
      });
      roundsArray.push(roundGroup);
    }
  }

  onBack() {
    this.router.navigate(['/select-rounds']);
  }

  async onSubmit() {
    if (this.roundsForm.invalid) {
      this.markFormGroupTouched();

      const toast = await this.toastController.create({
        message: 'Vui lòng điền đầy đủ thông tin cho tất cả các vòng',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Lấy dữ liệu từ form
    const roundsData = this.roundsForm.value.rounds;
    const rounds: RoundConfiguration[] = roundsData.map((round: any, index: number) => ({
      roundIndex: index,
      roundName: round.roundName,
      passEmailTemplate: round.passEmailTemplate || undefined,
      failEmailTemplate: round.failEmailTemplate || undefined,
      isConfirmed: round.isConfirmed || false,
    }));

    this.jobCreationState.setRounds(rounds);

    // Tạo bài đăng
    await this.createJob();
  }

  private async createJob() {
    const loading = await this.loadingController.create({
      message: 'Đang tạo bài đăng...',
      spinner: 'crescent',
    });
    await loading.present();

    const createJobRequest = this.jobCreationState.buildCreateJobRequest();

    if (!createJobRequest) {
      await loading.dismiss();
      const toast = await this.toastController.create({
        message: 'Có lỗi xảy ra. Vui lòng thử lại.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
      return;
    }

    this.jobPostService.createJob(createJobRequest).subscribe({
      next: async (response) => {
        await loading.dismiss();

        // Clear state
        this.jobCreationState.clear();

        const toast = await this.toastController.create({
          message: `Tạo bài đăng thành công! (ID: ${response.jobId}, Số vòng: ${response.roundCount})`,
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
          message: error.message || 'Tạo bài đăng thất bại. Vui lòng thử lại.',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }

  private markFormGroupTouched() {
    this.roundsArray.controls.forEach((control) => {
      control.markAllAsTouched();
    });
  }

  onEmailTemplateClick(type: 'pass' | 'fail', roundIndex: number) {
    // TODO: Navigate to email template editor
    console.log(`Open ${type} email template for round ${roundIndex}`);
  }
}



