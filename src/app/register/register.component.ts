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

  form = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };
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
    if (this.form.password.length < 6) {
      this.error.set('Password must be at least 6 characters.'); return;
    }

    this.loading.set(true);
    this.auth.register(this.form.firstName, this.form.lastName, this.form.email, this.form.password, this.plan)
      .subscribe({
        next: () => this.router.navigate(['/analyze']),
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Registration failed. Please try again.');
          this.loading.set(false);
        }
      });
  }
}
