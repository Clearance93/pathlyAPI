import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SubscriptionService, Plan } from '../services/subscription.service';
import { BillingService } from '../services/billing.service';

@Component({
  selector: 'app-payment',
  imports: [CommonModule, RouterLink],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  sub = inject(SubscriptionService);
  private billing = inject(BillingService);

  plan = (this.route.snapshot.queryParamMap.get('plan') ?? 'pro') as Plan;

  planDetails: Record<string, { name: string; price: string; amount: number; features: string[] }> = {
    pro: {
      name: 'Pro',
      price: 'R99',
      amount: 99,
      features: ['Unlimited analyses', 'All 5 career matches', 'Full AI feedback', 'Strengths & weaknesses', 'Alternative careers']
    },
    school: {
      name: 'School',
      price: 'R499',
      amount: 499,
      features: ['Everything in Pro', 'Up to 500 students', 'Bulk upload', 'Teacher dashboard', 'Priority support']
    }
  };

  error = signal('');
  loading = signal(false);
  success = signal(false);
  paymentsUnavailable = signal(false);

  submit(): void {
    this.loading.set(true);
    this.error.set('');

    this.billing.startCheckout(this.plan).subscribe({
      next: (res) => {
        this.loading.set(false);

        if (res.success && res.authorizationUrl) {
          window.location.href = res.authorizationUrl;
        } else {
          this.paymentsUnavailable.set(true);
        }
      },
      error: () => {
        this.loading.set(false);
        this.paymentsUnavailable.set(true);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/analyze']);
  }
}
