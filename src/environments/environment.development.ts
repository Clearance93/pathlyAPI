export const environment = {
  production: false,
  apiUrl: 'https://localhost:7169/api',
  turnstileSiteKey: '',
  /**
   * Local development only. When the API reports that payments are unavailable (no Paystack
   * credentials) the checkout screen offers to activate the plan directly so the Free /
   * Standard / Premium tiers can be exercised end to end. The API refuses this outside
   * Development regardless of this flag.
   */
  allowDevUpgrades: true
};
