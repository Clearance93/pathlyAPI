import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SubscriptionService, Plan, normalizePlan } from '../services/subscription.service';
import { BillingService } from '../services/billing.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-payment',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  sub = inject(SubscriptionService);
  private billing = inject(BillingService);

  /** Accepts the new tier codes and the legacy `pro`/`school` codes. */
  plan: Plan = normalizePlan(this.route.snapshot.queryParamMap.get('plan'));

  planDetails: Record<Plan, { name: string; price: string; amount: number; features: string[] }> = {
    free: {
      name: 'Free',
      price: 'R0',
      amount: 0,
      features: ['Full app access', '1 sample item per report section', 'Academic report preview', 'No psychometrics']
    },
    standard: {
      name: 'Standard',
      price: 'R49',
      amount: 49,
      features: [
        'Complete academic (student) report',
        'All career matches and sections',
        'Subjects, APS analysis and study tips',
        'Academic report only — no psychometrics'
      ]
    },
    premium: {
      name: 'Premium',
      price: 'R99',
      amount: 99,
      features: [
        'Everything in Standard',
        'Career Interest (psychometric) assessment',
        'All interest dimensions unlocked',
        'Combined academic + interest report'
      ]
    }
  };

  error = signal('');
  loading = signal(false);
  success = signal(false);
  paymentsUnavailable = signal(false);
  /** True when this deployment can activate a plan without the payment provider (dev only). */
  devActivationAvailable = signal(false);
  /** True when the API is on Paystack test keys, so no real money will be charged. */
  testMode = signal(false);

  constructor() {
    // There is nothing to check out on the free tier.
    if (this.plan === 'free') {
      this.router.navigate(['/upgrade']);
      return;
    }

    // Ask the API what this deployment supports before rendering the checkout actions.
    this.billing.getConfig().subscribe({
      next: (config) => {
        this.devActivationAvailable.set(environment.allowDevUpgrades && config.devActivationEnabled);
        this.testMode.set(!!config.isTestMode);
        if (!config.paymentsEnabled) {
          this.paymentsUnavailable.set(true);
        }
      },
      // If the config probe fails, fall back to trying checkout normally.
      error: () => this.devActivationAvailable.set(false)
    });
  }

  submit(): void {
    this.loading.set(true);
    this.error.set('');

    this.billing.startCheckout(this.plan).subscribe({
      next: (res) => {
        this.loading.set(false);

        if (res.success && res.authorizationUrl) {
          window.location.href = res.authorizationUrl;
        } else if (res.success) {
          // A paid plan is only ever granted after Paystack confirms the charge (callback +
          // server-side verify). A "success" with no payment page is a misbehaving API, so
          // never show an upgrade the user has not paid for.
          this.error.set('We could not open the payment page. Please try again in a moment.');
        } else {
          this.paymentsUnavailable.set(true);
        }
      },
      error: (err) => {
        this.loading.set(false);

        if (err?.status === 401) {
          // Session expired: send them to log in rather than claiming checkout is down.
          this.router.navigate(['/login'], { queryParams: { returnUrl: `/payment?plan=${this.plan}` } });
        } else if (err?.status === 503 || err?.status === 0) {
          this.paymentsUnavailable.set(true);
        } else {
          this.error.set(err?.error?.message ?? 'We could not start the payment. Please try again.');
        }
      }
    });
  }

  /** Development-only: activate the selected plan directly, skipping the payment provider. */
  activateForDevelopment(): void {
    this.loading.set(true);
    this.error.set('');

    this.billing.devActivate(this.plan).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.completeUpgrade(res.planCode ?? this.plan);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Could not activate that plan. Please try again.');
      }
    });
  }

  private completeUpgrade(planCode: string): void {
    // Adopt the server's tier immediately so guards, the navbar and the report pick it up.
    this.auth.updatePlan(planCode);
    this.success.set(true);
    setTimeout(() => this.router.navigate(['/analyze']), 1800);
  }

  goBack(): void {
    this.router.navigate(['/analyze']);
  }
}
