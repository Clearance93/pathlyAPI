import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  imports: [RouterLink],
  styleUrl: '../auth/auth-shared.css',
  template: `
    <div class="auth-page">
      <div class="auth-card wide">
        <a routerLink="/" class="back-link">← Back to home</a>
        <h1>Terms of Service</h1>
        <p class="legal-updated">Last updated: January 2026</p>

        <div class="legal-body">
          <p>These terms govern your use of PathlyAI ("Pathly", "we", "us"), a career guidance service that
          analyses academic results and career-interest assessments to produce personalised guidance.</p>

          <h2>1. Guidance, not a guarantee</h2>
          <p>Pathly provides guidance only. Career suggestions, APS calculations, university indications and
          projections are estimates based on the information you provide and are not guarantees of admission,
          employment or outcomes. Always confirm requirements with the relevant institution.</p>

          <h2>2. Your account</h2>
          <p>You must provide accurate registration information, keep your password secure, and confirm your email
          address where required. You are responsible for activity under your account.</p>

          <h2>3. Acceptable use</h2>
          <ul>
            <li>Upload only documents you are entitled to share.</li>
            <li>Do not attempt to access another user's data or disrupt the service.</li>
            <li>Do not use automated means to create accounts or scrape the service.</li>
          </ul>

          <h2>4. Subscriptions and payments</h2>
          <p>Paid plans unlock additional features. Payments are processed by our payment provider. Fees are
          charged in South African Rand unless stated otherwise.</p>

          <h2>5. Privacy</h2>
          <p>We process personal information in line with the Protection of Personal Information Act (POPIA).
          See our <a routerLink="/privacy">Privacy Policy</a> for details, including how to access or delete your data.</p>

          <h2>6. Limitation of liability</h2>
          <p>To the maximum extent permitted by law, Pathly is not liable for decisions taken based on the
          guidance it provides.</p>

          <h2>7. Contact</h2>
          <p>For questions about these terms, contact us via the details on our website.</p>
        </div>
      </div>
    </div>
  `
})
export class TermsComponent {}
