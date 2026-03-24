import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export type Plan = 'free' | 'pro' | 'school';

const USAGE_KEY  = 'pathly_free_usage';
const IP_KEY     = 'pathly_used_ips';
const FREE_LIMIT = 2;

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  usageCount = signal<number>(Number(localStorage.getItem(USAGE_KEY) ?? 0));

  plan         = computed(() => this.auth.plan());
  isPro        = computed(() => this.auth.isPro());
  isLoggedIn   = computed(() => this.auth.isLoggedIn());
  analysesLeft = computed(() => Math.max(0, FREE_LIMIT - this.usageCount()));
  canAnalyze   = computed(() => this.isPro() || this.usageCount() < FREE_LIMIT);

  recordUsage(): void {
    const next = this.usageCount() + 1;
    this.usageCount.set(next);
    localStorage.setItem(USAGE_KEY, String(next));
  }

  recordIp(): void {
    this.http.get<{ ip: string }>('https://api.ipify.org?format=json').subscribe({
      next: ({ ip }) => {
        const used: string[] = JSON.parse(localStorage.getItem(IP_KEY) ?? '[]');
        if (!used.includes(ip)) {
          used.push(ip);
          localStorage.setItem(IP_KEY, JSON.stringify(used));
        }
      }
    });
  }

  hasUsedFreeFromThisIp(): Promise<boolean> {
    return this.http.get<{ ip: string }>('https://api.ipify.org?format=json')
      .toPromise()
      .then(res => {
        const used: string[] = JSON.parse(localStorage.getItem(IP_KEY) ?? '[]');
        return used.includes(res!.ip);
      })
      .catch(() => false);
  }

  resetUsage(): void {
    this.usageCount.set(0);
    localStorage.setItem(USAGE_KEY, '0');
  }

  logout(): void {
    this.auth.logout();
  }
}
