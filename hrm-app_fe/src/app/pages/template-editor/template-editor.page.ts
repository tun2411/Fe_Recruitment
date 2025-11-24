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
} from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { JobPostService } from '../../services/job-post.service';
import { JobCreationStateService, EmailTemplate } from '../../services/job-creation-state.service';

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
  placeholders = [
    '{CandidateName}',
    '{RoundName}',
    '{JobTitle}',
    '{CompanyName}',
    '{NextRoundName}',
    '{CompanyEmail}',
    '{DateTime}',
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private jobPostService: JobPostService,
    private jobCreationState: JobCreationStateService,
    private toastController: ToastController
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

      // Load samples
      this.loadSamples();

      // Load data từ queryParams nếu có (từ sample)
      if (params['sampleName'] || params['sampleSubject'] || params['sampleContent']) {
        this.templateForm.patchValue({
          formName: params['sampleName'] || '',
          subject: params['sampleSubject'] || '',
          content: params['sampleContent'] || '',
        });
      } else {
        // Load existing data từ state
        const rounds = this.jobCreationState.getRounds();
        if (rounds && rounds[this.roundIndex]) {
          const round = rounds[this.roundIndex];
          const templateData =
            this.type === 'pass' ? round.passEmailTemplate : round.failEmailTemplate;
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
      const response = await firstValueFrom(this.jobPostService.getSamples(this.type));
      
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
    this.router.navigate(['/email-templates']);
  }

  async onConfirm() {
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

    // Lưu vào state (tương tự TestForm)
    const rounds = this.jobCreationState.getRounds();
    if (rounds && rounds[this.roundIndex] !== undefined) {
      // Tạo copy mới của rounds array
      const updatedRounds = rounds.map((round, index) => {
        if (index === this.roundIndex) {
          // Tạo copy mới của round này
          const updatedRound = { ...round };
          const templateData: EmailTemplate = {
            formName: this.templateForm.get('formName')?.value || '',
            subject: this.templateForm.get('subject')?.value || '',
            content: this.templateForm.get('content')?.value || '',
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
      
      // Set rounds mới vào state (service sẽ tạo deep copy)
      this.jobCreationState.setRounds(updatedRounds);
    }

    // Quay lại email-templates với queryParams để trigger reload
    // Sử dụng navigate với skipLocationChange: false để đảm bảo router events được trigger
    this.router.navigate(['/email-templates'], { 
      queryParams: { reload: Date.now() },
      replaceUrl: true 
    });
  }
}

