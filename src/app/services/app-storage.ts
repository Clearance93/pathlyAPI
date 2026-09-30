/**
 * Central storage keys and clean-up. Everything Pathly writes to browser storage is prefixed
 * with `pathly_` so logout can purge it completely — this is what stops one learner's results
 * leaking into the next session on a shared device (school computers included).
 */
export const STORAGE_PREFIX = 'pathly_';
export const AUTH_KEY = 'pathly_auth';

/** Heartbeat written on user activity so idle-timeout is shared across tabs on one device. */
export const ACTIVITY_KEY = 'pathly_last_activity';

/** Result + assessment caches are namespaced per account id. */
export function resultKey(userId: string): string {
  return `pathly_result_${userId}`;
}

export function riasecKey(userId: string): string {
  return `pathly_riasec_${userId}`;
}

export function usageKey(userId: string): string {
  return `pathly_free_usage_${userId}`;
}

function purge(storage: Storage | undefined): void {
  if (!storage) return;
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  keys.forEach(key => storage.removeItem(key));
}

/**
 * Removes every Pathly-prefixed key from both localStorage and sessionStorage. Call on logout
 * (and before persisting a new user) so no cached result, assessment, usage counter or token
 * survives into another account's session.
 */
export function clearUserScopedStorage(): void {
  purge(typeof localStorage !== 'undefined' ? localStorage : undefined);
  purge(typeof sessionStorage !== 'undefined' ? sessionStorage : undefined);
}

export function readLocal<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}
