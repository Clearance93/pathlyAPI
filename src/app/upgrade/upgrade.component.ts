import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SubscriptionService, Plan } from '../services/subscription.service';
import { AuthService } from '../services/auth.service';

interface PlanCard {
  code: Plan;
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight: boolean;
}

@Component({
  selector: 'app-upgrade',
  imports: [RouterLink],
  templateUrl: './upgrade.component.html',
  styleUrl: './upgrade.component.css'
})
export class UpgradeComponent {
  private sub = inject(SubscriptionService);
  private auth = inject(AuthService);

  currentPlan = this.sub.plan;

  /** Pricing is public; signed-out visitors are sent through registration before checkout. */
  isLoggedIn = this.auth.isLoggedIn;

  backLink = computed(() => (this.isLoggedIn() ? '/analyze' : '/'));

  /**
   * Prices are display-only here — the amount actually charged comes from the
   * server-side plan catalogue (`/Plans`) via checkout.
   */
  plans: PlanCard[] = [
    {
      code: 'free',
      name: 'Free',
      price: 'R0',
      period: 'forever',
      tagline: 'See what Pathly can do for you.',
      features: [
        'Full app access',
        '1 sample item per report section',
        'Academic report preview',
        'Psychometrics not included'
      ],
      cta: 'Start Free',
      highlight: false
    },
    {
      code: 'standard',
      name: 'Standard',
      price: 'R49',
      period: 'per month',
      tagline: 'The full academic report.',
      features: [
        'Everything in Free',
        'Complete academic (student) report',
        'All career matches, demand and outlook',
        'Subjects, APS analysis and study tips',
        'Academic report only — no psychometrics'
      ],
      cta: 'Choose Standard',
      highlight: false
    },
    {
      code: 'premium',
      name: 'Premium',
      price: 'R99',
      period: 'per month',
      tagline: 'Academic results + who you are.',
      features: [
        'Everything in Standard',
        'Career Interest (psychometric) assessment',
        'All interest dimensions unlocked',
        'Combined academic + interest report',
        'Deeper, more personalised career paths'
      ],
      cta: 'Choose Premium',
      highlight: true
    }
  ];

  isCurrent(code: Plan): boolean {
    return this.currentPlan() === code;
  }

  /**
   * Route only — the query string is bound separately because Angular encodes a `?` inside a
   * string `routerLink`, which turned these links into an unknown path.
   */
  checkoutPath(code: Plan): string {
    if (!this.isLoggedIn()) {
      // No account yet: collect it first, then the register page forwards paid tiers to checkout.
      return '/register';
    }

    return code === 'free' ? '/analyze' : '/payment';
  }

  checkoutQuery(code: Plan): Record<string, string> | null {
    if (code === 'free' && this.isLoggedIn()) {
      return null;
    }

    return { plan: code };
  }
}
