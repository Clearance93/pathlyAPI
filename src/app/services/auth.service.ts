import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  token: string;
  expiration: string;
  plan: 'free' | 'pro' | 'school';
}

const BASE = `${environment.apiUrl}/Authentication`;
export const AUTH_KEY = 'pathly_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private stored = localStorage.getItem(AUTH_KEY);
  currentUser = signal<AuthUser | null>(this.stored ? JSON.parse(this.stored) : null);

  /** Logged in only while a token exists AND it has not expired. */
  isLoggedIn = computed(() => {
    const user = this.currentUser();
    if (!user?.token) {
      return false;
    }
    return !user.expiration || new Date(user.expiration) > new Date();
  });

  plan  = computed(() => this.currentUser()?.plan ?? 'free');
  isPro = computed(() => this.plan() === 'pro' || this.plan() === 'school');

  register(firstName: string, lastName: string, email: string, password: string, plan: string) {
    return this.http.post<AuthUser>(`${BASE}/registration`, {
      firstName, lastName, email, password
    }).pipe(
      tap(user => this.persist(user, plan as AuthUser['plan']))
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthUser>(`${BASE}/login`, { email, password }).pipe(
      tap(user => this.persist(user))
    );
  }

  saveFromSocialRedirect(user: AuthUser) {
    this.currentUser.set(this.normalizeUser(user));
    localStorage.setItem(AUTH_KEY, JSON.stringify(this.currentUser()));
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(AUTH_KEY);
    this.router.navigate(['/']);
  }

  private persist(user: AuthUser, plan: AuthUser['plan'] = 'free') {
    const withPlan = { ...this.normalizeUser(user), plan: (user as any).plan ?? plan };
    this.currentUser.set(withPlan);
    localStorage.setItem(AUTH_KEY, JSON.stringify(withPlan));
  }

  /** The API returns `userId`/`fullName`/`expirationDate` — map them onto the AuthUser shape so
   *  psychometric submissions can always be linked to the logged-in account. */
  private normalizeUser(user: AuthUser): AuthUser {
    return {
      ...user,
      id: user.id ?? (user as any).userId ?? '',
      email: user.email ?? (user as any).Email ?? '',
      fullName: user.fullName ?? (user as any).fullName ?? (user as any).FullName,
      token: user.token ?? (user as any).Token ?? '',
      expiration: user.expiration ?? (user as any).expirationDate ?? (user as any).ExpirationDate ?? ''
    };
  }
}
