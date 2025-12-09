import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  ToastController,
} from '@ionic/angular/standalone';
import { ApplicationService, Application } from '../../services/application.service';
import { JobPostService, JobResponse } from '../../services/job-post.service';
import { TemplateService, TemplateResponse } from '../../services/template.service';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.page.html',
  styleUrls: ['./confirm-email.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    AppHeaderComponent,
  ],
})
export class ConfirmEmailPage implements OnInit {
  applicationId: number | null = null;
  status: 'pass' | 'fail' = 'pass';
  application: Application | null = null;
  job: JobResponse | null = null;
  template: TemplateResponse | null = null;
  loading: boolean = false;
  processing: boolean = false;
  
  // Form data
  subject: string = '';
  content: string = '';
  
  // Data for placeholder replacement
  candidateName: string = '';
  roundName: string = '';
  nextRoundName: string = '';
  jobTitle: string = '';
  companyName: string = 'HRM System'; // Default, có thể lấy từ config
  companyEmail: string = 'hr@company.com'; // Default, có thể lấy từ config
  dateTime: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private jobPostService: JobPostService,
    private templateService: TemplateService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    const params = this.route.snapshot.queryParams;
    this.applicationId = params['applicationId'] ? parseInt(params['applicationId']) : null;
    this.status = params['status'] === 'fail' ? 'fail' : 'pass';

    if (!this.applicationId) {
      await this.showToast('Không tìm thấy ID đơn ứng tuyển', 'danger');
      this.router.navigate(['/candidates']);
      return;
    }

    await this.loadData();
  }

  async loadData() {
    this.loading = true;

    try {
      // Load application
      this.application = await firstValueFrom(
        this.applicationService.getApplicationById(this.applicationId!)
      );

      if (!this.application || !this.application.jobId) {
        await this.showToast('Không tìm thấy thông tin đơn ứng tuyển', 'danger');
        this.router.navigate(['/candidates']);
        return;
      }

      // Load job
      this.job = await firstValueFrom(
        this.jobPostService.getJobPostById(this.application.jobId)
      );

      // Get current round
      const currentRound = this.job.rounds.find(
        (r) => r.roundIndex === this.application!.currentRoundIndex
      );

      if (!currentRound || !currentRound.roundId) {
        await this.showToast('Không tìm thấy thông tin vòng tuyển dụng', 'danger');
        this.router.navigate(['/candidates']);
        return;
      }

      // Load email template
      const templateResponse = await firstValueFrom(
        this.templateService.getTemplates(this.status, currentRound.roundId)
      );

      if (!templateResponse.templates || templateResponse.templates.length === 0) {
        await this.showToast('Không tìm thấy mẫu email', 'danger');
        this.router.navigate(['/candidates']);
        return;
      }

      this.template = templateResponse.templates[0];

      // Prepare data for placeholder replacement
      this.candidateName = this.application.candidateFullName;
      this.roundName = currentRound.roundName;
      this.jobTitle = this.job.title;
      
      // Get next round name
      const nextRound = this.job.rounds.find(
        (r) => r.roundIndex === this.application!.currentRoundIndex + 1
      );
      this.nextRoundName = nextRound?.roundName || '';

      // Format date time
      const now = new Date();
      this.dateTime = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} và lúc: ${now.getHours()}h`;

      // Replace placeholders in subject and content
      this.subject = this.replacePlaceholders(this.template.subject || '');
      this.content = this.replacePlaceholders(this.template.content || '');

      this.loading = false;
    } catch (error: any) {
      console.error('Error loading data:', error);
      this.loading = false;
      await this.showToast(
        error.message || 'Không thể tải dữ liệu',
        'danger'
      );
      this.router.navigate(['/candidates']);
    }
  }

  replacePlaceholders(text: string): string {
    return text
      .replace(/{CandidateName}/g, this.candidateName)
      .replace(/{RoundName}/g, this.roundName)
      .replace(/{NextRoundName}/g, this.nextRoundName)
      .replace(/{JobTitle}/g, this.jobTitle)
      .replace(/{CompanyName}/g, this.companyName)
      .replace(/{CompanyEmail}/g, this.companyEmail)
      .replace(/{DateTime}/g, this.dateTime);
  }

  async onConfirm() {
    if (!this.applicationId || !this.application) {
      await this.showToast('Không tìm thấy thông tin đơn ứng tuyển', 'danger');
      return;
    }

    this.processing = true;

    try {
      // Update application status
      const request = {
        status: this.status,
        note: undefined,
        roundIndex: this.application.currentRoundIndex,
      };

      await firstValueFrom(
        this.applicationService.updateApplicationStatus(this.applicationId, request)
      );

      // TODO: Gửi email ở đây (có thể cần thêm API endpoint để gửi email)
      // await this.sendEmail();

      await this.showToast('Đã cập nhật trạng thái và gửi email thành công', 'success');
      
      // Navigate back to application detail
      this.router.navigate(['/application-detail', this.applicationId]);
    } catch (error: any) {
      console.error('Error confirming:', error);
      await this.showToast(
        error.message || 'Có lỗi xảy ra khi xác nhận',
        'danger'
      );
    } finally {
      this.processing = false;
    }
  }


  onCancel() {
    if (this.applicationId) {
      this.router.navigate(['/application-detail', this.applicationId]);
    } else {
      this.router.navigate(['/candidates']);
    }
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
}

