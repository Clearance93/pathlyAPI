import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_PREFIX,
  resultKey,
  riasecKey,
  usageKey,
  clearUserScopedStorage,
} from './app-storage';

describe('app-storage (shared-device safety)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('namespaces every cache key by account id', () => {
    expect(resultKey('user-a')).not.toBe(resultKey('user-b'));
    expect(riasecKey('user-a')).not.toBe(riasecKey('user-b'));
    expect(usageKey('user-a')).not.toBe(usageKey('user-b'));
    expect(resultKey('user-a').startsWith(STORAGE_PREFIX)).toBe(true);
  });

  it('purges every pathly_ key from BOTH storages on logout', () => {
    localStorage.setItem(resultKey('user-a'), '{"x":1}');
    localStorage.setItem(riasecKey('user-a'), '{"R":10}');
    localStorage.setItem(usageKey('user-a'), '2');
    localStorage.setItem('pathly_auth', '{"token":"secret"}');
    sessionStorage.setItem(resultKey('user-a'), '{"x":1}');

    // A non-Pathly key owned by another app must survive.
    localStorage.setItem('unrelated_key', 'keep-me');

    clearUserScopedStorage();

    expect(localStorage.getItem(resultKey('user-a'))).toBeNull();
    expect(localStorage.getItem(riasecKey('user-a'))).toBeNull();
    expect(localStorage.getItem(usageKey('user-a'))).toBeNull();
    expect(localStorage.getItem('pathly_auth')).toBeNull();
    expect(sessionStorage.getItem(resultKey('user-a'))).toBeNull();
    expect(localStorage.getItem('unrelated_key')).toBe('keep-me');
  });

  it('does not collapse different users into a shared bucket', () => {
    // Two learners on one device: each result lives under their own key.
    localStorage.setItem(resultKey('user-a'), 'A');
    localStorage.setItem(resultKey('user-b'), 'B');

    expect(localStorage.getItem(resultKey('user-a'))).toBe('A');
    expect(localStorage.getItem(resultKey('user-b'))).toBe('B');
    expect(resultKey('user-a')).not.toBe(resultKey('user-b'));
  });
});
