import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../services/subscription.service';

@Component({
  selector: 'app-upgrade',
  imports: [CommonModule, RouterLink],
  templateUrl: './upgrade.component.html',
  styleUrl: './upgrade.component.css'
})
export class UpgradeComponent {
  sub = inject(SubscriptionService);

  selected = signal<'pro' | 'school'>('pro');

  plans = [
    {
      id: 'pro' as const,
      name: 'Pro',
      price: 'R99',
      period: 'per month',
      description: 'Perfect for individual students who are serious about their future.',
      features: [
        { text: 'Unlimited analyses', included: true },
        { text: 'All 5 top career matches', included: true },
        { text: 'Detailed AI feedback report', included: true },
        { text: 'Strengths & weaknesses breakdown', included: true },
        { text: 'Alternative career paths', included: true },
        { text: 'Priority support', included: true },
      ],
      highlight: true,
      badge: '⚡ Most Popular'
    },
    {
      id: 'school' as const,
      name: 'School',
      price: 'R499',
      period: 'per month',
      description: 'Built for schools and career counsellors managing multiple students.',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Up to 500 student analyses', included: true },
        { text: 'Bulk upload support', included: true },
        { text: 'Teacher / counsellor dashboard', included: true },
        { text: 'Progress tracking per student', included: true },
        { text: 'Dedicated account manager', included: true },
      ],
      highlight: false,
      badge: '🏫 For Schools'
    }
  ];

  freeFeatures = [
    { text: '1 analysis only', included: true },
    { text: 'Top 3 career matches', included: true },
    { text: 'AI feedback report', included: false },
    { text: 'Strengths & weaknesses', included: false },
    { text: 'Alternative career paths', included: false },
    { text: 'Unlimited analyses', included: false },
  ];

  faqs = [
    { q: 'Can I cancel anytime?', a: 'Yes. You can cancel your subscription at any time with no penalties. Your access continues until the end of the billing period.' },
    { q: 'Is my data safe?', a: 'Absolutely. We never store your academic results. The file is processed in real-time and discarded immediately after analysis.' },
    { q: 'What file formats are supported?', a: 'We support PDF, JPG, and PNG. Simply upload a photo or scan of your report card.' },
    { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade your plan at any time from your account settings.' },
  ];

  openFaq = signal<number | null>(null);

  toggleFaq(i: number): void {
    this.openFaq.set(this.openFaq() === i ? null : i);
  }
}
