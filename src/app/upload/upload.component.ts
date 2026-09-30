import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AcademicService } from '../services/academic.service';
import { AuthService } from '../services/auth.service';
import { SubscriptionService } from '../services/subscription.service';
import { BillingService } from '../services/billing.service';
import { PsychometricService, StoredPsychometricAssessment } from '../services/psychometric.service';
import { resultKey } from '../services/app-storage';
import { TYPE_META, RiasecKey } from '../assessment/assessment.data';
import {
  AiResponse, ApsTrendPoint, AnalysisHistoryItem,
  CareerMatch, DemandingCareerAssessment, DyingCareerWarning, EmploymentOutlook, SubjectResult
} from '../models/ai-response.model';

@Component({
  selector: 'app-upload',
  imports: [CommonModule, RouterLink],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  private service = inject(AcademicService);
  sub = inject(SubscriptionService);
  private billing = inject(BillingService);
  private psychometricApi = inject(PsychometricService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => this.stopLoadingSteps());
    this.restoreResult();
    this.loadPsychometric();
    this.loadHistory();
  }

  fileName = signal('');
  loading = signal(false);
  error = signal('');
  result = signal<AiResponse | null>(null);
  dragOver = signal(false);
  expandedCareer = signal<number | null>(null);
  expandedAlt = signal<number | null>(null);
  activeTab = signal<'careers' | 'demand' | 'outlook' | 'insights'>('careers');

  // Stored history (persisted per account on the server, so it survives cache clears/devices).
  history = signal<AnalysisHistoryItem[]>([]);
  apsTrend = signal<ApsTrendPoint[]>([]);
  historyLoading = signal(false);

  // Psychometric layer (the career assessment) for this account.
  psychometric = signal<StoredPsychometricAssessment | null>(null);
  combinedLoading = signal(false);
  combinedError = signal('');

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

  get visibleBestCareers(): CareerMatch[]                  { return this.result()?.topFiveBestCareers ?? []; }
  get visibleAltCareers(): CareerMatch[]                   { return this.result()?.topFiveAlternativeCareer ?? []; }
  get visibleDemandingJobs(): DemandingCareerAssessment[]  { return this.result()?.topDemandingJobs ?? []; }
  get visibleDyingCareers(): DyingCareerWarning[]          { return this.result()?.dyingCareers ?? []; }
  get visibleOutlook(): EmploymentOutlook[]                { return this.result()?.employmentOutlookAfterGraduation ?? []; }
  get visibleSubjects(): SubjectResult[]                   { return this.result()?.subjectResults ?? []; }

  /** Deterministic next-term projection from the multi-term history, when available. */
  prediction = computed(() => this.result()?.academicPrediction ?? null);

  /** Cross-upload progression across every stored upload (termly/yearly trends). */
  progression = computed(() => this.result()?.progression ?? null);

  private static readonly ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  private static readonly ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png'];

  /** Rejects unsupported uploads up front (not just by size), mirroring the server-side check. */
  private isSupportedFile(file: File): boolean {
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!UploadComponent.ALLOWED_EXT.includes(ext)) return false;
    // Some browsers/OSes leave file.type empty — fall back to the extension check above.
    return !file.type || UploadComponent.ALLOWED_MIME.includes(file.type.toLowerCase());
  }

  /** True when the report already fused the academic and psychometric layers. */
  isPremiumReport = computed(() => this.result()?.isPremium === true);

  extractionWarnings = computed(() => this.result()?.extractionWarnings ?? []);

  /** The learner's dominant RIASEC interests, for the dashboard's assessment panel. */
  topPsychometric = computed(() => {
    const profile = this.psychometric()?.profile;
    if (!profile) return [] as { key: RiasecKey; label: string; emoji: string; score: number }[];

    return ([
      { key: 'R' as RiasecKey, label: TYPE_META['R'].label, emoji: TYPE_META['R'].emoji, score: profile.realistic },
      { key: 'I' as RiasecKey, label: TYPE_META['I'].label, emoji: TYPE_META['I'].emoji, score: profile.investigative },
      { key: 'A' as RiasecKey, label: TYPE_META['A'].label, emoji: TYPE_META['A'].emoji, score: profile.artistic },
      { key: 'S' as RiasecKey, label: TYPE_META['S'].label, emoji: TYPE_META['S'].emoji, score: profile.social },
      { key: 'E' as RiasecKey, label: TYPE_META['E'].label, emoji: TYPE_META['E'].emoji, score: profile.enterprising },
      { key: 'C' as RiasecKey, label: TYPE_META['C'].label, emoji: TYPE_META['C'].emoji, score: profile.conventional },
    ]).sort((a, b) => b.score - a.score).slice(0, 3);
  });

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
    if (!this.isSupportedFile(file)) {
      this.error.set('Please upload a PDF or an image (JPG or PNG).');
      return;
    }
    this.fileName.set(file.name);
    if (file.type.startsWith('image/')) {
      this.compressImage(file).then(base64 => this.submit(base64, 'image/jpeg', file.name));
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        if (base64) this.submit(base64, file.type, file.name);
      };
      reader.onerror = () => {
        this.error.set('Failed to read file. Please try again.');
        this.loading.set(false);
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
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    });
  }

  /** The per-account cache key for the currently signed-in user (null when signed out). */
  private currentResultKey(): string | null {
    const userId = this.auth.currentUserId();
    return userId ? resultKey(userId) : null;
  }

  private restoreResult(): void {
    const key = this.currentResultKey();
    if (!key || typeof sessionStorage === 'undefined') return;
    const saved = sessionStorage.getItem(key);
    if (!saved) return;
    try {
      this.result.set(JSON.parse(saved));
    } catch {
      sessionStorage.removeItem(key);
    }
  }

  private storeResult(res: AiResponse): void {
    this.result.set(res);
    const key = this.currentResultKey();
    if (key && typeof sessionStorage !== 'undefined') {
      try { sessionStorage.setItem(key, JSON.stringify(res)); } catch { /* quota — cache is best-effort */ }
    }
  }

  /** Loads the server-side history for this account so results persist across devices/clears. */
  private loadHistory(): void {
    if (!this.auth.isLoggedIn()) return;

    this.service.getHistory().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.history.set(res.items ?? []);
        this.apsTrend.set(res.apsTrend ?? []);

        // Nothing cached locally? Restore the most recent stored report from the server.
        if (!this.result() && (res.items?.length ?? 0) > 0) {
          this.openHistoryItem(res.items[0].aiResponseId);
        }
      },
      error: () => { /* history is a convenience — never block the upload flow on it */ }
    });
  }

  openHistoryItem(aiResponseId: string): void {
    this.historyLoading.set(true);
    this.service.getResult(aiResponseId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => { this.storeResult(res); this.historyLoading.set(false); scrollTo(0, 0); },
      error: () => { this.historyLoading.set(false); this.error.set('We could not open that stored report. Please try again.'); }
    });
  }

  private loadPsychometric(): void {
    if (!this.auth.isLoggedIn()) return;

    this.psychometricApi.getLatest().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => this.psychometric.set(p),
      error: () => { /* no stored assessment yet — the dashboard shows the upsell */ }
    });
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

    this.service.analyzeResults(base64, mimeType, fileName).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.stopLoadingSteps();
        this.storeResult(res);
        this.prependHistory(res);
        this.loading.set(false);
        this.sub.recordUsage();
        this.refreshUsage();
      },
      error: (err) => {
        this.stopLoadingSteps();
        if (err.status === 402) {
          const detail = err.error?.message;
          this.error.set(detail
            ? `${detail} Visit the plans page to upgrade.`
            : "You've used all your free analyses for this month. Upgrade to keep going.");
        } else if (err.status === 413) {
          this.error.set("We couldn't read your file — it's too large. Please use a smaller or compressed image.");
        } else if (err.status === 429) {
          this.error.set("Our AI is currently busy. Please wait a moment and try again.");
        } else if (err.status === 401) {
          this.error.set("Your session has expired. Please log in again to continue.");
        } else if (err.status === 400) {
          // The backend gives specific, user-fixable extraction errors (unreadable scan, no subjects).
          this.error.set(err.error?.message ?? "We couldn't read that document. Please upload a clearer copy of your results.");
        } else if (err.status === 0) {
          this.error.set("We couldn't connect to the analysis service. Please check your connection and try again.");
        } else {
          this.error.set("We couldn't complete your career analysis right now. Please try again.");
        }
        this.loading.set(false);
      }
    });
  }

  /** Generates the combined (academic + psychometric) report from the account's stored data. */
  generateCombinedReport(): void {
    this.combinedError.set('');

    if (!this.sub.isPro()) {
      this.combinedError.set('Combined academic + interest reports are part of the Pro plan.');
      return;
    }

    this.combinedLoading.set(true);
    this.service.analyzeCombined().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.storeResult(res);
        this.prependHistory(res);
        this.combinedLoading.set(false);
        this.refreshUsage();
        scrollTo(0, 0);
      },
      error: err => {
        this.combinedLoading.set(false);
        if (err.status === 402) {
          this.combinedError.set(err.error?.message ?? 'Combined reports are part of the Pro plan.');
        } else if (err.status === 404) {
          this.combinedError.set(err.error?.message ?? 'Upload your results and complete the assessment first.');
        } else {
          this.combinedError.set('We could not generate the combined report right now. Please try again.');
        }
      }
    });
  }

  private prependHistory(res: AiResponse): void {
    if (!res.aiResponseId) return;

    const item: AnalysisHistoryItem = {
      aiResponseId: res.aiResponseId,
      extractionAcademicRecordId: res.extractionAcademicRecordId ?? null,
      generatedAt: res.generatedAt ?? new Date().toISOString(),
      studyLevel: res.grade ?? null,
      driverTermLabel: res.driverTermLabel ?? null,
      overallScore: res.overallScore,
      calculatedAps: res.apsAnalysis?.calculatedAPS ?? null,
      isPremium: res.isPremium ?? false,
      academicPersonality: res.academicPersonality ?? null,
    };

    this.history.update(list => [item, ...list.filter(h => h.aiResponseId !== item.aiResponseId)]);
  }

  /** Pulls authoritative month-to-date usage from the billing engine. */
  private refreshUsage(): void {
    this.billing.getUsage().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: summary => {
        if (summary.planCode !== 'free') {
          this.sub.resetUsage();
        }
      },
      error: () => { /* offline-tolerant: local counter stays as-is */ }
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
    const key = this.currentResultKey();
    if (key && typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key);
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

  formatHistoryDate(value: string): string {
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
