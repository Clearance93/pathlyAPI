import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, finalize, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AUTH_KEY, clearUserScopedStorage } from './app-storage';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  token: string;
  expiration: string;
  plan: 'free' | 'pro' | 'school';
  /** Rotating refresh token — used to renew the short-lived access token silently. */
  refreshToken?: string;
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

  /** Shared in-flight refresh so concurrent 401s rotate the token only once. */
  private refreshInFlight: Observable<AuthUser> | null = null;

  register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    plan: string,
    acceptTerms: boolean,
    marketingConsent: boolean,
    captchaToken?: string
  ) {
    return this.http.post<AuthUser>(`${BASE}/registration`, {
      firstName,
      lastName,
      email,
      password,
      acceptTerms,
      marketingConsent,
      captchaToken
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

  /**
   * Exchanges the stored refresh token (or the httpOnly cookie, sent automatically with
   * credentials) for a fresh, short-lived access token after the old one expires.
   *
   * Single-flight: concurrent 401s share ONE rotation. Without this, two requests would each
   * spend the same refresh token and the second would present an already-rotated token — which
   * the server treats as token theft and revokes the whole session.
   */
  refresh(): Observable<AuthUser> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this.currentUser()?.refreshToken;

    this.refreshInFlight = this.http
      .post<AuthUser>(`${BASE}/refresh`, { refreshToken }, { withCredentials: true })
      .pipe(
        tap(user => this.applyRefreshedToken(user)),
        shareReplay({ bufferSize: 1, refCount: false }),
        finalize(() => { this.refreshInFlight = null; })
      );

    return this.refreshInFlight;
  }

  logout(options?: { reason?: 'idle' }) {
    // Best-effort server-side revoke so a stolen refresh token cannot be reused.
    const refreshToken = this.currentUser()?.refreshToken;
    if (refreshToken) {
      this.http
        .post(`${BASE}/logout`, { refreshToken }, { withCredentials: true })
        .subscribe({ error: () => { /* offline-tolerant sign-out */ } });
    }

    // Clear the token AND every cached artefact (results, assessments, usage) so nothing from
    // this account can be seen by the next user on a shared device.
    clearUserScopedStorage();
    this.currentUser.set(null);

    if (options?.reason === 'idle') {
      this.router.navigate(['/login'], { queryParams: { session: 'idle' } });
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Clears the in-memory session WITHOUT an HTTP round-trip — used when another tab on the same
   * device has already signed out (or hit the idle timeout), so this tab mirrors it immediately.
   */
  clearSessionLocally(reason?: 'idle') {
    clearUserScopedStorage();
    this.currentUser.set(null);

    if (reason === 'idle') {
      this.router.navigate(['/login'], { queryParams: { session: 'idle' } });
    }
  }

  /** Merges refreshed credentials into the current user WITHOUT disturbing the plan/account. */
  private applyRefreshedToken(user: AuthUser) {
    const current = this.currentUser();
    if (!current || !user) return;

    const merged: AuthUser = {
      ...current,
      token: user.token ?? (user as any).Token ?? current.token,
      expiration: user.expiration ?? (user as any).expirationDate ?? (user as any).ExpirationDate ?? current.expiration,
      refreshToken: user.refreshToken ?? (user as any).RefreshToken ?? current.refreshToken
    };

    this.currentUser.set(merged);
    if (this.isBrowser) localStorage.setItem(AUTH_KEY, JSON.stringify(merged));
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
      expiration: user.expiration ?? (user as any).expirationDate ?? (user as any).ExpirationDate ?? '',
      refreshToken: user.refreshToken ?? (user as any).RefreshToken ?? undefined
    };
  }
}
