import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonList,
  IonButton,
  IonFooter,
  IonToolbar,
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
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.page.html',
  styleUrls: ['./template-editor.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonList,
    IonButton,
    IonFooter,
    IonToolbar,
    AppHeaderComponent,
  ],
})
export class TemplateEditorPage implements OnInit {
  templateForm: FormGroup;
  samples: any[] = [];
  // Hỗ trợ cả 3 loại template: pass, fail, apply_confirm
  type: 'pass' | 'fail' | 'apply_confirm' = 'pass';
  isEditMode = false;
  templateId: number | null = null;
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
    private location: Location,
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
      this.type = (params['type'] as 'pass' | 'fail' | 'apply_confirm') || 'pass';
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

      // Ưu tiên: nếu đi từ email-management để CHỈNH SỬA, dùng dữ liệu từ queryParams
      // (editMode=true, templateId, formName, subject, content)
      if (params['editMode'] === 'true' || params['editMode'] === true) {
        this.isEditMode = true;
        this.templateId = params['templateId']
          ? parseInt(params['templateId'], 10)
          : null;
        this.templateForm.patchValue({
          formName: params['formName'] || '',
          subject: params['subject'] || '',
          content: params['content'] || '',
        });
      } else if (
        // Trường hợp chọn sample từ email-templates
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
        // Mặc định: Load existing data từ state (nếu có)
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
    // Quay lại trang trước đó
    this.location.back();
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

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Đang cập nhật template...' : 'Đang tạo template...',
      spinner: 'crescent',
    });
    await loading.present();

    // Build request cho cả tạo mới và cập nhật
    const baseRequest: CreateTemplateRequest = {
      formName:
        this.templateForm.get('formName')?.value ||
        `Email ${this.type} ${this.roundIndex + 1}`,
      type: this.type,
      // Luôn gửi roundId = null để tạo form/template chung (không gắn với round cụ thể)
      roundId: null,
      subject: this.templateForm.get('subject')?.value || '',
      content: this.templateForm.get('content')?.value || '',
    };

    // Nếu đang chỉnh sửa và có templateId, thêm formId vào request
    const request: CreateTemplateRequest = this.isEditMode && this.templateId
      ? { ...baseRequest, formId: this.templateId }
      : baseRequest;

    console.log(
      this.isEditMode
        ? '[TemplateEditor] Updating template'
        : '[TemplateEditor] Creating template',
      request
    );

    // Gọi API: tạo mới (POST) hoặc cập nhật (PUT)
    const api$ = this.isEditMode
      ? this.templateService.updateTemplate(request)
      : this.templateService.createTemplate(request);

    api$.subscribe({
      next: async (response) => {
        console.log(
          this.isEditMode
            ? '[TemplateEditor] Template updated successfully'
            : '[TemplateEditor] Template created successfully',
          response
        );
        await loading.dismiss();

        // Nếu đang trong flow tạo job (configure-rounds), cập nhật state; nếu chỉ edit từ email-management thì state có thể rỗng
        if (!this.isEditMode) {
          const rounds = this.jobCreationState.getRounds();
          if (rounds && this.roundIndex >= 0 && rounds[this.roundIndex]) {
            const updatedRounds = rounds.map((round, index) => {
              if (index === this.roundIndex) {
                const updatedRound = { ...round };
                const templateData: EmailTemplate = {
                  formName: baseRequest.formName,
                  subject: baseRequest.subject,
                  content: baseRequest.content,
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
        }

        const toast = await this.toastController.create({
          message: this.isEditMode
            ? `Cập nhật template "${baseRequest.formName}" thành công!`
            : `Tạo template "${baseRequest.formName}" thành công!`,
          duration: 2000,
          color: 'success',
          position: 'top',
        });
        await toast.present();

        // Quay lại TRANG TRƯỚC ĐÓ (ví dụ: email-templates, configure-rounds, email-management, ...)
        this.location.back();
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
