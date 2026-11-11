import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Plan {
  code: string;
  name: string;
  description?: string;
  audience: 'individual' | 'student' | 'professional' | 'organization';
  interval: 'oneOff' | 'monthly' | 'annually';
  priceInCents: number;
  currency: string;
  includesPremiumAnalysis: boolean;
}

export interface CheckoutResponse {
  success: boolean;
  authorizationUrl?: string;
  reference?: string;
  planCode?: string;
  planName?: string;
  message?: string;
}

/** What this deployment can do at checkout time. */
export interface BillingConfig {
  paymentsEnabled: boolean;
  devActivationEnabled: boolean;
}

export interface UsageSummary {
  planCode: string;
  planName: string;
  analysesUsedThisMonth: number;
  monthlyAnalysisQuota: number | null;
  psychometricSubmissionsThisMonth: number;
  monthlyPsychometricQuota: number | null;
  premiumAnalysisUnlocked: boolean;
  psychometricsUnlocked?: boolean;
  creditBalance: number;
  currentPeriodEndUtc?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Billing`;

  /** The public pricing catalogue. */
  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${environment.apiUrl}/Plans`);
  }

  /** Whether real payments and/or direct (development) activation are available. */
  getConfig(): Observable<BillingConfig> {
    return this.http.get<BillingConfig>(`${this.base}/config`);
  }

  /** The logged-in user's live entitlement state straight from the billing engine. */
  getUsage(): Observable<UsageSummary> {
    return this.http.get<UsageSummary>(`${this.base}/usage`);
  }

  /** Starts a hosted checkout session; redirect the browser to authorizationUrl. */
  startCheckout(planCode: string): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.base}/checkout/${planCode}`, {});
  }

  /** Confirms a payment after the provider redirects back to the SPA. */
  verifyCheckout(reference: string): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.base}/verify/${encodeURIComponent(reference)}`, {});
  }

  /**
   * Development-only direct activation, used when no payment provider is configured.
   * The API rejects this outside Development.
   */
  devActivate(planCode: string): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.base}/dev/activate/${planCode}`, {});
  }
}
