import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { AuthService } from './auth.service';
import { usageKey } from './app-storage';
import { Plan, normalizePlan } from './plan-tier';

export type { Plan, PlanCode } from './plan-tier';
export { normalizePlan } from './plan-tier';

const hasLocalStorage = typeof localStorage !== 'undefined';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private auth = inject(AuthService);

  /** Local UI hint only — the authoritative quota is enforced server-side. Namespaced per account. */
  usageCount = signal<number>(0);

  /** The normalised tier for the signed-in account. */
  plan       = computed<Plan>(() => normalizePlan(this.auth.plan()));
  isFree     = computed(() => this.plan() === 'free');
  isStandard = computed(() => this.plan() === 'standard');
  isPremium  = computed(() => this.plan() === 'premium');

  /** Any paying tier. Legacy alias kept for callers that only care "not free". */
  isPro      = computed(() => this.plan() !== 'free');

  /**
   * How many items each report section may show.
   * Free sees one sample of every section; paying tiers see everything.
   */
  previewLimit = computed(() => (this.isFree() ? 1 : Number.POSITIVE_INFINITY));

  /**
   * Psychometrics (the Career Interest Assessment and combined report) are a
   * Premium-only capability. Free sees a sample of the academic report only;
   * Standard covers the academic report in full.
   */
  canUsePsychometrics = computed(() => this.isPremium());

  isLoggedIn = computed(() => this.auth.isLoggedIn());

  constructor() {
    // Re-read the counter whenever the signed-in account changes, so a previous user's count
    // never shows for the next user (and it drops to 0 on logout).
    effect(() => {
      const userId = this.auth.currentUserId();
      if (!hasLocalStorage || !userId) {
        this.usageCount.set(0);
        return;
      }
      this.usageCount.set(Number(localStorage.getItem(usageKey(userId)) ?? 0));
    });
  }

  recordUsage(): void {
    const userId = this.auth.currentUserId();
    const next = this.usageCount() + 1;
    this.usageCount.set(next);
    if (hasLocalStorage && userId) localStorage.setItem(usageKey(userId), String(next));
  }

  resetUsage(): void {
    this.usageCount.set(0);
    const userId = this.auth.currentUserId();
    if (hasLocalStorage && userId) localStorage.setItem(usageKey(userId), '0');
  }
}
