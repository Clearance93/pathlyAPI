import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** A request is an API call when it hits our /api/ route, regardless of origin
 *  (dev: https://localhost:7169/api/..., prod: /api/...). */
function isApiCall(url: string): boolean {
  return url.includes('/api/');
}

/** The auth endpoints must never trigger the refresh/redirect logic (avoids loops). */
function isAuthEndpoint(url: string): boolean {
  return url.includes('/Authentication/');
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
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` }, withCredentials: true })
    : req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((err) => {
      // On an expired/missing session for a real API call, try ONE silent refresh using the
      // refresh token, then replay the original request. Only if that fails do we sign out.
      if (err instanceof HttpErrorResponse && err.status === 401 &&
          isApiCall(req.url) && !isAuthEndpoint(req.url) && !req.headers.has('x-pathly-retried')) {

        return auth.refresh().pipe(
          switchMap(() => {
            const freshToken = auth.currentUser()?.token;
            const retried = req.clone({
              setHeaders: {
                Authorization: `Bearer ${freshToken}`,
                'x-pathly-retried': '1'
              },
              withCredentials: true
            });
            return next(retried);
          }),
          catchError(() => {
            auth.logout();
            router.navigate(['/login'], { queryParams: { session: 'expired', returnUrl: req.url } });
            return throwError(() => err);
          })
        );
      }

      // Fall back to the original behaviour: clear a session that could not be refreshed.
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthEndpoint(req.url)) {
        if (auth.isLoggedIn()) {
          auth.logout();
        }
        router.navigate(['/login'], { queryParams: { session: 'expired', returnUrl: req.url } });
      }

      return throwError(() => err);
    })
  );
};
