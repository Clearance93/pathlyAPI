import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  auth = inject(AuthService);

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

    this.loading.set(true);
    this.auth.register(
      this.form.firstName,
      this.form.lastName,
      this.form.email,
      this.form.password,
      this.plan,
      this.form.acceptTerms,
      this.form.marketingConsent
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
