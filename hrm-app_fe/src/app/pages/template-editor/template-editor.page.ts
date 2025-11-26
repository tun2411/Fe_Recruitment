import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonList,
  IonButton,
  IonButtons,
  IonBackButton,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { JobPostService, JobRoundDTO } from '../../services/job-post.service';
import {
  JobCreationStateService,
  EmailTemplate,
  RoundConfiguration,
} from '../../services/job-creation-state.service';
import {
  TemplateService,
  CreateTemplateRequest,
} from '../../services/template.service';

@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.page.html',
  styleUrls: ['./template-editor.page.scss'],
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
    IonInput,
    IonTextarea,
    IonList,
    IonButton,
    IonButtons,
    IonBackButton,
  ],
})
export class TemplateEditorPage implements OnInit {
  templateForm: FormGroup;
  samples: any[] = [];
  type: 'pass' | 'fail' = 'pass';
  roundIndex: number = -1;
  roundId: number | null = null;
  jobId: number | null = null;
  placeholders = [
    '{{CandidateName}}',
    '{{RoundName}}',
    '{{JobTitle}}',
    '{{CompanyName}}',
    '{{NextRoundName}}',
    '{{NextRoundDate}}',
    '{{CompanyEmail}}',
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private jobPostService: JobPostService,
    private jobCreationState: JobCreationStateService,
    private templateService: TemplateService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.templateForm = this.fb.group({
      formName: [''],
      subject: [''],
      content: [''],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.type = (params['type'] as 'pass' | 'fail') || 'pass';
      this.roundIndex = parseInt(params['roundIndex'] || '-1');

      // Lấy jobId và roundId từ queryParams
      if (params['jobId']) {
        this.jobId = parseInt(params['jobId']);
        this.jobCreationState.setJobId(this.jobId);
      }

      if (params['roundId']) {
        this.roundId = parseInt(params['roundId']);
      } else if (this.roundIndex >= 0) {
        // Nếu chưa có roundId, lấy từ state
        this.roundId = this.jobCreationState.getRoundId(this.roundIndex);
      }

      // Load samples (optional - để tham khảo)
      // this.loadSamples();

      // Load data từ queryParams nếu có (từ sample)
      if (
        params['sampleName'] ||
        params['sampleSubject'] ||
        params['sampleContent']
      ) {
        this.templateForm.patchValue({
          formName: params['sampleName'] || '',
          subject: params['sampleSubject'] || '',
          content: params['sampleContent'] || '',
        });
      } else {
        // Load existing data từ state (nếu có)
        const rounds = this.jobCreationState.getRounds();
        if (rounds && rounds[this.roundIndex]) {
          const round = rounds[this.roundIndex];
          const templateData =
            this.type === 'pass'
              ? round.passEmailTemplate
              : round.failEmailTemplate;
          if (templateData) {
            this.templateForm.patchValue(templateData);
          }
        }
      }
    });
  }

  async loadSamples() {
    try {
      // API sẽ tự động gửi Bearer token thông qua authInterceptor
      // Backend sẽ decode token để lấy user ID và trả về samples của user đó
      const response = await firstValueFrom(
        this.jobPostService.getSamples(this.type)
      );

      // Đảm bảo samples luôn là array
      if (Array.isArray(response)) {
        this.samples = response;
      } else if (response && typeof response === 'object') {
        // Nếu API trả về object, convert thành array
        // Có thể là { data: [...] } hoặc { forms: [...] }
        this.samples =
          (response as any).data ||
          (response as any).forms ||
          Object.values(response);
      } else {
        this.samples = [];
      }
    } catch (error: any) {
      console.error('Error loading samples:', error);

      // Nếu lỗi 401, có thể token hết hạn hoặc không hợp lệ
      // Auth interceptor sẽ tự động xử lý logout và redirect
      if (error?.status === 401) {
        // Không cần xử lý gì thêm vì interceptor đã xử lý
        this.samples = [];
        return;
      }

      // Nếu lỗi khác, vẫn cho phép tiếp tục với samples rỗng
      this.samples = [];
    }
  }

  selectSample(sample: any) {
    this.templateForm.patchValue({
      formName: sample.sampleName || sample.name || '',
      subject: sample.subject || '',
      content: sample.content || '',
    });
  }

