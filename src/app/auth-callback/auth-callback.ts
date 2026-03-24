import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, AuthUser } from '../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.css'
})
export class AuthCallbackComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private auth   = inject(AuthService);

  error = '';

  ngOnInit() {
    const errorParam = this.route.snapshot.queryParamMap.get('error');
    if (errorParam) {
      this.error = 'Social login failed. Please try again.';
      setTimeout(() => this.router.navigate(['/login']), 2500);
      return;
    }

    const data = this.route.snapshot.queryParamMap.get('data');
    if (data) {
      try {
        const user: AuthUser = JSON.parse(decodeURIComponent(data));
        this.auth.saveFromSocialRedirect({ ...user, plan: (user as any).plan ?? 'pro' });
        this.router.navigate(['/analyze']);
      } catch {
        this.error = 'Could not complete sign in. Please try again.';
        setTimeout(() => this.router.navigate(['/login']), 2500);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }
}
