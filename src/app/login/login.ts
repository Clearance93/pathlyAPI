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

  submit() {
    this.error.set('');
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
        this.error.set(err?.error?.message ?? 'Invalid email or password.');
        this.loading.set(false);
      }
    });
  }
}