  insertPlaceholder(placeholder: string) {
    const currentContent = this.templateForm.get('content')?.value || '';
    this.templateForm.get('content')?.setValue(currentContent + placeholder);
  }

  onCancel() {
    // Quay lại email-templates hoặc configure-rounds
    if (this.jobId) {
      this.router.navigate(['/configure-rounds'], {
        queryParams: { jobId: this.jobId },
        replaceUrl: true,
      });
    } else {
      this.router.navigate(['/email-templates'], { replaceUrl: true });
    }
  }

  async onConfirm() {
    console.log('[TemplateEditor] onConfirm called', {
      roundId: this.roundId,
      roundIndex: this.roundIndex,
      jobId: this.jobId,
      type: this.type,
    });

    if (
      !this.templateForm.get('subject')?.value &&
      !this.templateForm.get('content')?.value
    ) {
      const toast = await this.toastController.create({
        message: 'Vui lòng nhập ít nhất Subject hoặc Content',
        duration: 2000,
        color: 'warning',
        position: 'top',
      });
      await toast.present();
      return;
    }

    // Bước 1: Kiểm tra và tạo rounds nếu chưa có
    const roundIds = this.jobCreationState.getRoundIds();
    const hasRoundIds = Object.keys(roundIds).length > 0;

    if (!hasRoundIds || !this.roundId) {
      console.log(
        '[TemplateEditor] Rounds chưa được tạo, sẽ tạo rounds trước...'
      );
      // Lấy roundId từ state (nếu có)
      if (!this.roundId && this.roundIndex >= 0) {
        this.roundId = this.jobCreationState.getRoundId(this.roundIndex);
        console.log('[TemplateEditor] RoundId sau khi tạo rounds:', this.roundId);
      }

      if (!this.roundId) {
        console.error('[TemplateEditor] Vẫn không có roundId sau khi tạo rounds');
        const toast = await this.toastController.create({
          message: 'Không tìm thấy round ID. Vui lòng thử lại.',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
        return;
      }
    }

    const loading = await this.loadingController.create({
      message: 'Đang tạo template...',
      spinner: 'crescent',
    });
    await loading.present();

    // Tạo template request
    const createTemplateRequest: CreateTemplateRequest = {
      formName:
        this.templateForm.get('formName')?.value ||
        `Email ${this.type} ${this.roundIndex + 1}`,
      type: this.type,
      roundId: this.roundId, // Per round template
      subject: this.templateForm.get('subject')?.value || '',
      content: this.templateForm.get('content')?.value || '',
    };

    console.log('[TemplateEditor] Creating template', createTemplateRequest);

    // Gọi API tạo template
    this.templateService.createTemplate(createTemplateRequest).subscribe({
      next: async (response) => {
        console.log('[TemplateEditor] Template created successfully', response);
        await loading.dismiss();

        // Cập nhật state với template đã tạo
        const rounds = this.jobCreationState.getRounds();
        if (rounds && rounds[this.roundIndex]) {
          const updatedRounds = rounds.map((round, index) => {
            if (index === this.roundIndex) {
              const updatedRound = { ...round };
              const templateData: EmailTemplate = {
                formName: createTemplateRequest.formName,
                subject: createTemplateRequest.subject,
                content: createTemplateRequest.content,
              };

              if (this.type === 'pass') {
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
            '[TemplateEditor] State updated with template',
            updatedRounds[this.roundIndex]
          );
        }

        const toast = await this.toastController.create({
          message: `Tạo template "${createTemplateRequest.formName}" thành công!`,
          duration: 2000,
          color: 'success',
          position: 'top',
        });
        await toast.present();

        // Quay lại configure-rounds với flag để refresh
        this.router.navigate(['/configure-rounds'], {
          queryParams: {
            jobId: this.jobId,
            refresh: Date.now(), // Force refresh
          },
          replaceUrl: true,
        });
      },
      error: async (error) => {
        console.error('[TemplateEditor] Error creating template', error);
        await loading.dismiss();

        const toast = await this.toastController.create({
          message: error.message || 'Tạo template thất bại. Vui lòng thử lại.',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        await toast.present();
      },
    });
  }

}
