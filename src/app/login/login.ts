import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  auth = inject(AuthService);

  form = { email: '', password: '' };
  showPassword = signal(false);
  error   = signal('');
  loading = signal(false);
  notConfirmed = signal(false);
  resendMessage = signal('');

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const err = params.get('error');

    if (err === 'account_creation_failed') {
      this.error.set('Google sign-in failed. If you already have an account, please sign in with your email and password.');
    } else if (err) {
      this.error.set('Social sign-in failed. Please try again or use email and password.');
    }

    if (params.get('session') === 'expired') {
      this.error.set('Your session has expired. Please sign in again to continue.');
    }

    if (params.get('verified') === '1') {
      this.resendMessage.set('Your email has been verified. You can sign in now.');
    }
  }

  submit() {
    this.error.set('');
    this.notConfirmed.set(false);
    this.resendMessage.set('');

    if (!this.form.email || !this.form.password) {
      this.error.set('Please enter your email and password.'); return;
    }

    this.loading.set(true);
    this.auth.login(this.form.email, this.form.password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/analyze';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        if (err.status === 403 && err.error?.error === 'email_not_confirmed') {
          this.notConfirmed.set(true);
          this.error.set(err.error?.message ?? 'Please confirm your email address before signing in.');
        } else if (err.status === 423) {
          this.error.set(err.error?.message ?? 'Your account is temporarily locked. Please try again later.');
        } else if (err.status === 429) {
          this.error.set('Too many attempts. Please wait a minute and try again.');
        } else {
          this.error.set(err?.error?.message ?? 'Invalid email or password.');
        }
        this.loading.set(false);
      }
    });
  }

  resendConfirmation() {
    if (!this.form.email) {
      this.error.set('Enter your email address first so we know where to send the link.');
      return;
    }

    this.auth.resendConfirmation(this.form.email).subscribe({
      next: () => this.resendMessage.set('If your account still needs verification, a new link is on its way.'),
      error: () => this.resendMessage.set('We could not resend the email right now. Please try again shortly.')
    });
  }
}
