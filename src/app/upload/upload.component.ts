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

  // ── Plan helpers — pro is blocked for now, everyone sees free tier ──
  get isFree()   { return true; }
  get isPro()    { return false; }
  get isSchool() { return false; }

  // ── Filtered data by plan ─────────────────────────────────
  get visibleBestCareers() { return (this.result()?.topFiveBestCareers ?? []).slice(0, 1); }
  get lockedBestCareers(): CareerMatch[] { return (this.result()?.topFiveBestCareers ?? []).slice(1); }
  get visibleAltCareers(): CareerMatch[]                  { return []; }
  get visibleDemandingJobs(): DemandingCareerAssessment[]  { return []; }
  get visibleDyingCareers(): DyingCareerWarning[]          { return []; }
  get visibleOutlook(): EmploymentOutlook[]                { return []; }
  get visibleSubjects(): SubjectResult[]                   { return []; }
  get showExtras()           { return false; }

  // ── File upload ───────────────────────────────────────────
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!this.sub.canAnalyze()) {
      this.error.set('You have used your free analysis. Upgrade to Pro for unlimited analyses.');
      return;
    }

    this.fileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.submit(base64);
    };
    reader.readAsDataURL(file);
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
        this.error.set(err.message || 'Something went wrong.');
        this.loading.set(false);
      }
    });
  }
}
