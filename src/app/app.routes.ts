import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { UploadComponent } from './upload/upload.component';
import { UpgradeComponent } from './upgrade/upgrade.component';
import { RegisterComponent } from './register/register.component';
import { PaymentComponent } from './payment/payment.component';
import { LoginComponent } from './login/login';
import { AuthCallbackComponent } from './auth-callback/auth-callback';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'analyze', component: UploadComponent },
  { path: 'upgrade', component: UpgradeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'auth-callback', component: AuthCallbackComponent },
  { path: 'payment', component: PaymentComponent }
];
