import { Component, inject, signal, HostListener } from '@angular/core';
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
  styleUrls: ['./upload.component.css']
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
  dragOver = signal(false);
  expandedCareer = signal<number | null>(null);
  expandedAlt = signal<number | null>(null);
  activeTab = signal<'careers' | 'demand' | 'outlook' | 'insights'>('careers');

  loadingStep = signal(0);
  readonly loadingSteps = [
    'Uploading your results...',
    'Reading subjects and marks...',
    'Calculating your APS...',
    'Building your academic profile...',
    'Matching careers to your profile...',
    'Analyzing career demand and growth...',
    'Preparing your career intelligence report...'
  ];

  private stepInterval: ReturnType<typeof setInterval> | null = null;

  get isFree()   { return false; }
  get isPro()    { return true; }
  get isSchool() { return false; }

  get visibleBestCareers(): CareerMatch[]                  { return this.result()?.topFiveBestCareers ?? []; }
  get visibleAltCareers(): CareerMatch[]                   { return this.result()?.topFiveAlternativeCareer ?? []; }
  get visibleDemandingJobs(): DemandingCareerAssessment[]  { return this.result()?.topDemandingJobs ?? []; }
  get visibleDyingCareers(): DyingCareerWarning[]          { return this.result()?.dyingCareers ?? []; }
  get visibleOutlook(): EmploymentOutlook[]                { return this.result()?.employmentOutlookAfterGraduation ?? []; }
  get visibleSubjects(): SubjectResult[]                   { return this.result()?.subjectResults ?? []; }

  @HostListener('dragover', ['$event'])
  onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver.set(true); }

  @HostListener('dragleave', ['$event'])
  onDragLeave(e: DragEvent) { this.dragOver.set(false); }

  @HostListener('drop', ['$event'])
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File): void {
    const MAX_MB = 1.5;
    if (file.size > MAX_MB * 1024 * 1024) {
      this.error.set(`File too large. Please upload under ${MAX_MB}MB.`);
      return;
    }
    this.fileName.set(file.name);
    if (file.type.startsWith('image/')) {
      this.compressImage(file).then(base64 => this.submit(base64, 'image/jpeg', file.name));
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.submit(base64, file.type, file.name);
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
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
      img.src = url;
    });
  }

  private restoreResult(): AiResponse | null {
    const saved = sessionStorage.getItem(this.RESULT_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  private startLoadingSteps(): void {
    this.loadingStep.set(0);
    this.stepInterval = setInterval(() => {
      const next = this.loadingStep() + 1;
      if (next < this.loadingSteps.length - 1) {
        this.loadingStep.set(next);
      }
    }, 3500);
  }

  private stopLoadingSteps(): void {
    if (this.stepInterval) { clearInterval(this.stepInterval); this.stepInterval = null; }
    this.loadingStep.set(this.loadingSteps.length - 1);
  }

  private submit(base64: string, mimeType: string, fileName?: string): void {
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);
    this.startLoadingSteps();

    this.service.analyzeResults(base64, mimeType, fileName).subscribe({
      next: (res) => {
        this.stopLoadingSteps();
        this.result.set(res);
        sessionStorage.setItem(this.RESULT_KEY, JSON.stringify(res));
        this.loading.set(false);
        this.sub.recordUsage();
        this.sub.recordIp();
      },
      error: (err) => {
        this.stopLoadingSteps();
        if (err.status === 413) {
          this.error.set("We couldn't read your file — it's too large. Please use a smaller or compressed image.");
        } else if (err.status === 429) {
          this.error.set("Our AI is currently busy. Please wait a moment and try again.");
        } else if (err.status === 0) {
          this.error.set("We couldn't connect to the analysis service. Please check your connection and try again.");
        } else {
          this.error.set("We couldn't complete your career analysis right now. Please try again.");
        }
        this.loading.set(false);
      }
    });
  }

  toggleCareer(i: number): void {
    this.expandedCareer.set(this.expandedCareer() === i ? null : i);
  }

  toggleAlt(i: number): void {
    this.expandedAlt.set(this.expandedAlt() === i ? null : i);
  }

  clearResult(): void {
    this.result.set(null);
    this.fileName.set('');
    this.error.set('');
    sessionStorage.removeItem(this.RESULT_KEY);
  }

  getMatchLabel(pct: number): string {
    if (pct >= 88) return 'Strong Match';
    if (pct >= 75) return 'Good Match';
    if (pct >= 60) return 'Worth Exploring';
    return 'Alternative Pathway';
  }

  getMatchClass(pct: number): string {
    if (pct >= 88) return 'match-strong';
    if (pct >= 75) return 'match-good';
    return 'match-explore';
  }
}
