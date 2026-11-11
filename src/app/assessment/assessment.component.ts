import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AssessmentDraft, AssessmentService } from './assessment.service';
import { FullAssessmentResult, McQuestion } from './assessment.data';
import { AuthService } from '../services/auth.service';
import { PsychometricService } from '../services/psychometric.service';

@Component({
  selector: 'app-assessment',
  imports: [CommonModule],
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.css'
})
export class AssessmentComponent {

  private service = inject(AssessmentService);
  private auth = inject(AuthService);
  private psychometricApi = inject(PsychometricService);
  private destroyRef = inject(DestroyRef);

  readonly scaleLabels = this.service.scaleLabels;
  readonly totalQuestions = this.service.totalQuestions;
  readonly ratingGroups = this.service.ratingGroups;
  readonly tfGroups = this.service.tfGroups;
  readonly mcQuestions = this.service.mcQuestions;

  phase = signal<'rating' | 'truefalse' | 'multichoice' | 'results'>('rating');
  ratingGroup = signal(0);
  tfGroup = signal(0);
  ratingAnswers = signal<Record<number, number>>({});
  tfAnswers = signal<Record<number, boolean | null>>({});
  mcAnswers = signal<Record<number, 'R' | 'I' | 'A' | 'S' | 'E' | 'C'>>({});
  storeError = signal(false);
  restoring = signal(false);

