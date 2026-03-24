import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  token: string;
  expiration: string;
  plan: 'free' | 'pro' | 'school';
}

const BASE = 'https://pathly.azurewebsites.net/api/Auth';
const AUTH_KEY = 'pathly_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private stored = localStorage.getItem(AUTH_KEY);
  currentUser = signal<AuthUser | null>(this.stored ? JSON.parse(this.stored) : null);

  isLoggedIn = computed(() => this.currentUser() !== null);
  plan       = computed(() => this.currentUser()?.plan ?? 'free');
  isPro      = computed(() => this.plan() === 'pro' || this.plan() === 'school');

  register(firstName: string, lastName: string, email: string, password: string, plan: string) {
    return this.http.post<AuthUser>(`${BASE}/accountCreation`, {
      firstName, lastName, email, password
    }).pipe(
      tap(user => {
        const withPlan = { ...user, plan: plan as AuthUser['plan'] };
        this.currentUser.set(withPlan);
        localStorage.setItem(AUTH_KEY, JSON.stringify(withPlan));
      })
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthUser>(`${BASE}/login`, { email, password }).pipe(
      tap(user => {
        const withPlan = { ...user, plan: (user as any).plan ?? 'pro' as AuthUser['plan'] };
        this.currentUser.set(withPlan);
        localStorage.setItem(AUTH_KEY, JSON.stringify(withPlan));
      })
    );
  }

  loginWithGoogle() {
    window.location.href = `${BASE}/google-login`;
  }

  loginWithMicrosoft() {
    window.location.href = `${BASE}/microsoft-login`;
  }

  saveFromSocialRedirect(user: AuthUser) {
    this.currentUser.set(user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(AUTH_KEY);
    this.router.navigate(['/']);
  }
}