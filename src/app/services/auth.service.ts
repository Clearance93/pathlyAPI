import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AUTH_KEY, clearUserScopedStorage } from './app-storage';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  token: string;
  expiration: string;
  plan: 'free' | 'pro' | 'school';
}

const BASE = `${environment.apiUrl}/Authentication`;

export { AUTH_KEY };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private get isBrowser(): boolean { return typeof localStorage !== 'undefined'; }
  private stored = this.isBrowser ? localStorage.getItem(AUTH_KEY) : null;
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

  /** The signed-in account id, or null. Used to namespace per-user caches. */
  currentUserId = computed(() => this.currentUser()?.id ?? null);

  register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    plan: string,
    acceptTerms: boolean,
    marketingConsent: boolean
  ) {
    return this.http.post<AuthUser>(`${BASE}/registration`, {
      firstName,
      lastName,
      email,
      password,
      acceptTerms,
      marketingConsent
    }).pipe(
      tap(user => this.persist(user, plan as AuthUser['plan']))
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthUser>(`${BASE}/login`, { email, password }).pipe(
      tap(user => this.persist(user))
    );
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${BASE}/forgot-password`, { email });
  }

  resetPassword(email: string, token: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${BASE}/reset-password`, { email, token, newPassword });
  }

  confirmEmail(userId: string, token: string) {
    return this.http.post<{ message: string }>(`${BASE}/confirm-email`, { userId, token });
  }

  resendConfirmation(email: string) {
    return this.http.post<{ message: string }>(`${BASE}/resend-confirmation`, { email });
  }

  saveFromSocialRedirect(user: AuthUser) {
    this.currentUser.set(this.normalizeUser(user));
    if (this.isBrowser) localStorage.setItem(AUTH_KEY, JSON.stringify(this.currentUser()));
  }

  logout() {
    // Clear the token AND every cached artefact (results, assessments, usage) so nothing from
    // this account can be seen by the next user on a shared device.
    clearUserScopedStorage();
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  private persist(user: AuthUser, plan: AuthUser['plan'] = 'free') {
    const normalized = this.normalizeUser(user);

    // If a different account was previously cached in this browser, purge their data first.
    const previousId = this.currentUser()?.id;
    if (previousId && previousId !== normalized.id) {
      clearUserScopedStorage();
    }

    const withPlan = { ...normalized, plan: (user as any).plan ?? plan };
    this.currentUser.set(withPlan);
    if (this.isBrowser) localStorage.setItem(AUTH_KEY, JSON.stringify(withPlan));
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
