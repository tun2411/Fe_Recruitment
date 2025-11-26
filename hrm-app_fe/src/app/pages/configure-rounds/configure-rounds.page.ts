import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
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
  ToastController,
  LoadingController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import {
  JobCreationStateService,
  RoundConfiguration,
} from '../../services/job-creation-state.service';
import {
  JobPostService,
  JobRoundDTO,
  CompleteJobRequest,
  TemplateDTO,
} from '../../services/job-post.service';
import { TemplateService } from '../../services/template.service';

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
    private route: ActivatedRoute,
    private jobCreationState: JobCreationStateService,
    private jobPostService: JobPostService,
    private templateService: TemplateService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
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

  jobId: number | null = null;

  // Lifecycle hook của Ionic - được gọi mỗi khi vào trang này
  ionViewWillEnter() {
    console.log('[ConfigureRounds] ionViewWillEnter - reloading data...', {
      jobId: this.jobId,
      roundsFromState: this.jobCreationState.getRounds(),
      roundCount: this.jobCreationState.getRoundCount(),
    });

    // Option 2: Reload từ state, có thể cần jobId
    const roundsFromState = this.jobCreationState.getRounds();
    const roundCount = this.jobCreationState.getRoundCount();

    if (this.jobId && roundCount && roundCount > 0) {
      // Nếu đã có data trong state, chỉ re-initialize form (giữ template names và toggle values)
      if (roundsFromState && roundsFromState.length > 0) {
        this.roundCount = roundCount;
        this.initializeRounds(); // Re-initialize với data từ state
        console.log('[ConfigureRounds] Re-initialized form from state');
      } else {
        // Nếu chưa có data trong state, load từ job detail
        this.loadJobDetail();
      }
    } else if (this.jobId) {
      // Nếu không có roundCount, load từ job detail
      this.loadJobDetail();
    }
  }

  ngOnInit() {
    // Option 2: Cần jobId từ state hoặc queryParams
    // Lấy jobId từ queryParams hoặc state
    this.route.queryParams.subscribe((params) => {
      console.log('[ConfigureRounds] QueryParams changed', params);

      const jobIdParam = params['jobId'];
      if (jobIdParam) {
        this.jobId = parseInt(jobIdParam);
        this.jobCreationState.setJobId(this.jobId);
      } else {
        // Nếu không có trong queryParams, lấy từ state
        this.jobId = this.jobCreationState.getJobId();
      }

      // Lấy data từ state
      const jobData = this.jobCreationState.getJobData();
      const roundCount = this.jobCreationState.getRoundCount();

      if (!this.jobId) {
        console.error('[ConfigureRounds] No jobId found');
        // Nếu không có jobId, quay về create-post
        this.router.navigate(['/create-post']);
        return;
      }

      if (!jobData || !roundCount || roundCount < 1) {
        console.error(
          '[ConfigureRounds] No job data or roundCount found in state'
        );
        // Nếu không có data trong state, load từ job detail
        this.loadJobDetail();
        return;
      }

      this.roundCount = roundCount;
      this.initializeRounds();

      // Nếu có refresh flag, chỉ reload form với data từ state (không gọi loadJobDetail để tránh mất template data)
      if (params['refresh']) {
        console.log(
          '[ConfigureRounds] Refresh flag detected, reloading form from state...'
        );

        // Lấy roundCount từ state
        const roundCount = this.jobCreationState.getRoundCount();
        if (roundCount && roundCount > 0) {
          this.roundCount = roundCount;
          this.initializeRounds(); // Re-initialize form với data từ state (giữ template names)

          // Nếu có flag templateSelected, force update form ngay lập tức
          if (params['templateSelected'] === 'true') {
            // Force update form với data từ state
            setTimeout(() => {
              const roundsFromState = this.jobCreationState.getRounds();
              const roundsArray = this.roundsForm.get('rounds') as FormArray;
              if (roundsFromState && roundsArray) {
                roundsFromState.forEach((round, index) => {
                  if (roundsArray.at(index)) {
                    const updates: any = {};
                    // Giữ lại roundName và isConfirmed
                    updates.roundName =
                      round.roundName ||
                      roundsArray.at(index).get('roundName')?.value ||
                      `Vòng ${index + 1}`;
                    updates.isConfirmed =
                      round.isConfirmed !== undefined
                        ? round.isConfirmed
                        : roundsArray.at(index).get('isConfirmed')?.value ||
                          false;

                    // Update template names
                    if (round.passEmailTemplate?.formName) {
                      updates.passEmailTemplate =
                        round.passEmailTemplate.formName;
                    }
                    if (round.failEmailTemplate?.formName) {
                      updates.failEmailTemplate =
                        round.failEmailTemplate.formName;
                    }

                    roundsArray
                      .at(index)
                      .patchValue(updates, { emitEvent: false });
                    console.log(
                      `[ConfigureRounds] Force updated round ${index} after template selection`,
                      updates
                    );
                  }
                });

                // Force change detection
                this.roundsForm.markAsDirty();
                this.roundsForm.updateValueAndValidity({ emitEvent: false });
              }
            }, 150);
          }
        }

        // Hiển thị success message nếu template vừa được chọn
        if (params['templateSelected'] === 'true') {
          setTimeout(async () => {
            const toast = await this.toastController.create({
              message: 'Đã chọn template thành công!',
              duration: 2000,
              color: 'success',
              position: 'top',
            });
            await toast.present();
          }, 300);
        }
      }
    });
  }

  private loadJobDetail() {
    if (!this.jobId) {
      console.error('[ConfigureRounds] loadJobDetail: No jobId');
      return;
    }

    console.log('[ConfigureRounds] Loading job detail', { jobId: this.jobId });

    this.jobPostService.getJobPostById(this.jobId).subscribe({
      next: (job) => {
        console.log('[ConfigureRounds] Job detail loaded', job);

        this.roundCount = job.roundCount || 1;
        this.jobCreationState.setRoundCount(this.roundCount);

        // Lưu roundIds vào state
        const roundIds: { [roundIndex: number]: number } = {};
        job.rounds.forEach((round: any) => {
          if (round.roundId) {
            roundIds[round.roundIndex] = round.roundId;
          }
        });
        this.jobCreationState.setRoundIds(roundIds);
        console.log('[ConfigureRounds] RoundIds saved', roundIds);

        // Lưu rounds vào state (giữ nguyên template data và templateId nếu có)
        const existingRounds = this.jobCreationState.getRounds();
        const roundsConfig: RoundConfiguration[] = job.rounds.map(
          (round: any) => {
            // Tìm round tương ứng trong existingRounds để giữ template data
            const existingRound = existingRounds.find(
              (r) => r.roundIndex === round.roundIndex
            );
            const newRound: RoundConfiguration = {
              roundIndex: round.roundIndex,
              roundName: round.roundName,
              isConfirmed: round.isConfirmed === true,
              passEmailTemplate: existingRound?.passEmailTemplate,
              failEmailTemplate: existingRound?.failEmailTemplate,
            };
            // Giữ lại templateId nếu có
            if (existingRound) {
              (newRound as any).passTemplateId = (
                existingRound as any
              ).passTemplateId;
              (newRound as any).failTemplateId = (
                existingRound as any
              ).failTemplateId;
            }
            return newRound;
          }
        );
        this.jobCreationState.setRounds(roundsConfig);
        console.log(
          '[ConfigureRounds] Rounds config saved with templates',
          roundsConfig
        );

        this.initializeRounds();
        // Delay một chút để đảm bảo form đã được khởi tạo
        setTimeout(() => {
          this.loadSelectedTemplateNames();
        }, 100);
      },
      error: (error) => {
        console.error('[ConfigureRounds] Error loading job detail', error);
        this.router.navigate(['/create-post']);
      },
    });
  }

  get roundsArray(): FormArray {
    return this.roundsForm.get('rounds') as FormArray;
  }

  private initializeRounds() {
    const roundsArray = this.roundsForm.get('rounds') as FormArray;

    // Lấy rounds từ state
    const roundsFromState = this.jobCreationState.getRounds();
    const roundIds = this.jobCreationState.getRoundIds();

    // Kiểm tra xem form đã có data chưa
    const currentLength = roundsArray.length;

    // Nếu form đã có data và số lượng khớp, chỉ update values (giữ lại form controls)
    if (
      currentLength === this.roundCount &&
      roundsFromState &&
      roundsFromState.length === this.roundCount
    ) {
      console.log(
        '[ConfigureRounds] Form already initialized, updating values only'
      );
      for (let i = 0; i < this.roundCount; i++) {
        const roundFromState = roundsFromState.find((r) => r.roundIndex === i);
        if (roundFromState && roundsArray.at(i)) {
          // Update values mà không clear form (giữ lại form controls)
          roundsArray.at(i).patchValue(
            {
              roundName: roundFromState.roundName || `Vòng ${i + 1}`,
              passEmailTemplate:
                roundFromState.passEmailTemplate?.formName || '',
              failEmailTemplate:
                roundFromState.failEmailTemplate?.formName || '',
              isConfirmed: roundFromState.isConfirmed || false,
            },
            { emitEvent: false }
          ); // Không emit event để tránh trigger validation
        }
      }
    } else {
      // Nếu form chưa có data hoặc số lượng không khớp, clear và tạo lại
      console.log(
        '[ConfigureRounds] Form not initialized or count mismatch, creating new form'
      );
      roundsArray.clear();

      for (let i = 0; i < this.roundCount; i++) {
        // Lấy round name từ state nếu có
        const roundFromState = roundsFromState.find((r) => r.roundIndex === i);
        const roundName = roundFromState?.roundName || `Vòng ${i + 1}`;

        const roundGroup = this.formBuilder.group({
          roundName: [roundName, [Validators.required]],
          passEmailTemplate: [
            roundFromState?.passEmailTemplate?.formName || '',
          ],
          failEmailTemplate: [
            roundFromState?.failEmailTemplate?.formName || '',
          ],
          isConfirmed: [roundFromState?.isConfirmed || false],
        });
        roundsArray.push(roundGroup);
      }
    }

    // Load selected template names nếu có roundIds (chỉ khi cần load từ API)
    if (Object.keys(roundIds).length > 0) {
      // Chỉ load từ API nếu chưa có template names trong state
      const hasTemplatesInState = roundsFromState?.some(
        (r) => r.passEmailTemplate?.formName || r.failEmailTemplate?.formName
      );
      if (!hasTemplatesInState) {
        this.loadSelectedTemplateNames();
      }
    } else {
      // Nếu không có roundIds, đảm bảo template names từ state được hiển thị
      if (roundsFromState && roundsArray) {
        roundsFromState.forEach((round, index) => {
          if (roundsArray.at(index)) {
            const updates: any = {};
            if (round.passEmailTemplate?.formName) {
              updates.passEmailTemplate = round.passEmailTemplate.formName;
            }
            if (round.failEmailTemplate?.formName) {
              updates.failEmailTemplate = round.failEmailTemplate.formName;
            }
            if (Object.keys(updates).length > 0) {
              roundsArray.at(index).patchValue(updates, { emitEvent: false });
              console.log(
                `[ConfigureRounds] Updated round ${index} with templates from state`,
                updates
              );
            }
          }
        });
      }
    }
  }

  private async loadSelectedTemplateNames() {
    console.log('[ConfigureRounds] loadSelectedTemplateNames called');

    // Load templates đã attach cho từng round để hiển thị tên
    const roundIds = this.jobCreationState.getRoundIds();
    const roundsArray = this.roundsForm.get('rounds') as FormArray;
    const roundsFromState = this.jobCreationState.getRounds();

    console.log('[ConfigureRounds] RoundIds:', roundIds);
    console.log('[ConfigureRounds] Rounds from state:', roundsFromState);

    if (Object.keys(roundIds).length === 0) {
      console.log('[ConfigureRounds] No roundIds, using state data');
      // Nếu chưa có roundIds, sử dụng data từ state
      if (roundsFromState && roundsArray) {
        roundsFromState.forEach((round, index) => {
          if (roundsArray.at(index)) {
            const updates: any = {};
            if (round.passEmailTemplate?.formName) {
              updates.passEmailTemplate = round.passEmailTemplate.formName;
            }
            if (round.failEmailTemplate?.formName) {
              updates.failEmailTemplate = round.failEmailTemplate.formName;
            }
            if (Object.keys(updates).length > 0) {
              roundsArray.at(index).patchValue(updates);
              console.log(
                `[ConfigureRounds] Updated round ${index} with templates`,
                updates
              );
            }
          }
        });
      }
      return;
    }

    for (let i = 0; i < this.roundCount; i++) {
      const roundId = roundIds[i];
      if (!roundId || !roundsArray.at(i)) continue;

      // Ưu tiên sử dụng data từ state nếu có
      const roundFromState = roundsFromState.find((r) => r.roundIndex === i);
      if (roundFromState) {
        const updates: any = {};
        if (roundFromState.passEmailTemplate?.formName) {
          updates.passEmailTemplate = roundFromState.passEmailTemplate.formName;
        }
        if (roundFromState.failEmailTemplate?.formName) {
          updates.failEmailTemplate = roundFromState.failEmailTemplate.formName;
        }
        if (Object.keys(updates).length > 0) {
          roundsArray.at(i).patchValue(updates);
          console.log(
            `[ConfigureRounds] Updated round ${i} from state`,
            updates
          );
          continue; // Skip API call nếu đã có data từ state
        }
      }

      // Load templates cho round này (async, không block UI)
      Promise.all([
        this.templateService
          .getTemplates('pass', roundId)
          .toPromise()
          .catch(() => ({ templates: [] } as any)),
        this.templateService
          .getTemplates('fail', roundId)
          .toPromise()
          .catch(() => ({ templates: [] } as any)),
      ])
        .then(([passResult, failResult]) => {
          const passTemplate = passResult?.templates?.[0];
          const failTemplate = failResult?.templates?.[0];

          if (roundsArray.at(i)) {
            const updates: any = {};
            if (passTemplate) {
              updates.passEmailTemplate =
                passTemplate.formName ||
                passTemplate.subject?.substring(0, 30) ||
                'Template pass';
            }
            if (failTemplate) {
              updates.failEmailTemplate =
                failTemplate.formName ||
                failTemplate.subject?.substring(0, 30) ||
                'Template fail';
            }

            if (Object.keys(updates).length > 0) {
              roundsArray.at(i).patchValue(updates);
              console.log(
                `[ConfigureRounds] Updated round ${i} from API`,
                updates
              );
            }
          }
        })
        .catch((error) => {
          console.error(
            `[ConfigureRounds] Error loading templates for round ${i}:`,
            error
          );
        });
    }
  }

  async onBack() {
    // Nếu có jobId, xóa draft job trước khi back
    if (this.jobId) {
      // Hiển thị confirm dialog
      const alert = await this.alertController.create({
        header: 'Xác nhận',
        message: 'Bạn có muốn hủy tạo job này không? Job draft sẽ bị xóa.',
        buttons: [
          {
            text: 'Hủy',
            role: 'cancel',
            handler: () => {
              // Không làm gì, giữ nguyên trang
            },
          },
          {
            text: 'Xác nhận',
            handler: () => {
              // Xóa draft job
              this.deleteDraftAndNavigate();
            },
          },
        ],
      });
      await alert.present();
    } else {
      this.router.navigate(['/create-post']);
    }
  }

  private deleteDraftAndNavigate() {
    if (!this.jobId) {
      this.router.navigate(['/home']);
      return;
    }

    // Xóa draft job
    this.jobPostService.deleteJob(this.jobId).subscribe({
      next: () => {
        console.log('[ConfigureRounds] Draft job deleted on back');
        // Clear state
        this.jobCreationState.clear();
        // Navigate về home
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error(
          '[ConfigureRounds] Error deleting draft job on back:',
          error
        );
        // Vẫn clear state và navigate dù xóa thất bại
        this.jobCreationState.clear();
        this.router.navigate(['/home']);
      },
    });
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

    if (!this.jobId) {
      const toast = await this.toastController.create({
        message: 'Không tìm thấy job ID. Vui lòng thử lại.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Option 2: Lưu rounds vào state và show review
    // Lấy dữ liệu từ form và cập nhật vào state
    const roundsData = this.roundsForm.value.rounds;
    const roundsConfig: RoundConfiguration[] = roundsData.map(
      (round: any, index: number) => {
        // Lấy template data từ state nếu có
        const existingRound = this.jobCreationState
          .getRounds()
          .find((r) => r.roundIndex === index);
        return {
          roundIndex: index,
          roundName: round.roundName,
          isConfirmed: round.isConfirmed || false,
          passEmailTemplate: existingRound?.passEmailTemplate,
          failEmailTemplate: existingRound?.failEmailTemplate,
          passTemplateId: existingRound?.passTemplateId,
          failTemplateId: existingRound?.failTemplateId,
        };
      }
    );

    // Cập nhật rounds vào state
    this.jobCreationState.setRounds(roundsConfig);

    // Option 2: Show review và publish (job draft đã được tạo ở bước 1)
    this.showReviewAndPublish();
  }

  private async createRounds(rounds: JobRoundDTO[]) {
    if (!this.jobId) return;

    const loading = await this.loadingController.create({
      message: 'Đang tạo rounds...',
      spinner: 'crescent',
    });
    await loading.present();

    this.jobPostService.createRounds(this.jobId, rounds).subscribe({
      next: async (response: any) => {
        await loading.dismiss();

        // Lấy job detail để lấy roundIds (Bước 2.2)
        this.jobPostService.getJobPostById(this.jobId!).subscribe({
          next: (job) => {
            // Lưu roundIds vào state
            const roundIds: { [roundIndex: number]: number } = {};
            job.rounds.forEach((round: any) => {
              if (round.roundId) {
                roundIds[round.roundIndex] = round.roundId;
              }
            });
            this.jobCreationState.setRoundIds(roundIds);

            // Lưu rounds vào state
            const roundsConfig: RoundConfiguration[] = rounds.map(
              (round, index) => ({
                roundIndex: round.roundIndex,
                roundName: round.roundName,
                isConfirmed: round.isConfirmed || false, // Đảm bảo luôn là boolean
              })
            );
            this.jobCreationState.setRounds(roundsConfig);

            // Reload form với dữ liệu từ job detail
            this.roundCount = job.roundCount;
            this.initializeRounds();

            // Cập nhật form với round names từ job
            const roundsArray = this.roundsForm.get('rounds') as FormArray;
            job.rounds.forEach((round: any, index: number) => {
              if (roundsArray.at(index)) {
                roundsArray.at(index).patchValue({
                  roundName: round.roundName,
                  isConfirmed: round.isConfirmed || false,
                });
              }
            });

            // Load selected template names nếu có
            this.loadSelectedTemplateNames();

            // Sau khi tạo rounds thành công, tự động show review và publish
            console.log(
              '[ConfigureRounds] Rounds created, showing review and publish...'
            );
            setTimeout(() => {
              this.showReviewAndPublish();
            }, 500); // Delay một chút để đảm bảo UI đã cập nhật
          },
          error: async (error: any) => {
            console.error('Error loading job detail:', error);
            const toast = await this.toastController.create({
              message: 'Không thể lấy thông tin rounds. Vui lòng thử lại.',
              duration: 3000,
              color: 'warning',
              position: 'top',
            });
            await toast.present();
          },
        });
      },
      error: async (error: any) => {
        await loading.dismiss();

        const toast = await this.toastController.create({
          message: error.message || 'Tạo rounds thất bại. Vui lòng thử lại.',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }

  async showReviewAndPublish() {
    console.log('[ConfigureRounds] showReviewAndPublish called');

    // Option 1: Lấy data từ state, không cần gọi API
    const jobData = this.jobCreationState.getJobData();
    const rounds = this.jobCreationState.getRounds();

    if (!jobData || !rounds || rounds.length === 0) {
      const toast = await this.toastController.create({
        message: 'Thiếu thông tin job hoặc rounds. Vui lòng thử lại.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Tạo review message với thông tin từ state
    let message = `<strong>Job:</strong> ${jobData.title}<br><br>`;
    message += `<strong>Số vòng:</strong> ${jobData.roundCount}<br><br>`;
    message += `<strong>Rounds:</strong><br>`;
    rounds.forEach((round, index) => {
      message += `${index + 1}. ${round.roundName}`;
      if (round.isConfirmed) {
        message += ` (Yêu cầu xác nhận)`;
      }
      // Hiển thị template status
      if (
        round.passEmailTemplate?.formName ||
        round.failEmailTemplate?.formName
      ) {
        message += ` - `;
        const templates: string[] = [];
        if (round.passEmailTemplate?.formName) {
          templates.push(`Pass: ${round.passEmailTemplate.formName}`);
        }
        if (round.failEmailTemplate?.formName) {
          templates.push(`Fail: ${round.failEmailTemplate.formName}`);
        }
        message += templates.join(', ');
      }
      message += `<br>`;
    });

    // Kiểm tra templates đã được config chưa
    const hasTemplates = rounds.some(
      (r) => r.passEmailTemplate?.formName || r.failEmailTemplate?.formName
    );

    if (hasTemplates) {
      message += `<br><strong>Lưu ý:</strong> Templates đã được cấu hình cho các rounds.`;
    } else {
      message += `<br><strong>Lưu ý:</strong> Bạn có thể cấu hình templates sau khi publish.`;
    }

    message += `<br><br>Bạn có muốn tạo job này không?`;

    try {
      const alert = await this.alertController.create({
        header: 'Review Job',
        message: message,
        buttons: [
          {
            text: 'Hủy',
            role: 'cancel',
            handler: () => {
              console.log('[ConfigureRounds] User cancelled publish');
            },
          },
          {
            text: 'Tạo Job',
            handler: () => {
              console.log('[ConfigureRounds] User confirmed create job');
              this.publishJob();
            },
          },
        ],
      });
      await alert.present();
    } catch (error) {
      console.error('[ConfigureRounds] Error showing alert', error);
      // Fallback
      if (confirm(message)) {
        this.publishJob();
      }
    }
  }

  private async publishJob() {
    console.log(
      '[ConfigureRounds] Creating complete job with all data from state'
    );

    const loading = await this.loadingController.create({
      message: 'Đang tạo job hoàn chỉnh...',
      spinner: 'crescent',
    });
    await loading.present();

    // Lấy job data từ state
    const jobData = this.jobCreationState.getJobData();
    const rounds = this.jobCreationState.getRounds();

    if (!jobData || !rounds || rounds.length === 0) {
      await loading.dismiss();
      const toast = await this.toastController.create({
        message: 'Thiếu thông tin job hoặc rounds. Vui lòng thử lại.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Build CompleteJobRequest từ state
    const completeRequest: CompleteJobRequest = {
      title: jobData.title!,
      description: jobData.description!,
      location: jobData.location,
      salaryFrom: jobData.salaryFrom,
      salaryTo: jobData.salaryTo,
      workTime: jobData.workTime,
      yoe: jobData.yoe,
      unit: jobData.unit,
      roundCount: jobData.roundCount!,
      deadline: jobData.deadline!,
      rounds: rounds.map((round: RoundConfiguration) => {
        const roundWithTemplates: CompleteJobRequest['rounds'][0] = {
          roundIndex: round.roundIndex,
          roundName: round.roundName,
          isConfirmed: round.isConfirmed || false,
        };

        // Thêm pass template nếu có
        if (round.passEmailTemplate) {
          const passTemplateId = round.passTemplateId;
          if (passTemplateId) {
            // Attach template existing
            roundWithTemplates.passTemplate = {
              templateId: passTemplateId,
              createNew: false,
            };
          } else {
            // Tạo template mới
            roundWithTemplates.passTemplate = {
              formName:
                round.passEmailTemplate.formName ||
                `Email Pass ${round.roundName}`,
              type: 'pass',
              subject: round.passEmailTemplate.subject || '',
              content: round.passEmailTemplate.content || '',
              createNew: true,
            };
          }
        }

        // Thêm fail template nếu có
        if (round.failEmailTemplate) {
          const failTemplateId = round.failTemplateId;
          if (failTemplateId) {
            // Attach template existing
            roundWithTemplates.failTemplate = {
              templateId: failTemplateId,
              createNew: false,
            };
          } else {
            // Tạo template mới
            roundWithTemplates.failTemplate = {
              formName:
                round.failEmailTemplate.formName ||
                `Email Fail ${round.roundName}`,
              type: 'fail',
              subject: round.failEmailTemplate.subject || '',
              content: round.failEmailTemplate.content || '',
              createNew: true,
            };
          }
        }

        return roundWithTemplates;
      }),
    };

    console.log('[ConfigureRounds] CompleteJobRequest:', completeRequest);

    // Option 2: Xóa job draft cũ và tạo job hoàn chỉnh mới
    // (Vì createCompleteJob tạo job mới, không update job cũ)
    this.jobPostService.deleteJob(this.jobId!).subscribe({
      next: () => {
        console.log(
          '[ConfigureRounds] Draft job deleted, creating complete job...'
        );

        // Tạo job hoàn chỉnh mới
        this.jobPostService.createCompleteJob(completeRequest).subscribe({
          next: async (response: any) => {
            console.log(
              '[ConfigureRounds] Complete job created successfully',
              response
            );

            await loading.dismiss();

            // Clear state
            this.jobCreationState.clear();

            const toast = await this.toastController.create({
              message: 'Tạo job thành công!',
              duration: 3000,
              color: 'success',
              position: 'top',
            });
            await toast.present();

            // Navigate về home
            this.router.navigate(['/home']);
          },
          error: async (error: any) => {
            console.error(
              '[ConfigureRounds] Error creating complete job',
              error
            );
            await loading.dismiss();

            const toast = await this.toastController.create({
              message: error.message || 'Tạo job thất bại. Vui lòng thử lại.',
              duration: 3000,
              color: 'danger',
              position: 'top',
            });
            await toast.present();
          },
        });
      },
      error: async (error: any) => {
        console.error('[ConfigureRounds] Error deleting draft job', error);
        // Vẫn tiếp tục tạo job mới dù xóa draft thất bại
        this.jobPostService.createCompleteJob(completeRequest).subscribe({
          next: async (response: any) => {
            console.log(
              '[ConfigureRounds] Complete job created (draft not deleted)',
              response
            );
            await loading.dismiss();
            this.jobCreationState.clear();
            const toast = await this.toastController.create({
              message: 'Tạo job thành công!',
              duration: 3000,
              color: 'success',
              position: 'top',
            });
            await toast.present();
            this.router.navigate(['/home']);
          },
          error: async (error: any) => {
            console.error(
              '[ConfigureRounds] Error creating complete job',
              error
            );
            await loading.dismiss();
            const toast = await this.toastController.create({
              message: error.message || 'Tạo job thất bại. Vui lòng thử lại.',
              duration: 3000,
              color: 'danger',
              position: 'top',
            });
            await toast.present();
          },
        });
      },
    });
  }

  private markFormGroupTouched() {
    const roundsArray = this.roundsForm.get('rounds') as FormArray;
    roundsArray.controls.forEach((control: any) => {
      control.markAllAsTouched();
    });
  }

  onEmailTemplateClick(type: 'pass' | 'fail', roundIndex: number) {
    // Option 2: Cần jobId và roundId (nếu có)
    // Navigate đến email-templates với jobId, roundIndex, và type
    const roundId = this.jobCreationState.getRoundId(roundIndex);

    this.router.navigate(['/email-templates'], {
      queryParams: {
        jobId: this.jobId,
        roundIndex: roundIndex,
        roundId: roundId || undefined,
        type: type,
      },
    });
  }
}
