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
  message?: string;
}

export interface UsageSummary {
  planCode: string;
  planName: string;
  analysesUsedThisMonth: number;
  monthlyAnalysisQuota: number | null;
  psychometricSubmissionsThisMonth: number;
  monthlyPsychometricQuota: number | null;
  premiumAnalysisUnlocked: boolean;
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

  /** The logged-in user's live entitlement state straight from the billing engine. */
  getUsage(): Observable<UsageSummary> {
    return this.http.get<UsageSummary>(`${this.base}/usage`);
  }

  /** Starts a hosted checkout session; redirect the browser to authorizationUrl. */
  startCheckout(planCode: string): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.base}/checkout/${planCode}`, {});
  }
}
