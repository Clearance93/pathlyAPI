import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PsychometricService } from '../services/psychometric.service';
import { riasecKey } from '../services/app-storage';
import {
  FullAssessmentResult,
  RiasecKey,
  RiasecResult,
  RatingQuestion,
  TrueFalseQuestion,
  McQuestion,
  McOption,
  TypeInsight,
  CareerMatchInsight,
  RATING_QUESTIONS,
  TF_QUESTIONS,
  MC_QUESTIONS,
  TYPE_META,
  TYPE_DETAIL,
  scoreBand,
} from './assessment.data';

type Phase = 'rating' | 'truefalse' | 'multichoice' | 'results';

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  constructor(
    private auth: AuthService,
    private psychometricApi: PsychometricService,
    private router: Router,
  ) {}

  readonly scaleLabels = ['Not at all like me', 'Slightly like me', 'Somewhat like me', 'Mostly like me', 'Very much like me'];
  readonly totalQuestions = RATING_QUESTIONS.length + TF_QUESTIONS.length + MC_QUESTIONS.length;
  readonly mcQuestions = MC_QUESTIONS;

  readonly ratingGroups = [
    { key: 'R' as RiasecKey, label: 'Realistic — The Doer',         emoji: '🔧', questions: RATING_QUESTIONS.filter(q => q.type === 'R') },
    { key: 'I' as RiasecKey, label: 'Investigative — The Thinker',  emoji: '🔬', questions: RATING_QUESTIONS.filter(q => q.type === 'I') },
    { key: 'A' as RiasecKey, label: 'Artistic — The Creator',        emoji: '🎨', questions: RATING_QUESTIONS.filter(q => q.type === 'A') },
    { key: 'S' as RiasecKey, label: 'Social — The Helper',           emoji: '🤝', questions: RATING_QUESTIONS.filter(q => q.type === 'S') },
    { key: 'E' as RiasecKey, label: 'Enterprising — The Persuader',  emoji: '🚀', questions: RATING_QUESTIONS.filter(q => q.type === 'E') },
    { key: 'C' as RiasecKey, label: 'Conventional — The Organizer',  emoji: '📋', questions: RATING_QUESTIONS.filter(q => q.type === 'C') },
  ];

  readonly tfGroups = [
    { key: 'R' as RiasecKey, label: 'Realistic — True or False',        emoji: '🔧', questions: TF_QUESTIONS.filter(q => q.type === 'R') },
    { key: 'I' as RiasecKey, label: 'Investigative — True or False',     emoji: '🔬', questions: TF_QUESTIONS.filter(q => q.type === 'I') },
    { key: 'A' as RiasecKey, label: 'Artistic — True or False',          emoji: '🎨', questions: TF_QUESTIONS.filter(q => q.type === 'A') },
    { key: 'S' as RiasecKey, label: 'Social — True or False',            emoji: '🤝', questions: TF_QUESTIONS.filter(q => q.type === 'S') },
    { key: 'E' as RiasecKey, label: 'Enterprising — True or False',      emoji: '🚀', questions: TF_QUESTIONS.filter(q => q.type === 'E') },
    { key: 'C' as RiasecKey, label: 'Conventional — True or False',      emoji: '📋', questions: TF_QUESTIONS.filter(q => q.type === 'C') },
  ];

  computeResult(
    phase: Phase,
    ratingAnswers: Record<number, number>,
    tfAnswers: Record<number, boolean | null>,
    mcAnswers: Record<number, RiasecKey>,
  ): FullAssessmentResult | null {
    if (phase !== 'results') return null;

    const raw: RiasecResult = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    for (const q of RATING_QUESTIONS) raw[q.type] += (ratingAnswers[q.id] ?? 0) * 3;
    for (const q of TF_QUESTIONS) if (tfAnswers[q.id] === true) raw[q.type] += 2;
    for (const q of MC_QUESTIONS) {
      const chosen = mcAnswers[q.id];
      if (chosen) raw[chosen] += 4;
    }

    const MAX = 126;
    const pct: RiasecResult = {
      R: Math.min(100, Math.round((raw.R / MAX) * 100)),
      I: Math.min(100, Math.round((raw.I / MAX) * 100)),
      A: Math.min(100, Math.round((raw.A / MAX) * 100)),
      S: Math.min(100, Math.round((raw.S / MAX) * 100)),
      E: Math.min(100, Math.round((raw.E / MAX) * 100)),
      C: Math.min(100, Math.round((raw.C / MAX) * 100)),
    };

    const sorted = (Object.keys(pct) as RiasecKey[]).sort((a, b) => pct[b] - pct[a]);
    const topTypes = sorted.slice(0, 3);
    const top1 = topTypes[0];
    const top2 = topTypes[1];

    const detailedInsights = this.buildInsights(sorted, pct);
    const careerMatches = this.buildCareerMatches(topTypes, pct);
    const workStyleSummary = this.buildWorkStyleSummary(topTypes, pct);
    const developmentAreas = this.buildDevelopmentAreas(sorted, pct);

    const careerSuggestions = careerMatches.slice(0, 6).map(c => c.title);

    const strengthSummary =
      `You show the strongest alignment with ${TYPE_META[top1].label} (${pct[top1]}%) ` +
      `and ${TYPE_META[top2].label} (${pct[top2]}%). ` +
      `Across all three question types — your preferences, your self-beliefs and your real-world choices — ` +
      `these two dimensions came through consistently.`;

    const conclusion = this.buildConclusion(topTypes, pct);

    const profile: FullAssessmentResult = {
      scores: pct,
      topTypes,
      completedAt: new Date().toISOString(),
      conclusion,
      careerSuggestions,
      strengthSummary,
      detailedInsights,
      workStyleSummary,
      developmentAreas,
      careerMatches,
    };

    const key = this.storageKey();
    if (key && typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, JSON.stringify(profile)); } catch { /* best-effort cache */ }
    }

    return profile;
  }

  private buildInsights(sorted: RiasecKey[], scores: RiasecResult): TypeInsight[] {
    return sorted.map(key => {
      const meta = TYPE_META[key];
      const detail = TYPE_DETAIL[key];
      const score = scores[key];
      return {
        key,
        label: meta.label,
        emoji: meta.emoji,
        score,
        band: scoreBand(score),
        summary: detail.summary,
        workEnvironment: detail.workEnvironment,
        strengths: detail.strengths,
        watchOuts: detail.watchOuts,
      };
    });
  }

  private buildCareerMatches(topTypes: RiasecKey[], scores: RiasecResult): CareerMatchInsight[] {
    const matches: CareerMatchInsight[] = [];
    const seen = new Set<string>();

    const primary = topTypes[0];
    const secondary = topTypes[1];

    TYPE_META[primary].careers.slice(0, 5).forEach((title, i) => {
      if (seen.has(title)) return;
      seen.add(title);
      matches.push({
        title,
        reason: `Strong fit with your dominant ${TYPE_META[primary].label} profile — ${TYPE_DETAIL[primary].summary}`,
        alignment: Math.max(60, scores[primary] - i * 4),
      });
    });

    TYPE_META[secondary].careers.slice(0, 3).forEach((title, i) => {
      if (seen.has(title)) return;
      seen.add(title);
      matches.push({
        title,
        reason: `Also supported by your ${TYPE_META[secondary].label} dimension (${scores[secondary]}%).`,
        alignment: Math.max(50, scores[secondary] - i * 4),
      });
    });

    return matches;
  }

  private buildWorkStyleSummary(topTypes: RiasecKey[], scores: RiasecResult): string {
    const [a, b] = topTypes;
    return `You are likely to do your best work in roles that combine ${TYPE_META[a].label.toLowerCase()} work with ` +
      `${TYPE_META[b].label.toLowerCase()} thinking. ${TYPE_DETAIL[a].workEnvironment} A role that lets you ` +
      `${TYPE_DETAIL[a].strengths[0].toLowerCase()} while also drawing on your ${TYPE_META[b].label.toLowerCase()} side ` +
      `is likely to keep you engaged. Remember these are tendencies, not limits — skills and interests grow with experience.`;
  }

  private buildDevelopmentAreas(sorted: RiasecKey[], scores: RiasecResult): string[] {
    const weakest = sorted.slice(-2).reverse();
    const areas: string[] = [];

    for (const key of weakest) {
      areas.push(`${TYPE_META[key].label} (${scores[key]}%): ${TYPE_DETAIL[key].watchOuts[0]}`);
    }

    areas.push('Balance your strongest preferences with the quieter dimensions — most real careers need a mix of skills.');
    return areas;
  }

  private buildConclusion(topTypes: RiasecKey[], scores: RiasecResult): string {
    const t1 = TYPE_META[topTypes[0]];
    const t2 = TYPE_META[topTypes[1]];
    const s1 = scores[topTypes[0]];
    const s2 = scores[topTypes[1]];
    const band = scoreBand(s1).toLowerCase();

    return `Your assessment results show a ${band} preference for ${t1.label} (${t1.emoji}) at ${s1}%, ` +
      `alongside a ${TYPE_META[topTypes[2]].label} and ${t2.label} leaning. ` +
      `${TYPE_DETAIL[topTypes[0]].summary} Combined with your academic results, this gives Pathly a fuller ` +
      `picture of not just what you are academically prepared for, but the kind of work that is likely to suit ` +
      `the way you think and what motivates you. Use this as a guide for exploration — not a fixed label.`;
  }

  submitAssessment(
    ratingAnswers: Record<number, number>,
    tfAnswers: Record<number, boolean | null>,
    mcAnswers: Record<number, RiasecKey>,
    result: FullAssessmentResult,
    onStoreError: () => void,
  ): void {
    const user = this.auth.currentUser();
    if (!user?.id) {
      onStoreError();
      return;
    }
    if (!result) return;

    const scores = result.scores;
    const profile = {
      realistic: scores.R,
      investigative: scores.I,
      artistic: scores.A,
      social: scores.S,
      enterprising: scores.E,
      conventional: scores.C,
    };

    const trueFalseAnswers: Record<string, boolean> = {};
    for (const [id, answer] of Object.entries(tfAnswers)) {
      if (answer !== null && answer !== undefined) trueFalseAnswers[id] = answer;
    }

    // The server takes the owning account from the JWT, so the stored assessment can never be
    // filed against a different user even if this id were tampered with.
    this.psychometricApi.submitAssessment({
      userId: user.id,
      ratingAnswers: { ...ratingAnswers },
      trueFalseAnswers,
      multipleChoiceAnswers: { ...mcAnswers },
      profile,
    }).subscribe({
      error: () => onStoreError(),
    });
  }

  /** Per-account storage key, so one learner's assessment never loads for another. */
  private storageKey(): string | null {
    const userId = this.auth.currentUserId();
    return userId ? riasecKey(userId) : null;
  }

  getStoredResult(): FullAssessmentResult | null {
    const key = this.storageKey();
    if (!key || typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }

  clearStoredResult(): void {
    const key = this.storageKey();
    if (key && typeof localStorage !== 'undefined') localStorage.removeItem(key);
  }

  goToDashboard(): void {
    this.router.navigate(['/analyze']);
  }

  getScore(scores: RiasecResult, key: string): number { return scores[key as RiasecKey] ?? 0; }
  getTypeColor(key: string): string  { return TYPE_META[key]?.color ?? '#a78bfa'; }
  getTypeLabel(key: string): string  { return TYPE_META[key]?.label ?? key; }
  getTypeEmoji(key: string): string  { return TYPE_META[key]?.emoji ?? ''; }
  getTypeDesc(key: string): string   { return TYPE_META[key]?.desc ?? ''; }
  getTypeCareers(key: string): string[] { return TYPE_META[key]?.careers ?? []; }
}
