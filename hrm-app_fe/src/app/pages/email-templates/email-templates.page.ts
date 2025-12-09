import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  AlertController,
  ToastController,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  documentTextOutline,
  mailOutline,
  addOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { JobPostService, JobRoundDTO } from '../../services/job-post.service';
import {
  JobCreationStateService,
  RoundConfiguration,
  EmailTemplate,
} from '../../services/job-creation-state.service';
import {
  TemplateService,
  TemplateResponse,
} from '../../services/template.service';
import { EmailTemplatePreviewComponent } from '../../components/email-template-preview/email-template-preview.component';
import { JobConfirmationComponent } from '../../components/job-confirmation/job-confirmation.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-email-templates',
  templateUrl: './email-templates.page.html',
  styleUrls: ['./email-templates.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    AppHeaderComponent,
  ],
})
export class EmailTemplatesPage implements OnInit, OnDestroy {
  // Lifecycle hook của Ionic - được gọi mỗi khi vào trang này
  ionViewWillEnter() {
    // Kiểm tra query params ngay khi vào trang
    const params = this.route.snapshot.queryParams;
    const hasRequiredParams = params['roundIndex'] !== undefined && params['type'];
    
    if (!hasRequiredParams) {
      console.log('[EmailTemplates] ionViewWillEnter - No required query params, navigating to home');
      this.hasValidParams = false;
      this.router.navigate(['/home'], {
        replaceUrl: true,
      });
      return;
    }
    
    this.hasValidParams = true;
    
    // Cập nhật các biến từ query params
    if (params['jobId']) {
      this.currentJobId = parseInt(params['jobId']);
      this.jobCreationState.setJobId(this.currentJobId);
    }

    if (params['roundId']) {
      this.currentRoundId = parseInt(params['roundId']);
    }

    if (params['roundIndex'] !== undefined) {
      this.currentRoundIndex = parseInt(params['roundIndex']);
      // Nếu chưa có roundId, lấy từ state
      if (!this.currentRoundId && this.currentRoundIndex >= 0) {
        this.currentRoundId = this.jobCreationState.getRoundId(
          this.currentRoundIndex
        );
      }
    }

    if (params['type']) {
      this.currentType = params['type'] as 'pass' | 'fail';
    }
    
    console.log('[EmailTemplates] ionViewWillEnter - loading templates...');
    
    // Tự động hiển thị danh sách templates khi có query params
    if (this.currentRoundIndex >= 0 && this.currentType) {
      setTimeout(() => {
        this.showSamples(this.currentRoundIndex, this.currentType);
      }, 100);
    }
    
    // Force change detection
    setTimeout(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 50);
  }
  rounds: RoundConfiguration[] = [];
  templates: FormGroup[] = [];
  samples: TemplateResponse[] = []; // Sử dụng TemplateResponse thay vì any[]
  showSamplesList = false;
  currentRoundIndex = -1;
  currentRoundId: number | null = null;
  currentJobId: number | null = null;
  currentType: 'pass' | 'fail' = 'pass';
  hasValidParams = false; // Flag để kiểm tra có query params hợp lệ không
  private queryParamsSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private toastController: ToastController,
    private router: Router,
    private route: ActivatedRoute,
    private jobPostService: JobPostService,
    private jobCreationState: JobCreationStateService,
    private templateService: TemplateService,
    private cdr: ChangeDetectorRef,
    private modalController: ModalController
  ) {
    addIcons({
      checkmarkCircleOutline,
      closeCircleOutline,
      documentTextOutline,
      mailOutline,
      addOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit() {
    // Kiểm tra queryParams trước khi load data
    this.queryParamsSubscription = this.route.queryParams.subscribe(
      (params) => {
        // Kiểm tra xem có query params cần thiết không (roundIndex và type)
        const hasRequiredParams = params['roundIndex'] !== undefined && params['type'];
        
        // Nếu không có query params cần thiết, navigate về home
        if (!hasRequiredParams) {
          console.log('[EmailTemplates] No required query params, navigating to home');
          this.hasValidParams = false;
          this.router.navigate(['/home'], {
            replaceUrl: true,
          });
          return;
        }

        // Đánh dấu có query params hợp lệ
        this.hasValidParams = true;

        // Option 2: Cần jobId, roundIndex, roundId (nếu có), và type
        if (params['jobId']) {
          this.currentJobId = parseInt(params['jobId']);
          this.jobCreationState.setJobId(this.currentJobId);
        }

        if (params['roundId']) {
          this.currentRoundId = parseInt(params['roundId']);
        }

        if (params['roundIndex'] !== undefined) {
          this.currentRoundIndex = parseInt(params['roundIndex']);
          // Nếu chưa có roundId, lấy từ state
          if (!this.currentRoundId && this.currentRoundIndex >= 0) {
            this.currentRoundId = this.jobCreationState.getRoundId(
              this.currentRoundIndex
            );
          }
        }

        if (params['type']) {
          this.currentType = params['type'] as 'pass' | 'fail';
        }

        // Nếu có đủ thông tin, mở samples list
        if (this.currentRoundIndex >= 0 && this.currentType) {
          setTimeout(() => {
            this.showSamples(this.currentRoundIndex, this.currentType);
          }, 100);
        }
      }
    );

    // Detect khi navigate về trang này (kể cả khi quay lại từ template-editor)
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.url || event.urlAfterRedirects || '';
        if (url.includes('/email-templates')) {
          // Chỉ reload nếu có query params (roundIndex và type)
          const urlParts = url.split('?');
          if (urlParts.length > 1) {
            const queryString = urlParts[1];
            const hasRoundIndex = queryString.includes('roundIndex=');
            const hasType = queryString.includes('type=');
            
            if (hasRoundIndex && hasType) {
              // Reload data khi quay lại trang này
              console.log(
                '[EmailTemplates] NavigationEnd detected, reloading data...'
              );
              this.loadRoundsData();
              // Delay một chút để đảm bảo data được load xong
              setTimeout(() => {
                this.cdr.detectChanges();
              }, 50);
            }
          }
        }
      });
  }

  ngOnDestroy() {
    // Cleanup subscription
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadRoundsData() {
    console.log('[EmailTemplates] loadRoundsData called');
    // Luôn lấy data mới nhất từ state (đã được deep copy trong service)
    const rounds = this.jobCreationState.getRounds();
    const roundCount = this.jobCreationState.getRoundCount();

    console.log('[EmailTemplates] Rounds from state:', rounds);
    console.log('[EmailTemplates] Round count:', roundCount);

    if (rounds && rounds.length > 0) {
      // Tạo copy mới để trigger change detection
      this.rounds = rounds.map((round) => ({
        ...round,
        passEmailTemplate: round.passEmailTemplate
          ? { ...round.passEmailTemplate }
          : undefined,
        failEmailTemplate: round.failEmailTemplate
          ? { ...round.failEmailTemplate }
          : undefined,
      }));
      console.log('[EmailTemplates] Loaded rounds:', this.rounds);
    } else {
      // Tạo rounds mặc định từ roundCount
      this.rounds = [];
      for (let i = 0; i < roundCount; i++) {
        this.rounds.push({
          roundIndex: i,
          roundName: `Vòng ${i + 1}`,
          isConfirmed: false,
        });
      }
    }

    // Load templates từ rounds state (tương tự TestForm)
    // Luôn tạo lại templates array để đảm bảo change detection hoạt động đúng
    this.templates = [];
    this.rounds.forEach((round, index) => {
      // Lấy template từ round state
      const savedPassTemplate = round.passEmailTemplate || {
        formName: '',
        subject: '',
        content: '',
      };
      const savedFailTemplate = round.failEmailTemplate || {
        formName: '',
        subject: '',
        content: '',
      };

      console.log(
        `[EmailTemplates] Round ${index} - Pass:`,
        savedPassTemplate,
        'Fail:',
        savedFailTemplate
      );

      this.templates.push(
        this.fb.group({
          passTemplate: this.fb.group({
            formName: [savedPassTemplate.formName || ''],
            subject: [savedPassTemplate.subject || ''],
            content: [savedPassTemplate.content || ''],
          }),
          failTemplate: this.fb.group({
            formName: [savedFailTemplate.formName || ''],
            subject: [savedFailTemplate.subject || ''],
            content: [savedFailTemplate.content || ''],
          }),
        })
      );
    });

    console.log(
      '[EmailTemplates] Templates array length:',
      this.templates.length
    );

    // Force change detection sau khi load data
    setTimeout(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 100);
  }

  async showSamples(roundIndex: number, type: 'pass' | 'fail') {
    this.currentRoundIndex = roundIndex;
    this.currentType = type;

    // Lấy roundId nếu chưa có
    if (!this.currentRoundId && roundIndex >= 0) {
      this.currentRoundId = this.jobCreationState.getRoundId(roundIndex);
    }

    try {
      // Khi tạo job mới, chỉ hiển thị các template chung (round_id = null)
      // Chỉ filter theo roundId khi round đã được tạo trên backend và có roundId thật sự
      // Kiểm tra: nếu đang trong quá trình tạo job mới (jobId có trong state nhưng rounds chưa được tạo trên backend),
      // thì luôn truyền null để chỉ lấy template chung
      const roundIds = this.jobCreationState.getRoundIds();
      const hasRoundIdsOnBackend = Object.keys(roundIds).length > 0 && 
                                    roundIds[roundIndex] !== undefined && 
                                    roundIds[roundIndex] !== null;
      
      // Nếu không có roundId từ backend (đang tạo job mới), luôn truyền null
      const roundIdToFilter = hasRoundIdsOnBackend ? this.currentRoundId : null;

      console.log('[EmailTemplates] Filtering templates:', {
        type,
        roundIdToFilter,
        hasRoundIdsOnBackend,
        currentRoundId: this.currentRoundId
      });

      // Gọi API với filter type và round_id (null để lấy template chung khi tạo job mới)
      const response = await firstValueFrom(
        this.templateService.getTemplates(type, roundIdToFilter)
      );

      // Lấy templates từ response
      this.samples = response.templates || [];

      console.log('[EmailTemplates] Templates from API:', this.samples);
      console.log('[EmailTemplates] Total:', response.total);

      this.showSamplesList = true;
    } catch (error: any) {
      console.error('Error loading templates:', error);

      if (error?.status === 401) {
        this.samples = [];
        this.showSamplesList = false;
        return;
      }

      // Nếu lỗi khác, vẫn cho phép tạo mới
      this.samples = [];
      this.showSamplesList = true;

      if (error?.status !== 401) {
        const toast = await this.toastController.create({
          message: 'Không thể tải templates. Bạn có thể tạo mới.',
          duration: 2000,
          color: 'warning',
          position: 'top',
        });
        await toast.present();
      }
    }
  }

  getTemplateDisplayName(template: TemplateResponse): string {
    // Hiển thị tên template
    return (
      template.formName ||
      (template.subject
        ? template.subject.substring(0, 50) +
          (template.subject.length > 50 ? '...' : '')
        : '') ||
      'Unnamed Template'
    );
  }

  isTemplatePerRound(template: TemplateResponse): boolean {
    return template.roundId !== null && template.roundId !== undefined;
  }

  async selectTemplate(template: TemplateResponse) {
    console.log('[EmailTemplates] Template selected, showing preview', {
      templateId: template.formId,
      templateName: template.formName,
    });

    // Hiển thị preview modal với giao diện đẹp
    const modal = await this.modalController.create({
      component: EmailTemplatePreviewComponent,
      componentProps: {
        template: template,
      },
      cssClass: 'email-template-preview-modal',
    });

    await modal.present();

    // Xử lý kết quả từ modal
    const { data } = await modal.onWillDismiss();
    
    if (data?.action === 'edit') {
      this.editTemplate(template);
    } else if (data?.action === 'select') {
      this.saveTemplateToState(template);
    }
    // Nếu action là 'cancel' hoặc không có data, không làm gì
  }

  private editTemplate(template: TemplateResponse) {
    // Navigate to template editor với template data để chỉnh sửa
    this.router.navigate(['/template-editor'], {
      queryParams: {
        jobId: this.currentJobId,
        roundId: this.currentRoundId,
        roundIndex: this.currentRoundIndex,
        type: this.currentType,
        templateId: template.formId, // Pass template ID để edit
        formName: template.formName,
        subject: template.subject,
        content: template.content,
        editMode: 'true', // Flag để biết là edit mode
      },
    });
  }

  private async saveTemplateToState(template: TemplateResponse) {
    console.log('[EmailTemplates] Saving template to state', {
      templateId: template.formId,
      templateName: template.formName,
      currentRoundIndex: this.currentRoundIndex,
      currentType: this.currentType,
    });

    // Lưu template vào state (không gọi API ngay)
    const rounds = this.jobCreationState.getRounds();
    if (rounds && rounds[this.currentRoundIndex]) {
      const updatedRounds = rounds.map((round, index) => {
        if (index === this.currentRoundIndex) {
          const updatedRound = { ...round };
          const templateData: EmailTemplate = {
            formName: template.formName,
            subject: template.subject || '',
            content: template.content || '',
          };

          // Lưu templateId để sau này có thể attach hoặc tạo copy
          if (this.currentType === 'pass') {
            updatedRound.passEmailTemplate = templateData;
            updatedRound.passTemplateId = template.formId; // Lưu ID để dùng sau
          } else {
            updatedRound.failEmailTemplate = templateData;
            updatedRound.failTemplateId = template.formId; // Lưu ID để dùng sau
          }
          return updatedRound;
        }
        return { ...round };
      });
      this.jobCreationState.setRounds(updatedRounds);
      console.log(
        '[EmailTemplates] Template saved to state',
        updatedRounds[this.currentRoundIndex]
      );
    }

    // Hiển thị toast và quay lại configure-rounds
    const toast = await this.toastController.create({
      message: `Đã chọn template "${template.formName}"`,
      duration: 2000,
      color: 'success',
      position: 'top',
    });
    await toast.present();

    // Quay lại configure-rounds với flag để update form
    // Option 2: Cần jobId
    this.showSamplesList = false;
    this.samples = [];
    this.router.navigate(['/configure-rounds'], {
      queryParams: {
        jobId: this.currentJobId,
        refresh: Date.now(),
        templateSelected: 'true', // Flag để biết template vừa được chọn
      },
      replaceUrl: true,
    });
  }

  private async confirmTemplate(template: TemplateResponse) {
    console.log('[EmailTemplates] confirmTemplate called', {
      templateId: template.formId,
      templateName: template.formName,
      currentRoundId: this.currentRoundId,
      currentRoundIndex: this.currentRoundIndex,
      currentJobId: this.currentJobId,
      currentType: this.currentType,
    });

    // Bước 1: Kiểm tra và tạo rounds nếu chưa có
    const roundIds = this.jobCreationState.getRoundIds();
    const hasRoundIds = Object.keys(roundIds).length > 0;

    if (!hasRoundIds || !this.currentRoundId) {
      console.log(
        '[EmailTemplates] Rounds chưa được tạo, sẽ tạo rounds trước...'
      );

      // Lấy rounds từ state hoặc từ configure-rounds
      const roundsFromState = this.jobCreationState.getRounds();
      const roundCount = this.jobCreationState.getRoundCount();

      if (!roundsFromState || roundsFromState.length === 0) {
        // Nếu không có rounds trong state, tạo rounds mặc định
        const defaultRounds: RoundConfiguration[] = [];
        for (let i = 0; i < roundCount; i++) {
          defaultRounds.push({
            roundIndex: i,
            roundName: `Vòng ${i + 1}`,
            isConfirmed: false,
          });
        }
        this.jobCreationState.setRounds(defaultRounds);
      }

      // Tạo rounds trên backend
      // Lấy roundId từ state (nếu có)
      if (!this.currentRoundId && this.currentRoundIndex >= 0) {
        this.currentRoundId = this.jobCreationState.getRoundId(
          this.currentRoundIndex
        );
        console.log(
          '[EmailTemplates] RoundId sau khi tạo rounds:',
          this.currentRoundId
        );
      }
    }

    if (!this.currentRoundId) {
      console.error('[EmailTemplates] Vẫn không có roundId sau khi tạo rounds');
      const toast = await this.toastController.create({
        message: 'Không tìm thấy round ID. Vui lòng thử lại.',
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
      return;
    }

    console.log('[EmailTemplates] Attaching template', {
      formId: template.formId,
      roundId: this.currentRoundId,
    });

    // Attach template existing cho round (PUT /api/forms/{form_id})
    this.templateService
      .updateForm(template.formId, {
        roundId: this.currentRoundId,
      })
      .subscribe({
        next: async (response) => {
          console.log(
            '[EmailTemplates] Template attached successfully',
            response
          );

          // Cập nhật state với template đã chọn
          // QUAN TRỌNG: Chỉ update round hiện tại, giữ nguyên tất cả rounds khác
          const rounds = this.jobCreationState.getRounds();
          if (rounds && rounds.length > 0) {
            // Tìm round theo roundIndex thay vì index để đảm bảo chính xác
            const updatedRounds = rounds.map((round) => {
              if (round.roundIndex === this.currentRoundIndex) {
                const updatedRound = { ...round }; // Deep copy để không mutate
                const templateData: EmailTemplate = {
                  formName: template.formName,
                  subject: template.subject || '',
                  content: template.content || '',
                };

                if (this.currentType === 'pass') {
                  updatedRound.passEmailTemplate = templateData;
                  // Lưu templateId để có thể attach sau
                  (updatedRound as any).passTemplateId = template.formId;
                } else {
                  updatedRound.failEmailTemplate = templateData;
                  // Lưu templateId để có thể attach sau
                  (updatedRound as any).failTemplateId = template.formId;
                }
                return updatedRound;
              }
              // Giữ nguyên round khác (không mutate)
              return { ...round };
            });
            
            // Đảm bảo rounds array có đủ số lượng rounds
            while (updatedRounds.length <= this.currentRoundIndex) {
              updatedRounds.push({
                roundIndex: updatedRounds.length,
                roundName: `Vòng ${updatedRounds.length + 1}`,
                isConfirmed: false,
              });
            }
            
            this.jobCreationState.setRounds(updatedRounds);
            console.log(
              '[EmailTemplates] State updated with template for round',
              this.currentRoundIndex,
              'Total rounds:', updatedRounds.length,
              'Updated round:', updatedRounds.find(r => r.roundIndex === this.currentRoundIndex)
            );
          } else {
            // Nếu chưa có rounds trong state, tạo mới
            const newRounds: RoundConfiguration[] = [];
            for (let i = 0; i <= this.currentRoundIndex; i++) {
              if (i === this.currentRoundIndex) {
                const templateData: EmailTemplate = {
                  formName: template.formName,
                  subject: template.subject || '',
                  content: template.content || '',
                };
                const newRound: RoundConfiguration = {
                  roundIndex: i,
                  roundName: `Vòng ${i + 1}`,
                  isConfirmed: false,
                };
                if (this.currentType === 'pass') {
                  newRound.passEmailTemplate = templateData;
                  (newRound as any).passTemplateId = template.formId;
                } else {
                  newRound.failEmailTemplate = templateData;
                  (newRound as any).failTemplateId = template.formId;
                }
                newRounds.push(newRound);
              } else {
                newRounds.push({
                  roundIndex: i,
                  roundName: `Vòng ${i + 1}`,
                  isConfirmed: false,
                });
              }
            }
            this.jobCreationState.setRounds(newRounds);
            console.log('[EmailTemplates] Created new rounds array with template');
          }

          // Quay lại configure-rounds
          this.showSamplesList = false;
          this.samples = [];

          // Navigate back về configure-rounds với flag để refresh (ngay lập tức, không cần toast)
          // Toast sẽ được hiển thị ở configure-rounds nếu cần
          this.router.navigate(['/configure-rounds'], {
            queryParams: {
              jobId: this.currentJobId,
              refresh: Date.now(), // Force refresh
              templateAttached: 'true', // Flag để hiển thị success message
            },
            replaceUrl: true,
          });
        },
        error: async (error) => {
          console.error('[EmailTemplates] Error attaching template', error);

          const toast = await this.toastController.create({
            message:
              error.message || 'Attach template thất bại. Vui lòng thử lại.',
            duration: 3000,
            color: 'danger',
            position: 'top',
          });
          await toast.present();
        },
      });
  }

  backToRounds() {
    // Quay lại configure-rounds
    this.router.navigate(['/configure-rounds'], {
      queryParams: { jobId: this.currentJobId },
      replaceUrl: true,
    });
  }

  openTemplateEditor() {
    // Navigate to template editor page để tạo mới
    const queryParams: any = {
      jobId: this.currentJobId,
      roundId: this.currentRoundId,
      roundIndex: this.currentRoundIndex,
      type: this.currentType,
    };
    this.router.navigate(['/template-editor'], { queryParams });
  }

  hasTemplate(roundIndex: number, type: 'pass' | 'fail'): boolean {
    // Kiểm tra từ templates FormGroup (giống TestForm) - FormGroup được sync từ rounds state trong loadRoundsData()
    if (roundIndex < 0 || roundIndex >= this.templates.length) {
      return false;
    }

    const templateControl = this.templates[roundIndex]?.get(`${type}Template`);
    if (!templateControl) {
      return false;
    }

    const template = templateControl.value;
    const hasSubject = !!(
      template?.subject && template.subject.trim().length > 0
    );
    const hasContent = !!(
      template?.content && template.content.trim().length > 0
    );

    return hasSubject || hasContent;
  }

  async onConfirm() {
    // Kiểm tra xem tất cả templates đã được cấu hình chưa
    const missingTemplates: string[] = [];
    this.rounds.forEach((round, index) => {
      if (!this.hasTemplate(index, 'pass')) {
        missingTemplates.push(`Vòng ${index + 1} - Pass`);
      }
      if (!this.hasTemplate(index, 'fail')) {
        missingTemplates.push(`Vòng ${index + 1} - Fail`);
      }
    });

    if (missingTemplates.length > 0) {
      const message = `Bạn chưa cấu hình các template sau:\n${missingTemplates.join(
        '\n'
      )}\n\nBạn có muốn tiếp tục không?`;
      
      // Hiển thị confirmation modal với giao diện đẹp
      const modal = await this.modalController.create({
        component: JobConfirmationComponent,
        componentProps: {
          title: 'Thiếu cấu hình',
          message: message,
          confirmText: 'TIẾP TỤC',
          cancelText: 'HỦY',
        },
        cssClass: 'job-confirmation-modal',
      });

      await modal.present();

      // Xử lý kết quả từ modal
      const { data } = await modal.onWillDismiss();
      
      if (data?.action === 'confirm') {
        this.showConfirmDialog();
      }
    } else {
      this.showConfirmDialog();
    }
  }

  async showConfirmDialog() {
    // Lấy data từ state
    const jobData = this.jobCreationState.getJobData();
    const rounds = this.jobCreationState.getRounds();

    // Hiển thị confirmation modal với giao diện đẹp
    const modal = await this.modalController.create({
      component: JobConfirmationComponent,
      componentProps: {
        title: 'Review Job',
        confirmText: 'TẠO JOB',
        cancelText: 'HỦY',
        jobData: jobData,
        rounds: rounds,
      },
      cssClass: 'job-confirmation-modal',
    });

    await modal.present();

    // Xử lý kết quả từ modal
    const { data } = await modal.onWillDismiss();
    
    if (data?.action === 'confirm') {
      this.createJob();
    }
    // Nếu action là 'cancel' hoặc không có data, không làm gì
  }

  private async createJob() {
    // Templates đã được lưu vào rounds state từ template-editor
    // Chỉ cần đảm bảo rounds state là mới nhất
    // Nếu có thay đổi từ templates FormGroup, sync lại
    this.rounds.forEach((round, index) => {
      const templateForm = this.templates[index];
      if (templateForm) {
        const passTemplate = templateForm.get('passTemplate')
          ?.value as EmailTemplate;
        const failTemplate = templateForm.get('failTemplate')
          ?.value as EmailTemplate;

        // Chỉ cập nhật nếu FormGroup có data và rounds chưa có
        if (passTemplate && (passTemplate.subject || passTemplate.content)) {
          round.passEmailTemplate = passTemplate;
        }
        if (failTemplate && (failTemplate.subject || failTemplate.content)) {
          round.failEmailTemplate = failTemplate;
        }
      }
    });

    // Cập nhật rounds vào state (đảm bảo data mới nhất)
    this.jobCreationState.setRounds(this.rounds);

    const createJobRequest = this.jobCreationState.buildCreateJobRequest();

    if (!createJobRequest) {
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
}
