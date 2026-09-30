import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  auth = inject(AuthService);

  @ViewChild('turnstile') turnstileRef?: ElementRef<HTMLDivElement>;

  /** Holds the polling handle used while waiting for the Turnstile script to load. */
  private turnstilePoll: ReturnType<typeof setInterval> | null = null;

  plan = this.route.snapshot.queryParamMap.get('plan') ?? 'pro';

  planLabels: Record<string, { name: string; price: string }> = {
    pro:    { name: 'Pro',    price: 'R99/month'  },
    school: { name: 'School', price: 'R499/month' }
  };

  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    marketingConsent: false
  };

  showPassword = signal(false);
  error   = signal('');
  loading = signal(false);

  /** Turnstile token solved by the widget (empty when bot protection is disabled). */
  captchaToken = signal('');
  /** True when a real site key is configured, i.e. the challenge is required. */
  captchaRequired = !!environment.turnstileSiteKey;

  ngAfterViewInit(): void {
    const siteKey = environment.turnstileSiteKey;
    if (!siteKey || typeof window === 'undefined') return;

    const w = window as any;
    const el = this.turnstileRef?.nativeElement;
    if (!el) return;

    const render = () => w.turnstile?.render(el, {
      sitekey: siteKey,
      callback: (token: string) => this.captchaToken.set(token),
      'expired-callback': () => this.captchaToken.set(''),
      'error-callback': () => this.captchaToken.set('')
    });

    if (w.turnstile) {
      render();
      return;
    }

    // The script is loaded async — poll briefly until it is ready.
    this.turnstilePoll = setInterval(() => {
      if (w.turnstile) {
        this.clearTurnstilePoll();
        render();
      }
    }, 200);
  }

  ngOnDestroy(): void {
    this.clearTurnstilePoll();
  }

  private clearTurnstilePoll(): void {
    if (this.turnstilePoll !== null) {
      clearInterval(this.turnstilePoll);
      this.turnstilePoll = null;
    }
  }

  submit() {
    this.error.set('');

    if (!this.form.firstName || !this.form.lastName || !this.form.email || !this.form.password) {
      this.error.set('Please fill in all fields.'); return;
    }
    if (this.form.password !== this.form.confirmPassword) {
      this.error.set('Passwords do not match.'); return;
    }
    if (!this.isStrongEnough(this.form.password)) {
      this.error.set('Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol.'); return;
    }
    if (!this.form.acceptTerms) {
      this.error.set('Please accept the Terms of Service and Privacy Policy to create an account.'); return;
    }
    if (this.captchaRequired && !this.captchaToken()) {
      this.error.set('Please complete the human-verification challenge.'); return;
    }

    this.loading.set(true);
    this.auth.register(
      this.form.firstName,
      this.form.lastName,
      this.form.email,
      this.form.password,
      this.plan,
      this.form.acceptTerms,
      this.form.marketingConsent,
      this.captchaToken()
    ).subscribe({
      next: () => this.router.navigate(['/analyze']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Registration failed. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private isStrongEnough(password: string): boolean {
    return password.length >= 8
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /[0-9]/.test(password)
      && /[^A-Za-z0-9]/.test(password);
  }
}
