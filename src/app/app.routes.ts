import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UploadComponent } from './upload/upload.component';
import { UpgradeComponent } from './upgrade/upgrade.component';
import { RegisterComponent } from './register/register.component';
import { PaymentComponent } from './payment/payment.component';
import { LoginComponent } from './login/login';
import { AuthCallbackComponent } from './auth-callback/auth-callback';
import { AssessmentComponent } from './assessment/assessment.component';
import { ForgotPasswordComponent } from './auth/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password.component';
import { VerifyEmailComponent } from './auth/verify-email.component';
import { TermsComponent } from './legal/terms.component';
import { PrivacyComponent } from './legal/privacy.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'analyze', component: UploadComponent, canActivate: [authGuard] },
  { path: 'assessment', component: AssessmentComponent, canActivate: [authGuard] },
  { path: 'upgrade', component: UpgradeComponent, canActivate: [authGuard] },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'auth-callback', component: AuthCallbackComponent },
  { path: 'payment', component: PaymentComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
