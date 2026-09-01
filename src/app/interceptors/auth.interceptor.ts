import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** A request is an API call when it hits our /api/ route, regardless of origin
 *  (dev: https://localhost:7169/api/..., prod: /api/...). */
function isApiCall(url: string): boolean {
  return url.includes('/api/');
}

/** Decode the JWT and tell whether it has already expired. Malformed tokens
 *  are treated as expired so we never send a doomed request. */
function tokenExpired(token: string): boolean {
  try {
    const part = token.split('.')[1];
    if (!part) return true;
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();
  const token = user?.token;
  const canAttach = !!token && !tokenExpired(token) && isApiCall(req.url);

  const authReq = canAttach
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // Session missing or expired. Clear it and send the user to log in so
        // they can get a fresh token instead of silently failing every call.
        if (auth.isLoggedIn()) {
          auth.logout();
        }
        router.navigate(['/login'], { queryParams: { session: 'expired', returnUrl: '/analyze' } });
      }
      return throwError(() => err);
    })
  );
};
