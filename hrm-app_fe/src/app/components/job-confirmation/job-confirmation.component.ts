import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { RoundConfiguration } from '../../services/job-creation-state.service';

@Component({
  selector: 'app-job-confirmation',
  templateUrl: './job-confirmation.component.html',
  styleUrls: ['./job-confirmation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
  ],
})
export class JobConfirmationComponent {
  @Input() message?: string;
  @Input() title?: string = 'Xác nhận';
  @Input() confirmText?: string = 'XÁC NHẬN';
  @Input() cancelText?: string = 'HỦY';
  @Input() jobData?: { title?: string; roundCount?: number };
  @Input() rounds?: RoundConfiguration[];

  constructor(private modalController: ModalController) {}

  onConfirm() {
    this.modalController.dismiss({ action: 'confirm' });
  }

  onCancel() {
    this.modalController.dismiss({ action: 'cancel' });
  }

  // Tạo message từ jobData và rounds nếu có
  getDisplayMessage(): string {
    if (this.message) {
      return this.message;
    }

    if (this.jobData && this.rounds && this.rounds.length > 0) {
      let message = `Job: ${this.jobData.title || 'N/A'} Số vòng: ${this.jobData.roundCount || 0} Rounds:\n`;
      
      this.rounds.forEach((round, index) => {
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
      const hasTemplates = this.rounds.some(
        (r) => r.passEmailTemplate?.formName || r.failEmailTemplate?.formName
      );

      if (hasTemplates) {
        message += `Lưu ý: Templates đã được cấu hình cho các rounds. Bạn có muốn tạo job này không?`;
      } else {
        message += `Lưu ý: Bạn có thể cấu hình templates sau khi publish. Bạn có muốn tạo job này không?`;
      }
      
      return message;
    }

    return 'Xác nhận tạo job với cấu hình hiện tại?';
  }
}

