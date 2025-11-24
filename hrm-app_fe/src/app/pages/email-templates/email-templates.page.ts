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
import { JobPostService } from '../../services/job-post.service';
import { JobCreationStateService, RoundConfiguration, EmailTemplate } from '../../services/job-creation-state.service';

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
  samples: any[] = [];
  showSamplesList = false;
  currentRoundIndex = -1;
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
          console.log('[EmailTemplates] NavigationEnd detected, reloading data...');
          this.loadRoundsData();
          // Delay một chút để đảm bảo data được load xong
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 50);
        }
      });

    // Kiểm tra queryParams để tự động mở samples list
    this.queryParamsSubscription = this.route.queryParams.subscribe((params) => {
      // Reload data khi có queryParams (khi quay lại từ template-editor)
      // Đảm bảo load lại data mới nhất từ state
      this.loadRoundsData();

      if (params['roundIndex'] !== undefined && params['type']) {
        const roundIndex = parseInt(params['roundIndex']);
        const type = params['type'] as 'pass' | 'fail';
        // Delay một chút để đảm bảo rounds đã được load
        setTimeout(() => {
          if (roundIndex >= 0 && roundIndex < this.rounds.length) {
            this.showSamples(roundIndex, type);
          }
        }, 100);
      } else {
        // Nếu không có queryParams, ẩn samples list và đảm bảo data được refresh
        this.showSamplesList = false;
        // Force reload để cập nhật trạng thái templates
        this.loadRoundsData();
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
      this.rounds = rounds.map(round => ({
        ...round,
        passEmailTemplate: round.passEmailTemplate ? { ...round.passEmailTemplate } : undefined,
        failEmailTemplate: round.failEmailTemplate ? { ...round.failEmailTemplate } : undefined,
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
      const savedPassTemplate = round.passEmailTemplate || { formName: '', subject: '', content: '' };
      const savedFailTemplate = round.failEmailTemplate || { formName: '', subject: '', content: '' };
      
      console.log(`[EmailTemplates] Round ${index} - Pass:`, savedPassTemplate, 'Fail:', savedFailTemplate);
      
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
    
    console.log('[EmailTemplates] Templates array length:', this.templates.length);
    
    // Force change detection sau khi load data
    setTimeout(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 100);
  }

  async showSamples(roundIndex: number, type: 'pass' | 'fail') {
    this.currentRoundIndex = roundIndex;
    this.currentType = type;
    try {
      // API sẽ tự động gửi Bearer token thông qua authInterceptor
      // Backend sẽ decode token để lấy user ID và trả về samples của user đó
      const response = await firstValueFrom(this.jobPostService.getSamples(type));
      
      // Đảm bảo samples luôn là array
      if (Array.isArray(response)) {
        this.samples = response;
      } else if (response && typeof response === 'object') {
        // Nếu API trả về object, convert thành array
        // Có thể là { data: [...] } hoặc { forms: [...] }
        this.samples = (response as any).data || (response as any).forms || Object.values(response);
      } else {
        this.samples = [];
      }
      
      // Debug: Log để xem cấu trúc dữ liệu từ API
      console.log('[EmailTemplates] Samples from API:', this.samples);
      if (this.samples.length > 0) {
        console.log('[EmailTemplates] First sample structure:', this.samples[0]);
        console.log('[EmailTemplates] Available fields:', Object.keys(this.samples[0]));
      }
      
      this.showSamplesList = true;
    } catch (error: any) {
      console.error('Error loading samples:', error);
      
      // Nếu lỗi 401, có thể token hết hạn hoặc không hợp lệ
      // Auth interceptor sẽ tự động xử lý logout và redirect
      if (error?.status === 401) {
        // Không cần hiển thị toast vì interceptor đã xử lý
        this.samples = [];
        this.showSamplesList = false; // Ẩn samples list vì sẽ redirect về login
        return;
      }
      
      // Nếu lỗi khác (404, 500, etc.), vẫn cho phép tạo mới
      this.samples = [];
      this.showSamplesList = true;
      
      // Hiển thị thông báo nếu không phải lỗi 401
      if (error?.status !== 401) {
        const toast = await this.toastController.create({
          message: 'Không thể tải mẫu email. Bạn có thể tạo mới.',
          duration: 2000,
          color: 'warning',
          position: 'top',
        });
        await toast.present();
      }
    }
  }

  getTemplateDisplayName(sample: any): string {
    // Ưu tiên hiển thị tên template thay vì tên form
    // Thử các field có thể chứa tên template: templateName, name, title, subject (nếu không có tên riêng)
    return sample.templateName || 
           sample.name || 
           sample.title || 
           (sample.subject ? sample.subject.substring(0, 50) + (sample.subject.length > 50 ? '...' : '') : null) ||
           sample.sampleName || 
           sample.formName || 
           '';
  }

  async selectTemplate(sample: any) {
    // Hiển thị nội dung template trong AlertController
    const templateName = this.getTemplateDisplayName(sample) || 'Template';
    const templateSubject = sample.subject || '';
    const templateContent = sample.content || '';
    
    // Tạo message hiển thị nội dung template
    let message = '';
    if (templateSubject) {
      message += `<strong>Subject:</strong><br>${templateSubject}<br><br>`;
    }
    if (templateContent) {
      message += `<strong>Content:</strong><br>${templateContent}`;
    }
    if (!message) {
      message = 'Template này không có nội dung.';
    }

    try {
      const alert = await this.alertCtrl.create({
        header: templateName,
        message: `<div style="text-align: left; white-space: pre-wrap; max-height: 400px; overflow-y: auto;">${message}</div>`,
        buttons: [
          { 
            text: 'Hủy', 
            role: 'cancel' 
          },
          { 
            text: 'Xác nhận', 
            handler: () => {
              this.confirmTemplate(sample);
            }
          },
        ],
        cssClass: 'template-preview-alert'
      });
      await alert.present();
    } catch (error) {
      // Fallback nếu AlertController không hoạt động
      const confirmMessage = `Subject: ${templateSubject}\n\nContent: ${templateContent}\n\nBạn có muốn sử dụng template này không?`;
      if (confirm(confirmMessage)) {
        this.confirmTemplate(sample);
      }
    }
  }

  private confirmTemplate(sample: any) {
    // Lưu template vào state
    const rounds = this.jobCreationState.getRounds();
    if (rounds && rounds[this.currentRoundIndex] !== undefined) {
      // Tạo copy mới của rounds array
      const updatedRounds = rounds.map((round, index) => {
        if (index === this.currentRoundIndex) {
          // Tạo copy mới của round này
          const updatedRound = { ...round };
          const templateData: EmailTemplate = {
            formName: sample.sampleName || sample.name || sample.formName || '',
            subject: sample.subject || '',
            content: sample.content || '',
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
      
      // Set rounds mới vào state (service sẽ tạo deep copy)
      this.jobCreationState.setRounds(updatedRounds);
      
      // Quay lại danh sách rounds trước
      this.showSamplesList = false;
      this.samples = [];
      
      // Reload data để cập nhật trạng thái
      this.loadRoundsData();
      
      // Force change detection sau khi reload
      setTimeout(() => {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        
        // Hiển thị thông báo thành công
        this.toastController.create({
          message: 'Đã cấu hình template thành công!',
          duration: 2000,
          color: 'success',
          position: 'top',
        }).then(toast => toast.present());
      }, 100);
    }
  }

  backToRounds() {
    this.showSamplesList = false;
    this.samples = [];
    // Force reload để cập nhật trạng thái
    this.loadRoundsData();
    // Clear queryParams khi quay lại
    this.router.navigate(['/email-templates'], { replaceUrl: true });
  }

  openTemplateEditor() {
    // Navigate to template editor page để tạo mới
    const queryParams: any = {
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
    const hasSubject = !!(template?.subject && template.subject.trim().length > 0);
    const hasContent = !!(template?.content && template.content.trim().length > 0);
    
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
      const message = `Bạn chưa cấu hình các template sau:\n${missingTemplates.join('\n')}\n\nBạn có muốn tiếp tục không?`;
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
        const passTemplate = templateForm.get('passTemplate')?.value as EmailTemplate;
        const failTemplate = templateForm.get('failTemplate')?.value as EmailTemplate;
        
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

