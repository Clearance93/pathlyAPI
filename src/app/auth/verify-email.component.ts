import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  styleUrl: './auth-shared.css',
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <a routerLink="/" class="back-link">← Back to home</a>

        <img src="pathly-mark.png" alt="PathlyAI" class="auth-logo" />

        @if (status() === 'pending') {
          <h1>Verifying your email…</h1>
          <p class="auth-sub">One moment while we confirm your address.</p>
        } @else if (status() === 'success') {
          <h1>Email verified</h1>
          <div class="info-box">Your email address has been confirmed. You can now sign in.</div>
          <button type="button" class="submit-btn" (click)="goToLogin()">Sign in →</button>
        } @else {
          <h1>Verification failed</h1>
          <div class="error-box">⚠️ {{ error() }}</div>
          <p class="login-link">You can request a new link from the <a routerLink="/login">sign-in page</a>.</p>
        }
      </div>
    </div>
  `
})
export class VerifyEmailComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  status = signal<'pending' | 'success' | 'error'>('pending');
  error = signal('');

  constructor() {
    const userId = this.route.snapshot.queryParamMap.get('userId') ?? '';
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!userId || !token) {
      this.status.set('error');
      this.error.set('This verification link is invalid or incomplete.');
      return;
    }

    this.auth.confirmEmail(userId, token).subscribe({
      next: () => this.status.set('success'),
      error: (err) => {
        this.status.set('error');
        this.error.set(err?.error?.message ?? 'This verification link is invalid or has expired.');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { verified: '1' } });
  }
}