  constructor() {
    const draft = this.service.getDraft();
    if (draft) {
      this.restoreDraft(draft);
      return;
    }

    if (!this.auth.isLoggedIn()) return;
    this.restoring.set(true);
    this.psychometricApi.getLatest().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: saved => {
        const result = this.parseStoredResult(saved.reportJson) ?? this.service.getStoredResult();
        if (result) {
          this.ratingAnswers.set({ ...saved.ratingAnswers } as Record<number, number>);
          this.tfAnswers.set({ ...saved.trueFalseAnswers } as Record<number, boolean | null>);
          this.mcAnswers.set({ ...saved.multipleChoiceAnswers } as Record<number, 'R' | 'I' | 'A' | 'S' | 'E' | 'C'>);
          this.phase.set('results');
          // Keep the full server report in the account-scoped cache for offline reopening.
          this.service.computeResult('results', this.ratingAnswers(), this.tfAnswers(), this.mcAnswers());
          if (!saved.reportJson) this.service.clearDraft();
          this.restoredResult.set(result);
        }
        this.restoring.set(false);
      },
      error: () => {
        const result = this.service.getStoredResult();
        if (result) {
          this.restoredResult.set(result);
          this.phase.set('results');
        }
        this.restoring.set(false);
      }
    });
  }

  private restoredResult = signal<FullAssessmentResult | null>(null);

  private parseStoredResult(raw?: string | null): FullAssessmentResult | null {
    if (!raw) return null;
    try { return JSON.parse(raw) as FullAssessmentResult; } catch { return null; }
  }

  private restoreDraft(draft: AssessmentDraft): void {
    this.phase.set(draft.phase);
    this.ratingGroup.set(draft.ratingGroup ?? 0);
    this.tfGroup.set(draft.tfGroup ?? 0);
    this.ratingAnswers.set(draft.ratingAnswers ?? {});
    this.tfAnswers.set(draft.tfAnswers ?? {});
    this.mcAnswers.set(draft.mcAnswers ?? {});
  }

  private persistDraft(): void {
    const phase = this.phase();
    if (phase === 'results') return;
    this.service.saveDraft({
      phase,
      ratingGroup: this.ratingGroup(),
      tfGroup: this.tfGroup(),
      ratingAnswers: this.ratingAnswers(),
      tfAnswers: this.tfAnswers(),
      mcAnswers: this.mcAnswers(),
    });
  }

  /** Scrolls to the top of the page after Angular has rendered the new section.
   *  'instant' bypasses the global smooth-scroll, whose animation was getting
   *  cancelled by the re-render and left the page mid-way down. */
  private scrollTop() {
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  }

  overallProgress = computed(() => {
    const rDone = Object.keys(this.ratingAnswers()).length;
    const tDone = Object.keys(this.tfAnswers()).length;
    const mDone = Object.keys(this.mcAnswers()).length;
    return Math.round(((rDone + tDone + mDone) / this.totalQuestions) * 100);
  });

  currentRatingGroupAnswered = computed(() =>
    this.ratingGroups[this.ratingGroup()].questions.every(q => this.ratingAnswers()[q.id] !== undefined)
  );

  setRating(id: number, score: number) { this.ratingAnswers.update(a => ({ ...a, [id]: score })); this.persistDraft(); }
  getRating(id: number): number { return this.ratingAnswers()[id] ?? 0; }

  nextRatingGroup() {
    if (this.ratingGroup() < this.ratingGroups.length - 1) {
      this.ratingGroup.update(g => g + 1);
    } else {
      this.phase.set('truefalse');
      this.tfGroup.set(0);
    }
    this.persistDraft();
    this.scrollTop();
  }

  prevRatingGroup() {
    if (this.ratingGroup() > 0) this.ratingGroup.update(g => g - 1);
    this.persistDraft();
    this.scrollTop();
  }

  currentTfGroupAnswered = computed(() =>
    this.tfGroups[this.tfGroup()].questions.every(q => this.tfAnswers()[q.id] !== undefined)
  );

  setTf(id: number, val: boolean) { this.tfAnswers.update(a => ({ ...a, [id]: val })); this.persistDraft(); }
  getTf(id: number): boolean | null { return this.tfAnswers()[id] ?? null; }

  nextTfGroup() {
    if (this.tfGroup() < this.tfGroups.length - 1) {
      this.tfGroup.update(g => g + 1);
    } else {
      this.phase.set('multichoice');
    }
    this.persistDraft();
    this.scrollTop();
  }

  prevTfGroup() {
    if (this.tfGroup() > 0) {
      this.tfGroup.update(g => g - 1);
    } else {
      this.phase.set('rating');
      this.ratingGroup.set(this.ratingGroups.length - 1);
    }
    this.persistDraft();
    this.scrollTop();
  }

  allMcAnswered = computed(() => this.mcQuestions.every((q: McQuestion) => this.mcAnswers()[q.id] !== undefined));

  setMc(id: number, type: 'R' | 'I' | 'A' | 'S' | 'E' | 'C') { this.mcAnswers.update(a => ({ ...a, [id]: type })); this.persistDraft(); }
  getMc(id: number): 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | null { return this.mcAnswers()[id] ?? null; }

  prevMc() {
    this.phase.set('truefalse');
    this.tfGroup.set(this.tfGroups.length - 1);
    this.persistDraft();
    this.scrollTop();
  }

  result = computed(() => this.restoredResult() ?? this.service.computeResult(this.phase(), this.ratingAnswers(), this.tfAnswers(), this.mcAnswers()));

  sortedTypes = computed(() => {
    const r = this.result();
    if (!r) return [] as ('R' | 'I' | 'A' | 'S' | 'E' | 'C')[];
    return (Object.keys(r.scores) as ('R' | 'I' | 'A' | 'S' | 'E' | 'C')[]).sort((a, b) => r.scores[b] - r.scores[a]);
  });

  submitAssessment() {
    this.service.clearDraft();
    this.phase.set('results');
    this.scrollTop();
    this.service.submitAssessment(this.ratingAnswers(), this.tfAnswers(), this.mcAnswers(), this.result()!, () => this.storeError.set(true));
  }

  retake() {
    this.ratingAnswers.set({});
    this.tfAnswers.set({});
    this.mcAnswers.set({});
    this.restoredResult.set(null);
    this.ratingGroup.set(0);
    this.tfGroup.set(0);
    this.phase.set('rating');
    this.service.clearStoredResult();
    this.service.clearDraft();
    this.scrollTop();
  }

  goToDashboard() { this.service.goToDashboard(); }

  getScore(scores: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number>, key: string): number { return this.service.getScore(scores, key); }
  getTypeColor(key: string): string  { return this.service.getTypeColor(key); }
  getTypeLabel(key: string): string  { return this.service.getTypeLabel(key); }
  getTypeEmoji(key: string): string  { return this.service.getTypeEmoji(key); }
  getTypeDesc(key: string): string   { return this.service.getTypeDesc(key); }
  getTypeCareers(key: string): string[] { return this.service.getTypeCareers(key); }
}
