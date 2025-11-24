import { Injectable } from '@angular/core';
import { CreateJobRequest, JobRoundDTO } from './job-post.service';

export interface EmailTemplate {
  formName?: string;
  subject?: string;
  content?: string;
}

export interface RoundConfiguration {
  roundIndex: number;
  roundName: string;
  passEmailTemplate?: EmailTemplate;
  failEmailTemplate?: EmailTemplate;
  isConfirmed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class JobCreationStateService {
  private jobData: Partial<CreateJobRequest> | null = null;
  private roundCount: number = 0;
  private rounds: RoundConfiguration[] = [];

  setJobData(data: Partial<CreateJobRequest>): void {
    this.jobData = data;
  }

  getJobData(): Partial<CreateJobRequest> | null {
    return this.jobData;
  }

  setRoundCount(count: number): void {
    this.roundCount = count;
  }

  getRoundCount(): number {
    return this.roundCount;
  }

  setRounds(rounds: RoundConfiguration[]): void {
    // Tạo deep copy để đảm bảo reference mới
    this.rounds = rounds.map(round => ({
      ...round,
      passEmailTemplate: round.passEmailTemplate ? { ...round.passEmailTemplate } : undefined,
      failEmailTemplate: round.failEmailTemplate ? { ...round.failEmailTemplate } : undefined,
    }));
  }

  getRounds(): RoundConfiguration[] {
    // Trả về deep copy để đảm bảo component nhận được data mới nhất
    return this.rounds.map(round => ({
      ...round,
      passEmailTemplate: round.passEmailTemplate ? { ...round.passEmailTemplate } : undefined,
      failEmailTemplate: round.failEmailTemplate ? { ...round.failEmailTemplate } : undefined,
    }));
  }

  buildCreateJobRequest(): CreateJobRequest | null {
    if (!this.jobData || this.rounds.length === 0) {
      return null;
    }

    // Convert RoundConfiguration to JobRoundDTO
    const jobRounds: JobRoundDTO[] = this.rounds.map((round) => ({
      roundIndex: round.roundIndex,
      roundName: round.roundName,
      isConfirmed: round.isConfirmed,
    }));

    // Build templates array for each round
    const templates = this.rounds.map((round) => ({
      passTemplate: round.passEmailTemplate || { formName: '', subject: '', content: '' },
      failTemplate: round.failEmailTemplate || { formName: '', subject: '', content: '' },
    }));

    return {
      ...this.jobData,
      rounds: jobRounds,
      // Note: Templates might need to be sent separately or included in request
      // depending on backend API structure
      templates: templates as any, // Add templates if backend supports it
    } as CreateJobRequest;
  }

  clear(): void {
    this.jobData = null;
    this.roundCount = 0;
    this.rounds = [];
  }
}


