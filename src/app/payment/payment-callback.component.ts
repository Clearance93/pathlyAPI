import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BillingService } from '../services/billing.service';
import { AuthService } from '../services/auth.service';
import { SubscriptionService } from '../services/subscription.service';

/**
 * Landing page after the payment provider redirects back. Confirms the charge with the API
 * (which is idempotent and also covered by the webhook) and refreshes the local plan so the
 * rest of the app immediately reflects the upgrade.
 */
@Component({
  selector: 'app-payment-callback',
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-callback.component.html',
  styleUrl: './payment-callback.component.css'
})
export class PaymentCallbackComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private billing = inject(BillingService);
  private auth = inject(AuthService);
  sub = inject(SubscriptionService);

  loading = signal(true);
  success = signal(false);
  error = signal('');
  planName = signal('');

  constructor() {
    // Paystack appends both `reference` and `trxref`; accept either.
    const reference = this.route.snapshot.queryParamMap.get('reference')
      ?? this.route.snapshot.queryParamMap.get('trxref')
      ?? '';

    if (!reference) {
      this.loading.set(false);
      this.error.set('No payment reference was supplied.');
      return;
    }

    this.billing.verifyCheckout(reference).subscribe({
      next: (res) => {
        this.loading.set(false);

        if (!res.success) {
          this.error.set(res.message ?? 'We could not confirm that payment yet.');
          return;
        }

        this.auth.updatePlan(res.planCode ?? '');
        this.planName.set(res.planName ?? 'your new plan');
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/analyze']), 2200);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.error?.message
          ?? 'We could not confirm that payment yet. If you were charged, your plan will activate shortly.'
        );
      }
    });
  }
}
