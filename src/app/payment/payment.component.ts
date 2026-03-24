import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SubscriptionService, Plan } from '../services/subscription.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-payment',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  sub = inject(SubscriptionService);
  private auth = inject(AuthService);

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

  card = {
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  };

  error = signal('');
  loading = signal(false);
  success = signal(false);

  get pending() {
    const raw = sessionStorage.getItem('pathly_pending_reg');
    return raw ? JSON.parse(raw) : null;
  }

  formatCardNumber(e: Event): void {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 16);
    this.card.number = val.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(e: Event): void {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
    this.card.expiry = val;
  }

  get cardBrand(): string {
    const n = this.card.number.replace(/\s/g, '');
    if (n.startsWith('4')) return '💳 Visa';
    if (n.startsWith('5')) return '💳 Mastercard';
    return '💳';
  }

  submit(): void {
    const { name, number, expiry, cvv } = this.card;
    if (!name || !number || !expiry || !cvv) {
      this.error.set('Please fill in all card details.');
      return;
    }
    if (number.replace(/\s/g, '').length < 16) {
      this.error.set('Please enter a valid 16-digit card number.');
      return;
    }
    if (cvv.length < 3) {
      this.error.set('Please enter a valid CVV.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    // Simulate payment processing (replace with real payment gateway e.g. PayFast, Stripe)
    setTimeout(() => {
      const reg = this.pending;
      // Update the stored auth user plan after payment
      const current = this.auth.currentUser();
      if (current) {
        const updated = { ...current, plan: this.plan as AuthService['plan'] extends () => infer R ? R : never };
        this.auth.currentUser.set(updated as any);
        localStorage.setItem('pathly_auth', JSON.stringify(updated));
      }
      this.sub.resetUsage();
      sessionStorage.removeItem('pathly_pending_reg');
      this.loading.set(false);
      this.success.set(true);

      setTimeout(() => this.router.navigate(['/analyze']), 2500);
    }, 2000);
  }
}
