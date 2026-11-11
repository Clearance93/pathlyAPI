/**
 * The three customer-facing tiers.
 *
 * - `free`     — the whole app is open, but every report section shows a single
 *                sample item so the learner can see what they get.
 * - `standard` — the academic (student) report in full. No psychometrics, no
 *                combined report.
 * - `premium`  — everything: academic report, career-interest (psychometric)
 *                assessment and the combined academic + interest report.
 */
export type Plan = 'free' | 'standard' | 'premium';

/** Plan codes the API may send. `pro`/`school` plus catalogue codes are legacy. */
export type PlanCode = Plan | 'pro' | 'school' | string;

/** Codes that map to the premium tier (psychometrics + combined reports). */
const PREMIUM_CODES = new Set([
  'premium', 'pro', 'school',
  'pro_monthly', 'psychometric_report', 'student_monthly', 'professional_monthly',
  'school_growth', 'school_pro'
]);

/** Paid codes that include the academic report but not psychometrics. */
const STANDARD_CODES = new Set(['standard', 'career_report', 'school_starter']);

/** Maps any server plan code onto one of the three tiers. */
export function normalizePlan(code: string | null | undefined): Plan {
  const value = (code ?? '').trim().toLowerCase();
  if (STANDARD_CODES.has(value)) return 'standard';
  if (PREMIUM_CODES.has(value)) return 'premium';
  return 'free';
}
