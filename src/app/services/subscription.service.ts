import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type Plan = 'free' | 'pro' | 'school';

const USAGE_KEY = 'pathly_free_usage';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private auth = inject(AuthService);

  usageCount = signal<number>(Number(localStorage.getItem(USAGE_KEY) ?? 0));

  plan       = computed(() => this.auth.plan());
  isPro      = computed(() => this.auth.isPro());
  isLoggedIn = computed(() => this.auth.isLoggedIn());

  recordUsage(): void {
    const next = this.usageCount() + 1;
    this.usageCount.set(next);
    localStorage.setItem(USAGE_KEY, String(next));
  }

  resetUsage(): void {
    this.usageCount.set(0);
    localStorage.setItem(USAGE_KEY, '0');
  }
}
