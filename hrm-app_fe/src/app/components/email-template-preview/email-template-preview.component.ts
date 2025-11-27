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
import { TemplateResponse } from '../../services/template.service';

@Component({
  selector: 'app-email-template-preview',
  templateUrl: './email-template-preview.component.html',
  styleUrls: ['./email-template-preview.component.scss'],
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
export class EmailTemplatePreviewComponent {
  @Input() template!: TemplateResponse;

  constructor(private modalController: ModalController) {}

  onEdit() {
    this.modalController.dismiss({ action: 'edit' });
  }

  onSelect() {
    this.modalController.dismiss({ action: 'select' });
  }

  onCancel() {
    this.modalController.dismiss({ action: 'cancel' });
  }

  // Replace placeholders with sample values for preview
  getPreviewContent(content: string): string {
    if (!content) return '(Không có content)';
    
    return content
      .replace(/\{\{JobTitle\}\}/g, 'Software Engineer')
      .replace(/\{\{CandidateName\}\}/g, 'Nguyễn Văn A')
      .replace(/\{\{CompanyName\}\}/g, 'Công ty ABC')
      .replace(/\{\{RoundName\}\}/g, 'Vòng phỏng vấn')
      .replace(/\{\{NextRoundName\}\}/g, 'Vòng tiếp theo')
      .replace(/\{\{CompanyEmail\}\}/g, 'hr@company.com')
      .replace(/\{\{DateTime\}\}/g, '01/01/2024 10:00');
  }

  getPreviewSubject(subject: string): string {
    if (!subject) return '(Không có subject)';
    
    return subject
      .replace(/\{\{JobTitle\}\}/g, 'Software Engineer')
      .replace(/\{\{CandidateName\}\}/g, 'Nguyễn Văn A')
      .replace(/\{\{CompanyName\}\}/g, 'Công ty ABC')
      .replace(/\{\{RoundName\}\}/g, 'Vòng phỏng vấn')
      .replace(/\{\{NextRoundName\}\}/g, 'Vòng tiếp theo')
      .replace(/\{\{CompanyEmail\}\}/g, 'hr@company.com')
      .replace(/\{\{DateTime\}\}/g, '01/01/2024 10:00');
  }
}

