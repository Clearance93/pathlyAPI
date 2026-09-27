import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  styleUrl: './auth-shared.css',
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <a routerLink="/login" class="back-link">← Back to sign in</a>

        <img src="pathly-mark.png" alt="PathlyAI" class="auth-logo" />
        <h1>Reset your password</h1>
        <p class="auth-sub">Enter the email you signed up with and we'll send you a reset link.</p>

        @if (done()) {
          <div class="info-box">
            If an account exists for that email, a password reset link has been sent. Check your inbox (and spam folder).
          </div>
          <p class="login-link"><a routerLink="/login">Return to sign in</a></p>
        } @else {
          <form (ngSubmit)="submit()" class="auth-form">
            <div class="field">
              <label>Email Address</label>
              <input type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" autocomplete="email" />
            </div>

            @if (error()) { <div class="error-box">⚠️ {{ error() }}</div> }

            <button type="submit" class="submit-btn" [disabled]="loading()">
              @if (loading()) { <span class="btn-spinner"></span> }
              Send reset link →
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);

  email = '';
  loading = signal(false);
  done = signal(false);
  error = signal('');

  submit() {
    this.error.set('');

    if (!this.email) {
      this.error.set('Please enter your email address.');
      return;
    }

    this.loading.set(true);
    this.auth.forgotPassword(this.email).subscribe({
      // The API always returns the same response, so we always show the same confirmation.
      next: () => { this.loading.set(false); this.done.set(true); },
      error: () => { this.loading.set(false); this.done.set(true); }
    });
  }
}
