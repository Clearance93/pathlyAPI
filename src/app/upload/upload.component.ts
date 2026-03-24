import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AcademicService } from '../services/academic.service';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../services/auth.service';
import { AiResponse, CareerMatch, DemandingCareerAssessment, DyingCareerWarning, EmploymentOutlook, SubjectResult } from '../models/ai-response.model';

@Component({
  selector: 'app-upload',
  imports: [CommonModule, RouterLink],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent {
  private service = inject(AcademicService);
  sub = inject(SubscriptionService);
  auth = inject(AuthService);

  private readonly RESULT_KEY = 'pathly_pending_result';

  fileName = signal('');
  loading = signal(false);
  error = signal('');
  result = signal<AiResponse | null>(this.restoreResult());

  // ── Plan helpers ──────────────────────────────────────────
  get isFree()   { return this.auth.plan() === 'free'; }
  get isPro()    { return this.auth.isPro(); }
  get isSchool() { return this.auth.plan() === 'school'; }

  // ── Filtered data by plan ─────────────────────────────────
  get visibleBestCareers() { return (this.result()?.topFiveBestCareers ?? []).slice(0, this.isPro ? undefined : 1); }
  get lockedBestCareers(): CareerMatch[] { return this.isPro ? [] : (this.result()?.topFiveBestCareers ?? []).slice(1); }
  get visibleAltCareers(): CareerMatch[]                  { return this.isPro ? (this.result()?.topFiveAlternativeCareer ?? []) : []; }
  get visibleDemandingJobs(): DemandingCareerAssessment[]  { return this.isPro ? (this.result()?.topDemandingJobs ?? []) : []; }
  get visibleDyingCareers(): DyingCareerWarning[]          { return this.isPro ? (this.result()?.dyingCareers ?? []) : []; }
  get visibleOutlook(): EmploymentOutlook[]                { return this.isPro ? (this.result()?.employmentOutlookAfterGraduation ?? []) : []; }
  get visibleSubjects(): SubjectResult[]                   { return this.result()?.subjectResults ?? []; }
  get showExtras()           { return false; }

  // ── File upload ───────────────────────────────────────────
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!this.sub.canAnalyze()) {
      this.error.set('You have used your free analysis. Upgrade to Pro for unlimited analyses.');
      return;
    }

    const MAX_MB = 1.5;
    if (file.size > MAX_MB * 1024 * 1024) {
      this.error.set(`File is too large. Please upload an image or PDF under ${MAX_MB}MB.`);
      return;
    }

    this.fileName.set(file.name);

    if (file.type.startsWith('image/')) {
      this.compressImage(file).then(base64 => this.submit(base64));
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.submit(base64);
      };
      reader.readAsDataURL(file);
    }
  }

  private compressImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_DIM = 1200;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        resolve(base64);
      };
      img.src = url;
    });
  }

  private restoreResult(): AiResponse | null {
    const saved = sessionStorage.getItem(this.RESULT_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  private submit(base64: string): void {
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);

    this.service.analyzeResults(base64).subscribe({
      next: (res) => {
        this.result.set(res);
        sessionStorage.setItem(this.RESULT_KEY, JSON.stringify(res));
        this.loading.set(false);
        this.sub.recordUsage();
        this.sub.recordIp();
      },
      error: (err) => {
        if (err.status === 413) {
          this.error.set('Your file is too large for the server. Please use a smaller or compressed image.');
        } else if (err.status === 429) {
          this.error.set('The AI is currently busy. Please wait a moment and try again.');
        } else {
          this.error.set(err?.error?.message || err.message || 'Something went wrong.');
        }
        this.loading.set(false);
      }
    });
  }
}
