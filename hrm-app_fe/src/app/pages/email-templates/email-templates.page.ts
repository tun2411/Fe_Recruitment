import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonButton,
  IonButtons,
  IonToggle,
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
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

@Component({
  selector: 'app-email-templates',
  templateUrl: './email-templates.page.html',
  styleUrls: ['./email-templates.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonButton,
    IonButtons,
    IonToggle,
  ],
})
export class EmailTemplatesPage implements OnInit, OnDestroy {
  // Lifecycle hook của Ionic - được gọi mỗi khi vào trang này
  ionViewWillEnter() {
    console.log('[EmailTemplates] ionViewWillEnter - reloading data...');
    this.loadRoundsData();
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
  private queryParamsSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router,
    private route: ActivatedRoute,
    private jobPostService: JobPostService,
    private jobCreationState: JobCreationStateService,
    private templateService: TemplateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRoundsData();

    // Detect khi navigate về trang này (kể cả khi quay lại từ template-editor)
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.url || event.urlAfterRedirects || '';
        if (url.includes('/email-templates')) {
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
      });

    // Kiểm tra queryParams để tự động mở samples list
    this.queryParamsSubscription = this.route.queryParams.subscribe(
      (params) => {
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
        } else {
          // Nếu không có queryParams, ẩn samples list
          this.showSamplesList = false;
          this.loadRoundsData();
        }
      }
    );
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
      // Gọi API với filter type và round_id
      const response = await firstValueFrom(
        this.templateService.getTemplates(type, this.currentRoundId || null)
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

    // Hiển thị preview modal với subject và content
    const alert = await this.alertCtrl.create({
      header: `Preview: ${template.formName || 'Template'}`,
      subHeader: `Subject: ${template.subject || '(Không có subject)'}`,
      message: `<div style="max-height: 300px; overflow-y: auto; white-space: pre-wrap; padding: 10px; background: #f5f5f5; border-radius: 5px;">${
        template.content || '(Không có content)'
      }</div>`,
      buttons: [
        {
          text: 'Chỉnh sửa',
          handler: () => {
            this.editTemplate(template);
          },
        },
        {
          text: 'Chọn template này',
          handler: () => {
            this.saveTemplateToState(template);
          },
        },
        {
          text: 'Hủy',
          role: 'cancel',
        },
      ],
      cssClass: 'template-preview-alert',
    });

    await alert.present();
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

    const loading = await this.loadingController.create({
      message: `Đang chọn template "${template.formName}"...`,
      spinner: 'crescent',
      duration: 2000, // Auto dismiss sau 2s nếu thành công
    });
    await loading.present();

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
          await loading.dismiss();

          // Cập nhật state với template đã chọn
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

                if (this.currentType === 'pass') {
                  updatedRound.passEmailTemplate = templateData;
                } else {
                  updatedRound.failEmailTemplate = templateData;
                }
                return updatedRound;
              }
              return { ...round };
            });
            this.jobCreationState.setRounds(updatedRounds);
            console.log(
              '[EmailTemplates] State updated with template',
              updatedRounds[this.currentRoundIndex]
            );
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
          await loading.dismiss();

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
      try {
        const alert = await this.alertCtrl.create({
          header: 'Thiếu cấu hình',
          message: message,
          buttons: [
            { text: 'Hủy', role: 'cancel' },
            { text: 'Tiếp tục', handler: () => this.showConfirmDialog() },
          ],
        });
        await alert.present();
      } catch (error) {
        if (confirm(message)) {
          this.showConfirmDialog();
        }
      }
    } else {
      this.showConfirmDialog();
    }
  }

  async showConfirmDialog() {
    try {
      const alert = await this.alertCtrl.create({
        header: 'Xác nhận',
        message: 'Xác nhận tạo job với cấu hình hiện tại?',
        buttons: [
          { text: 'Hủy', role: 'cancel' },
          { text: 'Xác nhận', handler: () => this.createJob() },
        ],
      });
      await alert.present();
    } catch (error) {
      // Fallback nếu AlertController không hoạt động
      if (confirm('Xác nhận tạo job với cấu hình hiện tại?')) {
        this.createJob();
      }
    }
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
}
