import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
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
  IonList,
  IonListHeader,
  IonToggle,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  personOutline,
  arrowBackOutline,
  calendarOutline,
  chevronDownOutline,
  closeOutline,
  eyeOutline,
  settingsOutline,
  addOutline,
  trashOutline,
} from 'ionicons/icons';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from "@angular/material/core";
import {MatIconModule} from "@angular/material/icon";
import {CustomDateAdapter, CUSTOM_DATE_FORMATS} from "../create-post/custom-date-adapter";
import { JobPostService, UpdateJobRequest, JobResponse, JobRoundDTO } from '../../services/job-post.service';
import { JobCreationStateService, RoundConfiguration } from '../../services/job-creation-state.service';
import { TemplateService } from '../../services/template.service';
import { forkJoin, of, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
  jobId: number | null = null;
  jobData: JobResponse | null = null;
  
  // Lưu mapping formId -> roundIndex trước khi update để map lại roundId sau
  private formIdToRoundIndexMap: { [formId: number]: number } = {};

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
    private loadingController: LoadingController,
    private jobCreationState: JobCreationStateService,
    private templateService: TemplateService,
    private alertController: AlertController
  ) {
    addIcons({
      notificationsOutline,
      personOutline,
      arrowBackOutline,
      calendarOutline,
      chevronDownOutline,
      closeOutline,
      eyeOutline,
      settingsOutline,
      addOutline,
      trashOutline,
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

    // Tạo rounds từ recruitmentRound (Cách 1: Đơn giản)
    // Backend behavior:
    // - Nếu rounds != null && !empty: Xóa rounds cũ, tạo rounds mới, tự động cập nhật round_count = số rounds mới
    // - Nếu rounds == null hoặc empty: Giữ nguyên rounds hiện tại
    const roundCount = formValue.recruitmentRound || 1;
    const currentRounds = this.jobData?.rounds || [];
    const oldRoundCount = this.jobData?.roundCount || 0;
    
    let rounds: JobRoundDTO[] | undefined = undefined;
    
    // Chỉ build rounds nếu roundCount thay đổi
    if (roundCount !== oldRoundCount) {
      // Trước khi update, lưu mapping formId -> roundIndex từ rounds cũ
      // để có thể map lại roundId mới sau khi rounds được tạo lại
      this.saveFormToRoundIndexMapping(currentRounds);
      
      rounds = [];
      
      if (roundCount > oldRoundCount) {
        // Trường hợp TĂNG số vòng: Giữ hết vòng cũ + thêm vòng mới ở cuối
        // 1. Giữ lại tất cả rounds cũ
        for (let i = 0; i < oldRoundCount; i++) {
          const existingRound = currentRounds[i];
          rounds.push({
            roundIndex: i, // Backend yêu cầu bắt đầu từ 0
            roundName: existingRound?.roundName || `Vòng ${i + 1}`,
            isConfirmed: existingRound?.isConfirmed || false,
          });
        }
        
        // 2. Thêm rounds mới ở cuối
        for (let i = oldRoundCount; i < roundCount; i++) {
          rounds.push({
            roundIndex: i,
            roundName: `Vòng ${i + 1}`,
            isConfirmed: false,
          });
        }
      } else if (roundCount < oldRoundCount) {
        // Trường hợp GIẢM số vòng: Chỉ giữ lại số vòng mới, cắt bớt vòng thừa ở cuối
        for (let i = 0; i < roundCount; i++) {
          const existingRound = currentRounds[i];
          rounds.push({
            roundIndex: i,
            roundName: existingRound?.roundName || `Vòng ${i + 1}`,
            isConfirmed: existingRound?.isConfirmed || false,
          });
        }
      }
      
      // Validation: Đảm bảo số lượng rounds = roundCount mới (backend yêu cầu)
      if (rounds.length !== roundCount) {
        console.error(`Round count mismatch: expected ${roundCount}, got ${rounds.length}`);
        // Fallback: Tạo lại rounds từ đầu nếu có lỗi
        rounds = [];
        for (let i = 0; i < roundCount; i++) {
          const existingRound = currentRounds[i];
          rounds.push({
            roundIndex: i,
            roundName: existingRound?.roundName || `Vòng ${i + 1}`,
            isConfirmed: existingRound?.isConfirmed || false,
          });
        }
      }
    }
    // Nếu roundCount không đổi, rounds = undefined (backend sẽ giữ nguyên rounds hiện tại)

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
        // Kiểm tra nếu có thay đổi số vòng, load lại job data và chuyển sang trang cấu hình
        const roundCount = formValue.recruitmentRound || 1;
        const oldRoundCount = this.jobData?.roundCount || 0;
        const hasRoundCountChanged = roundCount !== oldRoundCount && rounds;

        if (hasRoundCountChanged) {
          // Load lại job data từ backend để lấy rounds mới
          this.jobPostService.getJobPostById(this.jobId!).subscribe({
            next: async (updatedJob) => {
              await loading.dismiss();

              // Cập nhật state với job data và rounds mới
              this.jobCreationState.setJobId(updatedJob.id!);
              this.jobCreationState.setRoundCount(updatedJob.roundCount || roundCount);
              
              // Convert JobResponse sang CreateJobRequest format để lưu vào state
              const jobDataForState = {
                title: updatedJob.title,
                description: updatedJob.description,
                location: updatedJob.location,
                salaryFrom: updatedJob.salaryFrom,
                salaryTo: updatedJob.salaryTo,
                workTime: updatedJob.workTime,
                yoe: updatedJob.yoe,
                unit: updatedJob.unit,
                roundCount: updatedJob.roundCount || roundCount,
                status: updatedJob.status,
                deadline: updatedJob.deadline,
              };
              this.jobCreationState.setJobData(jobDataForState);
              
              // Convert JobRoundDTO[] sang RoundConfiguration[]
              // QUAN TRỌNG: Giữ lại template data từ state cũ để không mất cấu hình
              const existingRounds = this.jobCreationState.getRounds();
              const roundsConfig: RoundConfiguration[] = (updatedJob.rounds || []).map((round) => {
                // Tìm round tương ứng trong existingRounds để giữ template data
                const existingRound = existingRounds?.find(
                  (r) => r.roundIndex === round.roundIndex
                );
                
                const newRound: RoundConfiguration = {
                  roundIndex: round.roundIndex,
                  roundName: round.roundName,
                  isConfirmed: round.isConfirmed || false,
                  // CHỈ giữ template nếu tìm thấy round tương ứng trong existingRounds
                  // Rounds mới (không có trong existingRounds) sẽ không có template
                  passEmailTemplate: existingRound?.passEmailTemplate,
                  failEmailTemplate: existingRound?.failEmailTemplate,
                };
                
                // Giữ lại templateId nếu có
                if (existingRound) {
                  (newRound as any).passTemplateId = (existingRound as any).passTemplateId;
                  (newRound as any).failTemplateId = (existingRound as any).failTemplateId;
                }
                
                return newRound;
              });
              
              // Merge với existingRounds để giữ template của rounds không có trong updatedJob.rounds
              // (trường hợp hiếm, nhưng đảm bảo không mất data)
              if (existingRounds && existingRounds.length > 0) {
                existingRounds.forEach((existingRound) => {
                  const found = roundsConfig.find(
                    (r) => r.roundIndex === existingRound.roundIndex
                  );
                  if (!found) {
                    // Round này không có trong updatedJob.rounds mới, nhưng vẫn giữ trong state
                    roundsConfig.push(existingRound);
                  }
                });
              }
              
              this.jobCreationState.setRounds(roundsConfig);

              // Lưu roundIds vào state
              const roundIds: { [roundIndex: number]: number } = {};
              updatedJob.rounds.forEach((round) => {
                if (round.roundId) {
                  roundIds[round.roundIndex] = round.roundId;
                }
              });
              this.jobCreationState.setRoundIds(roundIds);

              // Map lại roundId cho các forms dựa trên roundIndex
              // Tạo map: roundIndex -> roundId mới
              const roundIndexToNewRoundId: { [roundIndex: number]: number } = {};
              updatedJob.rounds.forEach((newRound) => {
                if (newRound.roundId) {
                  roundIndexToNewRoundId[newRound.roundIndex] = newRound.roundId;
                }
              });

              // Cập nhật lại roundId cho các forms dựa trên mapping đã lưu
              await this.updateFormsRoundId(roundIndexToNewRoundId);

              const toast = await this.toastController.create({
                message: 'Cập nhật số vòng thành công! Tiếp tục cấu hình các vòng...',
                duration: 3000,
                color: 'success',
                position: 'top',
              });
              await toast.present();

              // Chuyển sang trang cấu hình rounds
              this.router.navigate(['/configure-rounds'], {
                queryParams: { 
                  jobId: this.jobId,
                  fromEdit: 'true'
                },
              });
            },
            error: async (error) => {
              await loading.dismiss();
              const toast = await this.toastController.create({
                message: 'Cập nhật thành công nhưng không thể tải dữ liệu rounds mới',
                duration: 3000,
                color: 'warning',
                position: 'top',
              });
              await toast.present();
              this.router.navigate(['/home']);
            },
          });
        } else {
          // Không thay đổi số vòng, chỉ hiển thị thông báo và quay về home
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
        }
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

  /**
   * Navigate đến trang configure-rounds để chỉnh sửa
   */
  async onOpenRoundsConfig() {
    if (!this.jobId) {
      const toast = await this.toastController.create({
        message: 'Không tìm thấy job ID',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Load lại job data để đảm bảo có dữ liệu mới nhất
    const loading = await this.loadingController.create({
      message: 'Đang tải cấu hình...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      // Load job data mới nhất từ backend
      const job = await firstValueFrom(this.jobPostService.getJobPostById(this.jobId));
      this.jobData = job;

      // Cập nhật state với job data hiện tại
      this.jobCreationState.setJobId(this.jobId);
      const jobDataForState = {
        title: job.title,
        description: job.description,
        location: job.location,
        salaryFrom: job.salaryFrom,
        salaryTo: job.salaryTo,
        workTime: job.workTime,
        yoe: job.yoe,
        unit: job.unit,
        roundCount: job.roundCount || 1,
        status: job.status,
        deadline: job.deadline,
      };
      this.jobCreationState.setJobData(jobDataForState);
      this.jobCreationState.setRoundCount(job.roundCount || 1);

      // Convert JobRoundDTO[] sang RoundConfiguration[]
      const roundsConfig: RoundConfiguration[] = (job.rounds || []).map((round) => ({
        roundIndex: round.roundIndex,
        roundName: round.roundName,
        isConfirmed: round.isConfirmed || false,
      }));
      this.jobCreationState.setRounds(roundsConfig);

      // Lưu roundIds
      const roundIds: { [roundIndex: number]: number } = {};
      job.rounds.forEach((round) => {
        if (round.roundId) {
          roundIds[round.roundIndex] = round.roundId;
        }
      });
      this.jobCreationState.setRoundIds(roundIds);

      await loading.dismiss();

      // Navigate đến trang configure-rounds
      this.router.navigate(['/configure-rounds'], {
        queryParams: {
          jobId: this.jobId,
          fromEdit: 'true'
        },
      });
    } catch (error) {
      await loading.dismiss();
      console.error('Error loading rounds config:', error);
      const toast = await this.toastController.create({
        message: 'Không thể tải cấu hình vòng tuyển dụng',
        duration: 2000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    }
  }

  /**
   * Lưu mapping formId -> roundIndex từ rounds cũ trước khi update
   * Để có thể map lại roundId mới sau khi rounds được tạo lại
   */
  private async saveFormToRoundIndexMapping(currentRounds: JobRoundDTO[]) {
    this.formIdToRoundIndexMap = {};
    
    // Với mỗi round, lấy tất cả forms có roundId tương ứng
    // Lưu mapping: formId -> roundIndex
    const roundPromises = currentRounds.map(async (round) => {
      if (!round.roundId) return;
      
      try {
        // Lấy templates (forms) theo roundId
        const response = await firstValueFrom(
          this.templateService.getTemplates(undefined, round.roundId!)
        );
        
        // Lưu mapping formId -> roundIndex
        response.templates.forEach((template) => {
          if (template.formId) {
            this.formIdToRoundIndexMap[template.formId] = round.roundIndex;
          }
        });
      } catch (error) {
        console.error(`[EditPost] Error loading forms for round ${round.roundId}:`, error);
      }
    });
    
    await Promise.all(roundPromises);
    console.log('[EditPost] Saved formId -> roundIndex mapping:', this.formIdToRoundIndexMap);
  }

  /**
   * Cập nhật roundId cho các forms sau khi rounds được tạo lại
   * Map lại roundId mới dựa trên roundIndex đã lưu
   */
  private async updateFormsRoundId(
    roundIndexToNewRoundIdMap: { [roundIndex: number]: number }
  ) {
    if (Object.keys(this.formIdToRoundIndexMap).length === 0) {
      console.log('[EditPost] No forms to update');
      return;
    }

    // Tạo danh sách các update requests
    const updatePromises: Promise<any>[] = [];
    
    Object.keys(this.formIdToRoundIndexMap).forEach((formIdStr) => {
      const formId = parseInt(formIdStr);
      const roundIndex = this.formIdToRoundIndexMap[formId];
      const newRoundId = roundIndexToNewRoundIdMap[roundIndex];
      
      // Chỉ update nếu có roundId mới tương ứng với roundIndex
      if (newRoundId) {
        updatePromises.push(
          firstValueFrom(
            this.templateService.updateForm(formId, { roundId: newRoundId }).pipe(
              map(() => ({ formId, roundIndex, newRoundId })),
              catchError((error) => {
                console.error(`[EditPost] Error updating form ${formId}:`, error);
                return of(null);
              })
            )
          )
        );
      }
    });

    // Thực hiện tất cả updates
    try {
      const results = await Promise.all(updatePromises);
      const successCount = results.filter((r) => r !== null).length;
      console.log(`[EditPost] Updated ${successCount}/${updatePromises.length} forms with new roundId`);
    } catch (error) {
      console.error('[EditPost] Error updating forms roundId:', error);
    }
  }
}


