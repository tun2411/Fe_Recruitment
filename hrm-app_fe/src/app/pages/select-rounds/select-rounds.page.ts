import { Component, OnInit, ViewChild } from '@angular/core';
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
  selector: 'app-select-rounds',
  templateUrl: './select-rounds.page.html',
  styleUrls: ['./select-rounds.page.scss'],
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
    IonToggle,
    IonItem,
  ],
})
export class SelectRoundsPage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;

  roundForm: FormGroup;
  roundsForm: FormGroup;
  showRoundsForm = false;
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

    this.roundForm = this.formBuilder.group({
      roundCount: ['', [Validators.required, Validators.min(1), Validators.max(10)]],
    });

    this.roundsForm = this.formBuilder.group({
      rounds: this.formBuilder.array([]),
    });
  }

  ngOnInit() {
    // Kiểm tra xem có dữ liệu job không
    if (!this.jobCreationState.getJobData()) {
      // Nếu không có, quay về trang create-post
      this.router.navigate(['/create-post']);
    }
  }

  get roundsArray(): FormArray {
    return this.roundsForm.get('rounds') as FormArray;
  }

  onBack() {
    // Quay về trang create-post
    this.router.navigate(['/create-post']);
  }

  async onSubmit() {
    if (this.roundForm.invalid) {
      const toast = await this.toastController.create({
        message: 'Vui lòng nhập số vòng tuyển dụng (từ 1 đến 10)',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    const roundCount = parseInt(this.roundForm.value.roundCount);
    this.roundCount = roundCount;
    this.jobCreationState.setRoundCount(roundCount);

    // Khởi tạo form rounds
    this.initializeRounds();
    
    // Hiển thị form rounds (nhưng vẫn giữ form số vòng ở trên)
    this.showRoundsForm = true;

    // Scroll xuống form rounds sau một chút để animation smooth
    setTimeout(() => {
      this.content?.scrollToBottom(300);
    }, 100);
  }

  onRoundCountChange() {
    // Khi số vòng thay đổi, cập nhật lại form rounds nếu đã hiển thị
    if (this.showRoundsForm && this.roundForm.valid) {
      const newRoundCount = parseInt(this.roundForm.value.roundCount);
      if (newRoundCount !== this.roundCount) {
        this.roundCount = newRoundCount;
        this.jobCreationState.setRoundCount(newRoundCount);
        this.initializeRounds();
      }
    }
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

  async onSubmitRounds() {
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

    // Chuyển sang trang configure-rounds để cấu hình rounds và templates
    this.router.navigate(['/configure-rounds']);
  }


  private markFormGroupTouched() {
    this.roundsArray.controls.forEach((control) => {
      control.markAllAsTouched();
    });
  }

  onEmailTemplateClick(type: 'pass' | 'fail', roundIndex: number) {
    // Navigate to configure-rounds page với queryParams để chọn template
    // Lấy jobId từ state nếu có
    const jobId = this.jobCreationState.getJobId();
    this.router.navigate(['/configure-rounds'], {
      queryParams: { 
        jobId: jobId || undefined,
        roundIndex, 
        type 
      },
    });
  }
}


