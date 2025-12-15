import { Injectable } from '@angular/core';
import { CreateJobRequest, JobRoundDTO } from './job-post.service';

// Key để lưu vào localStorage
const STORAGE_KEY = 'hrm_job_creation_state';

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
  // Lưu templateId để có thể attach hoặc tạo copy
  passTemplateId?: number;
  failTemplateId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class JobCreationStateService {
  private jobId: number | null = null;
  private jobData: Partial<CreateJobRequest> | null = null;
  private roundCount: number = 0;
  private rounds: RoundConfiguration[] = [];
  private roundIds: { [roundIndex: number]: number } = {}; // Map roundIndex -> roundId

  constructor() {
    // Load từ localStorage khi khởi tạo service
    this.loadFromStorage();
  }

  /**
   * Lưu state vào localStorage để persist khi đóng app
   */
  private saveToStorage(): void {
    try {
      const state = {
        jobId: this.jobId,
        jobData: this.jobData,
        roundCount: this.roundCount,
        rounds: this.rounds,
        roundIds: this.roundIds,
        timestamp: Date.now(), // Để có thể cleanup state cũ sau một thời gian
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[JobCreationState] Error saving to localStorage:', error);
    }
  }

  /**
   * Load state từ localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        // Chỉ load nếu state không quá cũ (24 giờ)
        const maxAge = 24 * 60 * 60 * 1000; // 24 giờ
        if (state.timestamp && Date.now() - state.timestamp < maxAge) {
          this.jobId = state.jobId || null;
          this.jobData = state.jobData || null;
          this.roundCount = state.roundCount || 0;
          this.rounds = state.rounds || [];
          this.roundIds = state.roundIds || {};
          console.log('[JobCreationState] Loaded state from localStorage');
        } else {
          // State quá cũ, xóa đi
          this.clearStorage();
        }
      }
    } catch (error) {
      console.error(
        '[JobCreationState] Error loading from localStorage:',
        error
      );
      this.clearStorage();
    }
  }

  /**
   * Xóa state khỏi localStorage
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[JobCreationState] Error clearing localStorage:', error);
    }
  }

  setJobId(id: number): void {
    this.jobId = id;
    this.saveToStorage();
  }

  getJobId(): number | null {
    return this.jobId;
  }

  setJobData(data: Partial<CreateJobRequest>): void {
    this.jobData = data;
    this.saveToStorage();
  }

  getJobData(): Partial<CreateJobRequest> | null {
    return this.jobData;
  }

  setRoundCount(count: number): void {
    this.roundCount = count;
    this.saveToStorage();
  }

  getRoundCount(): number {
    return this.roundCount;
  }

  setRoundId(roundIndex: number, roundId: number): void {
    this.roundIds[roundIndex] = roundId;
    this.saveToStorage();
  }

  getRoundId(roundIndex: number): number | null {
    return this.roundIds[roundIndex] || null;
  }

  setRoundIds(roundIds: { [roundIndex: number]: number }): void {
    this.roundIds = { ...roundIds };
    this.saveToStorage();
  }

  getRoundIds(): { [roundIndex: number]: number } {
    return { ...this.roundIds };
  }

  setRounds(rounds: RoundConfiguration[]): void {
    // Tạo deep copy để đảm bảo reference mới
    this.rounds = rounds.map((round) => ({
      ...round,
      passEmailTemplate: round.passEmailTemplate
        ? { ...round.passEmailTemplate }
        : undefined,
      failEmailTemplate: round.failEmailTemplate
        ? { ...round.failEmailTemplate }
        : undefined,
    }));
    this.saveToStorage();
  }

  getRounds(): RoundConfiguration[] {
    // Trả về deep copy để đảm bảo component nhận được data mới nhất
    return this.rounds.map((round) => ({
      ...round,
      passEmailTemplate: round.passEmailTemplate
        ? { ...round.passEmailTemplate }
        : undefined,
      failEmailTemplate: round.failEmailTemplate
        ? { ...round.failEmailTemplate }
        : undefined,
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
      passTemplate: round.passEmailTemplate || {
        formName: '',
        subject: '',
        content: '',
      },
      failTemplate: round.failEmailTemplate || {
        formName: '',
        subject: '',
        content: '',
      },
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
    this.jobId = null;
    this.jobData = null;
    this.roundCount = 0;
    this.rounds = [];
    this.roundIds = {};
    this.clearStorage();
  }

  /**
   * Kiểm tra xem có data trong state không
   */
  hasData(): boolean {
    return !!(this.jobData && this.roundCount > 0 && this.rounds.length > 0);
  }
}
