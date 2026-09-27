import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  styleUrl: './auth-shared.css',
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <a routerLink="/login" class="back-link">← Back to sign in</a>

        <img src="pathly-mark.png" alt="PathlyAI" class="auth-logo" />
        <h1>Choose a new password</h1>
        <p class="auth-sub">Set a new password for {{ email || 'your account' }}.</p>

        @if (done()) {
          <div class="info-box">Your password has been updated. You can now sign in with your new password.</div>
          <button type="button" class="submit-btn" (click)="goToLogin()">Sign in →</button>
        } @else {
          <form (ngSubmit)="submit()" class="auth-form">
            <div class="field">
              <label>New Password</label>
              <div class="input-wrap">
                <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" placeholder="Min. 8 characters" autocomplete="new-password" />
                <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">{{ showPassword() ? '🙈' : '👁️' }}</button>
              </div>
              <p class="pw-hint">At least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.</p>
            </div>

            <div class="field">
              <label>Confirm New Password</label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Repeat your password" autocomplete="new-password" />
            </div>

            @if (error()) { <div class="error-box">⚠️ {{ error() }}</div> }

            <button type="submit" class="submit-btn" [disabled]="loading()">
              @if (loading()) { <span class="btn-spinner"></span> }
              Update password →
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class ResetPasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  token = this.route.snapshot.queryParamMap.get('token') ?? '';

  password = '';
  confirmPassword = '';
  showPassword = signal(false);
  loading = signal(false);
  done = signal(false);
  error = signal('');

  constructor() {
    if (!this.email || !this.token) {
      this.error.set('This password reset link is invalid or has expired. Please request a new one.');
    }
  }

  submit() {
    this.error.set('');

    if (!this.token || !this.email) {
      this.error.set('This password reset link is invalid or has expired. Please request a new one.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    if (!this.isStrongEnough(this.password)) {
      this.error.set('Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol.');
      return;
    }

    this.loading.set(true);
    this.auth.resetPassword(this.email, this.token, this.password).subscribe({
      next: () => { this.loading.set(false); this.done.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'We could not reset your password. The link may have expired.');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private isStrongEnough(password: string): boolean {
    return password.length >= 8
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /[0-9]/.test(password)
      && /[^A-Za-z0-9]/.test(password);
  }
}
