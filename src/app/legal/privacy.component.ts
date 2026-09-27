import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  styleUrl: '../auth/auth-shared.css',
  template: `
    <div class="auth-page">
      <div class="auth-card wide">
        <a routerLink="/" class="back-link">← Back to home</a>
        <h1>Privacy Policy</h1>
        <p class="legal-updated">Last updated: January 2026 · POPIA compliant</p>

        <div class="legal-body">
          <h2>1. Who we are</h2>
          <p>PathlyAI ("Pathly") is the responsible party for the personal information described in this policy.
          We build career guidance from your academic results and career-interest assessment.</p>

          <h2>2. What we collect</h2>
          <ul>
            <li><strong>Account details:</strong> name, email address and password (stored hashed by our identity provider).</li>
            <li><strong>Academic information:</strong> the subjects and marks extracted from documents you upload.</li>
            <li><strong>Assessment answers:</strong> your responses to the career-interest assessment and the resulting profile.</li>
            <li><strong>Generated reports:</strong> the guidance produced for you, kept so you can revisit it on any device.</li>
            <li><strong>Usage records:</strong> plan, analyses used and payment references.</li>
          </ul>

          <h2>3. Why we process it</h2>
          <p>We process your information to provide career guidance, save your reports, operate subscriptions, and
          secure the service. Marketing emails are sent only if you opted in, and you can withdraw at any time.</p>

          <h2>4. Who we share it with</h2>
          <p>We share the minimum necessary with processors who help us run Pathly (cloud hosting, database,
          payment processing and AI model providers). We do not sell your personal information.</p>

          <h2>5. How long we keep it</h2>
          <p>We keep your reports and records while your account is active so your history remains available.
          Payment records may be retained where the law requires it.</p>

          <h2>6. Your POPIA rights</h2>
          <p>You have the right to access, correct and delete your personal information and to object to processing.
          You can exercise these rights directly:</p>

          @if (auth.isLoggedIn()) {
            <div class="data-actions">
              <button type="button" class="btn-outline" (click)="exportData()" [disabled]="busy()">Download my data</button>
              <button type="button" class="btn-danger" (click)="deleteAccount()" [disabled]="busy()">Delete my account &amp; data</button>
            </div>
            @if (message()) { <div class="info-box" style="margin-top:1rem">{{ message() }}</div> }
            @if (error()) { <div class="error-box" style="margin-top:1rem">⚠️ {{ error() }}</div> }
          } @else {
            <p><a routerLink="/login">Sign in</a> to download or delete your data, or email us using the contact
            details on our website.</p>
          }

          <h2>7. Security</h2>
          <p>Your data is scoped to your account. Results are stored server-side and never shown to another user,
          including on shared devices — signing out clears all locally cached data.</p>

          <h2>8. Contact</h2>
          <p>For privacy requests, contact our information officer via the details on our website.</p>
        </div>
      </div>
    </div>
  `
})
export class PrivacyComponent {
  auth = inject(AuthService);
  private account = inject(AccountService);

  busy = signal(false);
  message = signal('');
  error = signal('');

  exportData() {
    this.message.set('');
    this.error.set('');
    this.busy.set(true);

    this.account.exportData().subscribe({
      next: (data) => {
        this.busy.set(false);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pathly-my-data.json';
        a.click();
        URL.revokeObjectURL(url);
        this.message.set('Your data has been downloaded.');
      },
      error: () => { this.busy.set(false); this.error.set('We could not export your data right now. Please try again.'); }
    });
  }

  deleteAccount() {
    this.message.set('');
    this.error.set('');

    if (!confirm('This permanently deletes your account, your reports and your assessment data. Continue?')) {
      return;
    }

    this.busy.set(true);
    this.account.deleteAccount().subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set('Your account and personal data have been deleted.');
        this.auth.logout();
      },
      error: () => { this.busy.set(false); this.error.set('We could not delete your account right now. Please try again.'); }
    });
  }
}
