import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
  addOutline,
  trashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  shieldCheckmarkOutline,
  mailOutline,
  checkmarkCircle,
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
  UpdateJobRequest,
  UpdateFormRequest,
} from '../../services/job-post.service';
import { TemplateService } from '../../services/template.service';
import { firstValueFrom } from 'rxjs';

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
    private location: Location,
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
      addOutline,
      trashOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      shieldCheckmarkOutline,
      mailOutline,
      checkmarkCircle,
    });

    this.roundsForm = this.formBuilder.group({
      rounds: this.formBuilder.array([]),
    });
  }

  jobId: number | null = null;
  fromEdit: boolean = false; // Flag để biết có đến từ edit-post không
  jobStatus: string | null = null; // Lưu job status để kiểm tra

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

      // Kiểm tra có đến từ edit-post không
      this.fromEdit = params['fromEdit'] === 'true';

      // Lấy data từ state
      const jobData = this.jobCreationState.getJobData();
      const roundCount = this.jobCreationState.getRoundCount();

      // Nếu không có jobId và không có jobData, quay về create-post
      // (jobId có thể null khi tạo job mới, nhưng phải có jobData)
      if (!this.jobId && !jobData) {
        console.error('[ConfigureRounds] No jobId and no jobData found');
        this.router.navigate(['/create-post']);
        return;
      }

      // Lưu job status từ state để kiểm tra khi back
      if (jobData) {
        this.jobStatus = jobData.status || 'inactive';
      }

      // Nếu đến từ edit-post, luôn load lại từ backend để đảm bảo có dữ liệu mới nhất
      if (this.fromEdit) {
        console.log(
          '[ConfigureRounds] From edit-post, loading from backend...'
        );
        this.loadJobDetail();
        return;
      }

      // Nếu có jobId, luôn load job detail để đảm bảo có đầy đủ thông tin (roundIds, jobStatus)
      // Điều này đảm bảo logic kiểm tra trong onSubmit() hoạt động chính xác
      if (this.jobId) {
        // Kiểm tra xem đã có roundIds chưa
        const existingRoundIds = this.jobCreationState.getRoundIds();
        if (Object.keys(existingRoundIds).length === 0) {
          // Chưa có roundIds, load từ backend
          console.log(
            '[ConfigureRounds] No roundIds found, loading job detail...'
          );
          this.loadJobDetail();
          return;
        }
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

        // Lưu job status để kiểm tra khi back
        this.jobStatus = job.status;

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
        // QUAN TRỌNG: Merge cẩn thận để không mất template data của rounds khác
        const existingRounds = this.jobCreationState.getRounds();
        const roundsConfig: RoundConfiguration[] = job.rounds.map(
          (round: any) => {
            // Tìm round tương ứng trong existingRounds để giữ template data
            // CHỈ giữ template nếu roundIndex khớp chính xác
            const existingRound = existingRounds?.find(
              (r) => r.roundIndex === round.roundIndex
            );

            const newRound: RoundConfiguration = {
              roundIndex: round.roundIndex,
              roundName: round.roundName,
              isConfirmed: round.isConfirmed === true,
              // CHỈ giữ template nếu tìm thấy round tương ứng trong existingRounds
              // Rounds mới (không có trong existingRounds) sẽ không có template
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

        // Merge với existingRounds để giữ template của rounds không có trong job.rounds
        // (trường hợp hiếm, nhưng đảm bảo không mất data)
        if (existingRounds && existingRounds.length > 0) {
          existingRounds.forEach((existingRound) => {
            const found = roundsConfig.find(
              (r) => r.roundIndex === existingRound.roundIndex
            );
            if (!found) {
              // Round này không có trong job.rounds mới, nhưng vẫn giữ trong state
              // (có thể là round đã bị xóa, nhưng vẫn giữ template data để tránh mất)
              roundsConfig.push(existingRound);
            }
          });
        }

        this.jobCreationState.setRounds(roundsConfig);
        console.log(
          '[ConfigureRounds] Rounds config saved with templates',
          roundsConfig
        );

        // Initialize rounds trước
        this.initializeRounds(false); // Không load template names từ API cũ

        // Load forms từ API mới để cập nhật template names
        setTimeout(() => {
          this.loadFormsByJobId();
        }, 200);
      },
      error: (error) => {
        console.error('[ConfigureRounds] Error loading job detail', error);
        this.router.navigate(['/create-post']);
      },
    });
  }

  /**
   * Load forms từ API /api/forms/job/{jobId} và cập nhật template names cho rounds
   */
  private loadFormsByJobId() {
    if (!this.jobId) {
      console.error('[ConfigureRounds] loadFormsByJobId: No jobId');
      return;
    }

    console.log('[ConfigureRounds] Loading forms by jobId', {
      jobId: this.jobId,
    });

    this.jobPostService.getFormsByJobId(this.jobId).subscribe({
      next: (response) => {
        console.log('[ConfigureRounds] Forms loaded', response);

        const forms = response.forms || [];
        const roundsFromState = this.jobCreationState.getRounds();
        const roundIds = this.jobCreationState.getRoundIds();

        console.log('[ConfigureRounds] RoundIds from state:', roundIds);
        console.log('[ConfigureRounds] Rounds from state:', roundsFromState);

        // Group forms by roundId
        const formsByRoundId: { [roundId: number]: any[] } = {};
        forms.forEach((form: any) => {
          if (form.roundId) {
            if (!formsByRoundId[form.roundId]) {
              formsByRoundId[form.roundId] = [];
            }
            formsByRoundId[form.roundId].push(form);
          }
        });

        console.log(
          '[ConfigureRounds] Forms grouped by roundId:',
          formsByRoundId
        );

        // Map forms to rounds
        const updatedRounds: RoundConfiguration[] = roundsFromState.map(
          (round) => {
            const roundId = roundIds[round.roundIndex];
            console.log(
              `[ConfigureRounds] Mapping round ${round.roundIndex} (roundId: ${roundId})`
            );

            if (!roundId || !formsByRoundId[roundId]) {
              console.log(
                `[ConfigureRounds] No forms found for round ${round.roundIndex} (roundId: ${roundId})`
              );
              return round; // Giữ nguyên nếu không có forms
            }

            const roundForms = formsByRoundId[roundId];
            const passForm = roundForms.find((f: any) => f.type === 'pass');
            const failForm = roundForms.find((f: any) => f.type === 'fail');

            console.log(
              `[ConfigureRounds] Found forms for round ${round.roundIndex}:`,
              {
                pass: passForm?.formName,
                fail: failForm?.formName,
              }
            );

            const updatedRound: RoundConfiguration = {
              ...round,
              passEmailTemplate: passForm
                ? { formName: passForm.formName }
                : round.passEmailTemplate,
              failEmailTemplate: failForm
                ? { formName: failForm.formName }
                : round.failEmailTemplate,
            };

            // Lưu formId để có thể sử dụng sau
            if (passForm) {
              (updatedRound as any).passTemplateId = passForm.id;
            }
            if (failForm) {
              (updatedRound as any).failTemplateId = failForm.id;
            }

            return updatedRound;
          }
        );

        // Cập nhật state với template names
        this.jobCreationState.setRounds(updatedRounds);
        console.log(
          '[ConfigureRounds] Rounds updated with forms',
          updatedRounds
        );

        // Cập nhật form với template names mới
        const roundsArray = this.roundsForm.get('rounds') as FormArray;
        updatedRounds.forEach((round, index) => {
          if (roundsArray.at(index)) {
            const updates: any = {};
            // Luôn cập nhật, kể cả khi là empty string để clear giá trị cũ
            updates.passEmailTemplate = round.passEmailTemplate?.formName || '';
            updates.failEmailTemplate = round.failEmailTemplate?.formName || '';

            roundsArray.at(index).patchValue(updates, { emitEvent: false });
            console.log(
              `[ConfigureRounds] Updated round ${index} (roundIndex: ${round.roundIndex}) with template names:`,
              updates
            );
          } else {
            console.warn(
              `[ConfigureRounds] Round array at index ${index} does not exist`
            );
          }
        });

        // Force change detection
        this.roundsForm.markAsDirty();
        this.roundsForm.updateValueAndValidity({ emitEvent: false });
      },
      error: (error) => {
        console.error('[ConfigureRounds] Error loading forms by jobId', error);
        // Vẫn initialize rounds ngay cả khi load forms thất bại
        this.initializeRounds();
      },
    });
  }

  get roundsArray(): FormArray {
    return this.roundsForm.get('rounds') as FormArray;
  }

  private initializeRounds(skipLoadTemplates: boolean = false) {
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

    // Load selected template names nếu có roundIds và không skip
    if (!skipLoadTemplates && Object.keys(roundIds).length > 0) {
      // Nếu đến từ edit-post, KHÔNG gọi API /api/templates
      // Chỉ sử dụng dữ liệu từ state (đã được load từ GET /api/jobs/{jobId})
      if (this.fromEdit) {
        // Chỉ sử dụng data từ state, không gọi API
        console.log('[ConfigureRounds] From edit-post, using state data only, skipping API calls');
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
                  `[ConfigureRounds] Updated round ${index} with templates from state (from edit-post)`,
                  updates
                );
              }
            }
          });
        }
      } else {
        // Chỉ load từ API nếu chưa có template names trong state
        const hasTemplatesInState = roundsFromState?.some(
          (r) => r.passEmailTemplate?.formName || r.failEmailTemplate?.formName
        );
        if (!hasTemplatesInState) {
          this.loadSelectedTemplateNames();
        }
      }
    } else {
      // Nếu không có roundIds hoặc skip load templates, đảm bảo template names từ state được hiển thị
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

      // Nếu đến từ edit-post, KHÔNG gọi API /api/templates
      // Chỉ sử dụng dữ liệu từ state (đã được load từ GET /api/jobs/{jobId})
      if (this.fromEdit) {
        console.log(
          `[ConfigureRounds] From edit-post, skipping API call for round ${i}, using state data only`
        );
        continue; // Không gọi API khi đến từ edit-post
      }

      // Nếu không đến từ edit-post, chỉ load nếu round đã có template trong state
      const hasTemplateInState =
        roundFromState &&
        (roundFromState.passEmailTemplate ||
          roundFromState.failEmailTemplate ||
          (roundFromState as any).passTemplateId ||
          (roundFromState as any).failTemplateId);

      // Nếu không có template trong state, skip
      if (!hasTemplateInState) {
        console.log(
          `[ConfigureRounds] Round ${i} is new or has no template in state, skipping API load`
        );
        continue; // Không load template cho rounds mới
      }

      // Load templates cho round này từ API (chỉ khi không đến từ edit-post)
      Promise.all([
        firstValueFrom(
          this.templateService.getTemplates('pass', roundId)
        ).catch(() => ({ templates: [] } as any)),
        firstValueFrom(
          this.templateService.getTemplates('fail', roundId)
        ).catch(() => ({ templates: [] } as any)),
      ])
        .then(([passResult, failResult]) => {
          const passTemplate = passResult?.templates?.[0];
          const failTemplate = failResult?.templates?.[0];

          if (roundsArray.at(i)) {
            const updates: any = {};

            // Nếu đến từ edit-post, luôn update từ API
            // Nếu không, chỉ update nếu state chưa có
            if (this.fromEdit) {
              // Luôn update từ API khi đến từ edit-post
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
            } else {
              // Chỉ update nếu state chưa có
              const roundFromStateAfter = roundsFromState.find(
                (r) => r.roundIndex === i
              );
              if (
                passTemplate &&
                (!roundFromStateAfter || !roundFromStateAfter.passEmailTemplate)
              ) {
                updates.passEmailTemplate =
                  passTemplate.formName ||
                  passTemplate.subject?.substring(0, 30) ||
                  'Template pass';
              }
              if (
                failTemplate &&
                (!roundFromStateAfter || !roundFromStateAfter.failEmailTemplate)
              ) {
                updates.failEmailTemplate =
                  failTemplate.formName ||
                  failTemplate.subject?.substring(0, 30) ||
                  'Template fail';
              }
            }

            if (Object.keys(updates).length > 0) {
              roundsArray.at(i).patchValue(updates);
              console.log(
                `[ConfigureRounds] Updated round ${i} from API${
                  this.fromEdit ? ' (from edit-post)' : ''
                }`,
                updates
              );

              // Cập nhật state nếu đến từ edit-post
              if (this.fromEdit) {
                const roundsFromState = this.jobCreationState.getRounds();
                const roundToUpdate = roundsFromState.find(
                  (r) => r.roundIndex === i
                );
                if (roundToUpdate) {
                  if (updates.passEmailTemplate) {
                    roundToUpdate.passEmailTemplate = {
                      formName: updates.passEmailTemplate,
                    } as any;
                  }
                  if (updates.failEmailTemplate) {
                    roundToUpdate.failEmailTemplate = {
                      formName: updates.failEmailTemplate,
                    } as any;
                  }
                  this.jobCreationState.setRounds(roundsFromState);
                }
              }
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
    // Nếu đến từ edit-post, quay về edit-post (KHÔNG xóa job)
    if (this.fromEdit && this.jobId) {
      this.router.navigate(['/edit-post', this.jobId]);
      return;
    }

    // Kiểm tra job status - chỉ xóa nếu là draft (inactive)
    // Nếu job đã được publish (active/closed), không xóa
    if (this.jobStatus && this.jobStatus !== 'inactive') {
      // Job đã được publish, quay về trang trước đó
      this.location.back();
      return;
    }

    // Nếu đang tạo job mới (không có jobId), clear state và quay về trang trước
    if (!this.jobId) {
      // Clear state để xóa dữ liệu tạm
      this.jobCreationState.clear();
      // Quay về trang trước đó (thường là create-post)
      this.location.back();
      return;
    }

    // Trường hợp còn lại: có jobId nhưng không phải từ edit-post
    // Quay về trang trước đó
    this.location.back();
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

    // Kiểm tra xem job đã tồn tại chưa (có jobId và từ edit-post hoặc job đã publish)
    const roundIds = this.jobCreationState.getRoundIds();
    const hasExistingRounds = Object.keys(roundIds).length > 0;
    const isPublishedJob = this.jobStatus && this.jobStatus !== 'inactive';

    console.log('[ConfigureRounds] onSubmit check:', {
      fromEdit: this.fromEdit,
      jobId: this.jobId,
      jobStatus: this.jobStatus,
      hasExistingRounds: hasExistingRounds,
      roundIds: roundIds,
      isPublishedJob: isPublishedJob,
    });

    // Nếu đến từ edit-post, job đã được publish, hoặc job đã có rounds (roundIds), update job thay vì tạo mới
    if (
      this.fromEdit ||
      (this.jobId && (isPublishedJob || hasExistingRounds))
    ) {
      // Job đã tồn tại, update thay vì tạo mới
      console.log(
        '[ConfigureRounds] Job exists, updating instead of creating new'
      );
      await this.saveRoundsAndBackToEdit();
      return;
    }

    // Tạo job mới (không có draft job nữa, tạo job hoàn chỉnh luôn)
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

  /**
   * Lưu rounds và quay về edit-post
   */
  private async saveRoundsAndBackToEdit() {
    const loading = await this.loadingController.create({
      message: 'Đang lưu cấu hình...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      // Load job data hiện tại từ API để đảm bảo có đầy đủ thông tin
      const currentJob = await firstValueFrom(
        this.jobPostService.getJobPostById(this.jobId!)
      );

      const roundsArray = this.roundsArray;

      // Đồng bộ lại rounds trong state theo form hiện tại để đảm bảo roundIndex khớp UI
      const existingRoundsState = this.jobCreationState.getRounds();
      const syncedRoundsState: RoundConfiguration[] = roundsArray.controls.map(
        (control, index) => {
          const existingRound = existingRoundsState.find(
            (r) => r.roundIndex === index
          );

          return {
            roundIndex: index,
            roundName: control.get('roundName')?.value || `Vòng ${index + 1}`,
            isConfirmed: control.get('isConfirmed')?.value === true,
            passEmailTemplate: existingRound?.passEmailTemplate,
            failEmailTemplate: existingRound?.failEmailTemplate,
            passTemplateId: existingRound?.passTemplateId,
            failTemplateId: existingRound?.failTemplateId,
          };
        }
      );
      this.jobCreationState.setRounds(syncedRoundsState);

      const roundIds = this.jobCreationState.getRoundIds();
      const roundsFromState = this.jobCreationState.getRounds();

      console.log(
        '[ConfigureRounds] RoundIds from state before mapping:',
        roundIds
      );
      console.log('[ConfigureRounds] Rounds array length:', roundsArray.length);
      console.log('[ConfigureRounds] Current job data:', currentJob);
      console.log('[ConfigureRounds] Rounds from state:', roundsFromState);

      // Build JobRoundDTO với đầy đủ các trường: roundIndex, roundName, isConfirmed, forms
      // NOTE: Backend TRUE UPSERT rounds ưu tiên roundId, fallback roundIndex
      const rounds: JobRoundDTO[] = roundsArray.controls.map(
        (control, index) => {
          // Lấy roundId từ state (nếu có) - optional, backend sẽ tự động tìm round theo roundIndex
          const roundId = roundIds[index];
          const roundName = control.get('roundName')?.value || '';
          const isConfirmed = control.get('isConfirmed')?.value === true;

          // Lấy round configuration từ state để lấy template info
          const roundFromState = roundsFromState.find(
            (r) => r.roundIndex === index
          );

          // Build forms array cho round này (nếu có templates đã được cấu hình)
          const forms: UpdateFormRequest[] = [];

          // Thêm pass form nếu có template được cấu hình
          const passFormName = roundFromState?.passEmailTemplate?.formName;
          const passTemplateId = (roundFromState as any)?.passTemplateId;
          if (passTemplateId) {
            // formId là bắt buộc khi update, sử dụng passTemplateId làm formId
            forms.push({
              formId: passTemplateId,
              formName: passFormName, // Optional, nhưng nên gửi nếu có
              type: 'pass',
              roundId: roundId || null, // roundId để đảm bảo form được gắn đúng round
            });
          } else if (passFormName) {
            // Nếu không có formId nhưng có formName, có thể là tạo mới (nhưng backend yêu cầu formId khi update)
            console.warn(
              `[ConfigureRounds] Round ${index} has passFormName but no passTemplateId, skipping pass form (formId is required for update)`
            );
          }

          // Thêm fail form nếu có template được cấu hình
          const failFormName = roundFromState?.failEmailTemplate?.formName;
          const failTemplateId = (roundFromState as any)?.failTemplateId;
          if (failTemplateId) {
            // formId là bắt buộc khi update, sử dụng failTemplateId làm formId
            forms.push({
              formId: failTemplateId,
              formName: failFormName, // Optional, nhưng nên gửi nếu có
              type: 'fail',
              roundId: roundId || null, // roundId để đảm bảo form được gắn đúng round
            });
          } else if (failFormName) {
            // Nếu không có formId nhưng có formName, có thể là tạo mới (nhưng backend yêu cầu formId khi update)
            console.warn(
              `[ConfigureRounds] Round ${index} has failFormName but no failTemplateId, skipping fail form (formId is required for update)`
            );
          }

          // Đảm bảo JobRoundDTO có đầy đủ các trường
          // Backend UPSERT dựa trên roundIndex, roundId là optional (chỉ để reference)
          const roundDTO: JobRoundDTO = {
            roundIndex: index, // QUAN TRỌNG: Backend dùng roundIndex để UPSERT
            roundName: roundName,
            isConfirmed: isConfirmed,
          };

          // Thêm roundId nếu có (optional, backend sẽ tự động tìm round theo roundIndex nếu không có)
          if (roundId) {
            roundDTO.roundId = roundId;
          }

          // Thêm forms array nếu có
          if (forms.length > 0) {
            roundDTO.forms = forms;
          }

          console.log(`[ConfigureRounds] Round ${index}:`, {
            roundId: roundDTO.roundId,
            roundIndex: roundDTO.roundIndex,
            roundName: roundDTO.roundName,
            isConfirmed: roundDTO.isConfirmed,
            forms: roundDTO.forms,
          });

          return roundDTO;
        }
      );

      console.log(
        '[ConfigureRounds] Final rounds to save:',
        JSON.stringify(rounds, null, 2)
      );

      // Build UpdateJobRequest với đầy đủ thông tin từ job hiện tại
      const updateJobRequest: UpdateJobRequest = {
        // Gửi kèm job data hiện tại để đảm bảo không mất dữ liệu
        title: currentJob.title,
        description: currentJob.description,
        location: currentJob.location,
        salaryFrom: currentJob.salaryFrom,
        salaryTo: currentJob.salaryTo,
        workTime: currentJob.workTime,
        yoe: currentJob.yoe,
        unit: currentJob.unit,
        status: currentJob.status as any,
        deadline: currentJob.deadline,
        // Rounds với đầy đủ thông tin
        rounds: rounds,
      };

      console.log(
        '[ConfigureRounds] UpdateJobRequest:',
        JSON.stringify(updateJobRequest, null, 2)
      );

      await firstValueFrom(
        this.jobPostService.updateJobPost(this.jobId!, updateJobRequest)
      );

      await loading.dismiss();

      const toast = await this.toastController.create({
        message: 'Cập nhật cấu hình vòng tuyển dụng thành công!',
        duration: 2000,
        color: 'success',
        position: 'top',
      });
      await toast.present();

      // Quay về edit-post nếu đến từ edit-post, nếu không thì về home
      if (this.fromEdit) {
        this.router.navigate(['/edit-post', this.jobId]);
      } else {
        // Nếu không phải từ edit-post nhưng job đã tồn tại, về home
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      await loading.dismiss();

      // Log chi tiết lỗi để debug
      console.error('[ConfigureRounds] Error saving rounds:', {
        error,
        message: error?.message,
        status: (error as any)?.status,
        statusText: (error as any)?.statusText,
        url: (error as any)?.url,
        errorDetails: (error as any)?.error,
      });

      // Kiểm tra nếu là lỗi authentication (401/403)
      // Interceptor đã xử lý logout, không cần hiển thị toast lỗi nữa
      const errorStatus = (error as any)?.status;
      const isAuthError = errorStatus === 401 || errorStatus === 403;
      const isAuthErrorMessage =
        error?.message?.includes('quyền truy cập') ||
        error?.message?.includes('quyền thực hiện');

      if (isAuthError || isAuthErrorMessage) {
        console.log(
          '[ConfigureRounds] Authentication error detected, interceptor will handle logout'
        );
        // Không hiển thị toast vì interceptor đã xử lý logout và redirect
        return;
      }

      // Hiển thị thông báo lỗi cho các lỗi khác
      let errorMessage = 'Lưu cấu hình thất bại. Vui lòng thử lại.';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      } else if (error?.status === 404) {
        errorMessage = 'Không tìm thấy bài đăng tuyển dụng.';
      } else if (error?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      }

      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top',
        buttons: [
          {
            text: 'Đóng',
            role: 'cancel',
          },
        ],
      });
      await toast.present();
    }
  }

  /**
   * Thêm vòng mới
   */
  onAddRound() {
    const roundsArray = this.roundsArray;
    const newRoundIndex = roundsArray.length;

    const roundGroup = this.formBuilder.group({
      roundName: [`Vòng ${newRoundIndex + 1}`, [Validators.required]],
      passEmailTemplate: [''],
      failEmailTemplate: [''],
      isConfirmed: [false],
    });

    roundsArray.push(roundGroup);

    // Cập nhật roundCount
    this.roundCount = roundsArray.length;
    this.jobCreationState.setRoundCount(this.roundCount);

    // QUAN TRỌNG: Thêm vòng mới vào state để đảm bảo đồng bộ
    const roundsFromState = this.jobCreationState.getRounds();
    const newRound: RoundConfiguration = {
      roundIndex: newRoundIndex,
      roundName: `Vòng ${newRoundIndex + 1}`,
      isConfirmed: false,
    };
    this.jobCreationState.setRounds([...roundsFromState, newRound]);

    console.log('[ConfigureRounds] Added new round to state:', newRound);
  }

  /**
   * Xóa vòng
   */
  async onDeleteRound(index: number) {
    const roundsArray = this.roundsArray;

    if (roundsArray.length <= 1) {
      const toast = await this.toastController.create({
        message: 'Phải có ít nhất 1 vòng tuyển dụng',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Xác nhận xóa',
      message:
        'Bạn có chắc chắn muốn xóa vòng này? Tất cả cấu hình (templates, email) của vòng này sẽ bị xóa.',
      buttons: [
        {
          text: 'Hủy',
          role: 'cancel',
        },
        {
          text: 'Xóa',
          role: 'destructive',
          handler: () => {
            roundsArray.removeAt(index);

            // Cập nhật lại roundIndex và tên vòng cho các rounds còn lại trong form
            this.updateRoundIndexes();
            // Cập nhật roundCount
            this.roundCount = roundsArray.length;
            this.jobCreationState.setRoundCount(this.roundCount);

            // QUAN TRỌNG: Xóa vòng khỏi state và cập nhật lại roundIndex cho các vòng còn lại
            const roundsFromState = this.jobCreationState.getRounds();
            const updatedRounds = roundsFromState
              .filter((r) => r.roundIndex !== index) // Xóa vòng bị xóa
              .map((r, newIndex) => ({
                ...r,
                roundIndex: newIndex, // Cập nhật lại roundIndex
              }));
            this.jobCreationState.setRounds(updatedRounds);

            console.log(
              '[ConfigureRounds] Deleted round and updated state:',
              updatedRounds
            );

            // Đồng bộ lại roundIds trong state: xóa roundId của vòng bị xóa và dịch các index phía sau
            const oldRoundIds = this.jobCreationState.getRoundIds();
            const newRoundIds: { [roundIndex: number]: number } = {};
            this.roundsArray.controls.forEach((_, newIndex) => {
              const oldIndex = newIndex >= index ? newIndex + 1 : newIndex;
              const oldId = oldRoundIds[oldIndex];
              if (oldId) {
                newRoundIds[newIndex] = oldId;
              }
            });
            this.jobCreationState.setRoundIds(newRoundIds);

            // Đồng bộ lại rounds trong state theo form hiện tại để tránh lệch index
            const existingRoundsState = this.jobCreationState.getRounds();
            const syncedRoundsState: RoundConfiguration[] =
              this.roundsArray.controls.map((control, idx) => {
                const existingRound = existingRoundsState.find(
                  (r) => r.roundIndex === idx
                );

                return {
                  roundIndex: idx,
                  roundName:
                    control.get('roundName')?.value || `Vòng ${idx + 1}`,
                  isConfirmed: control.get('isConfirmed')?.value === true,
                  passEmailTemplate: existingRound?.passEmailTemplate,
                  failEmailTemplate: existingRound?.failEmailTemplate,
                  passTemplateId: existingRound?.passTemplateId,
                  failTemplateId: existingRound?.failTemplateId,
                };
              });
            this.jobCreationState.setRounds(syncedRoundsState);
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Cập nhật lại roundIndex sau khi xóa
   */
  private updateRoundIndexes() {
    const roundsArray = this.roundsArray;
    roundsArray.controls.forEach((control, index) => {
      const roundName = control.get('roundName')?.value || `Vòng ${index + 1}`;
      // Cập nhật tên nếu là tên mặc định
      if (roundName.startsWith('Vòng ')) {
        control.patchValue(
          { roundName: `Vòng ${index + 1}` },
          { emitEvent: false }
        );
      }
    });
  }

  // NOTE: Method createRounds đã được xóa vì backend không còn endpoint /api/jobs/{job_id}/rounds
  // Sử dụng updateJobPost với rounds trong request body thay vì createRounds
  // Backend sẽ UPSERT rounds dựa trên roundIndex, không cần endpoint riêng

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

    // Tạo review message với thông tin từ state (sử dụng text thuần, không dùng HTML)
    let message = `Job: ${jobData.title}\n\n`;
    message += `Số vòng: ${jobData.roundCount}\n\n`;
    message += `Rounds:\n`;
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
      message += `\n`;
    });

    // Kiểm tra templates đã được config chưa
    const hasTemplates = rounds.some(
      (r) => r.passEmailTemplate?.formName || r.failEmailTemplate?.formName
    );

    message += `\n`;
    if (hasTemplates) {
      message += `Lưu ý: Templates đã được cấu hình cho các rounds.`;
    } else {
      message += `Lưu ý: Bạn có thể cấu hình templates sau khi publish.`;
    }

    message += `\n\nBạn có muốn tạo job này không?`;

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
    // Sử dụng đúng trạng thái mà user đã chọn ở bước tạo bài (active / inactive / closed)
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
      status: (jobData.status as any) || 'inactive',
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

    // Tạo job hoàn chỉnh mới trước (không xóa draft job trước)
    // Chỉ xóa draft job sau khi tạo thành công để tránh mất dữ liệu nếu tạo thất bại
    this.jobPostService.createCompleteJob(completeRequest).subscribe({
      next: async (response: any) => {
        console.log(
          '[ConfigureRounds] Complete job created successfully',
          response
        );

        // Không cần xóa draft job nữa vì không tạo draft job

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
        console.error('[ConfigureRounds] Error creating complete job', error);
        await loading.dismiss();

        // Không có draft job để xóa (không tạo draft nữa)

        const toast = await this.toastController.create({
          message: error.message || 'Tạo job thất bại. Vui lòng thử lại.',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
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
    // Sync form data vào state trước khi navigate để đảm bảo không mất dữ liệu khi quay lại
    const roundsArray = this.roundsArray;
    const roundsFromState = this.jobCreationState.getRounds();

    // Cập nhật state với dữ liệu hiện tại từ form
    const updatedRounds = roundsArray.controls.map((control, index) => {
      const existingRound = roundsFromState.find(
        (r) => r.roundIndex === index
      ) || {
        roundIndex: index,
        roundName: `Vòng ${index + 1}`,
        isConfirmed: false,
      };

      return {
        ...existingRound,
        roundIndex: index,
        roundName: control.get('roundName')?.value || existingRound.roundName,
        isConfirmed:
          control.get('isConfirmed')?.value || existingRound.isConfirmed,
        // Giữ lại template data từ state
        passEmailTemplate: existingRound.passEmailTemplate,
        failEmailTemplate: existingRound.failEmailTemplate,
        passTemplateId: (existingRound as any).passTemplateId,
        failTemplateId: (existingRound as any).failTemplateId,
      };
    });

    this.jobCreationState.setRounds(updatedRounds);
    console.log(
      '[ConfigureRounds] Synced form data to state before navigating to email-templates'
    );

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
