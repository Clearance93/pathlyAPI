import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { normalizePlan } from './services/subscription.service';

/**
 * Psychometrics belong to Premium only. Free sees a one-item sample of the
 * academic report, and Standard covers the academic report in full — neither
 * may reach the Career Interest Assessment.
 */
export const psychometricGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (normalizePlan(auth.plan()) !== 'premium') {
    return router.createUrlTree(['/upgrade'], { queryParams: { reason: 'psychometrics' } });
  }
  return true;
};
