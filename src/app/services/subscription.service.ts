import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { AuthService } from './auth.service';
import { usageKey } from './app-storage';

export type Plan = 'free' | 'pro' | 'school';

const hasLocalStorage = typeof localStorage !== 'undefined';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private auth = inject(AuthService);

  /** Local UI hint only — the authoritative quota is enforced server-side. Namespaced per account. */
  usageCount = signal<number>(0);

  plan       = computed(() => this.auth.plan());
  isPro      = computed(() => this.auth.isPro());
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
