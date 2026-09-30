import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ACTIVITY_KEY, AUTH_KEY } from './app-storage';

/**
 * Signs the learner out after a period of inactivity and clears every cached artefact, so a
 * shared device (school computer, library PC) is never left holding an unlocked session.
 *
 * Activity is tracked across tabs via a `pathly_` heartbeat in localStorage, so being active in
 * one tab keeps the whole device alive, and a timeout in any tab signs out the others too.
 */
@Injectable({ providedIn: 'root' })
export class IdleService {
  /** Sign out after this much inactivity. */
  static readonly TIMEOUT_MS = 30 * 60 * 1000;

  /** How often the idle check runs. */
  private static readonly CHECK_MS = 30 * 1000;

  /** Don't hit localStorage on every mousemove — write the heartbeat at most this often. */
  private static readonly WRITE_THROTTLE_MS = 5 * 1000;

  private static readonly ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  private auth = inject(AuthService);

  private running = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastActivity = 0;
  private lastWrite = 0;

  private readonly onActivity = () => this.recordActivity();

  private readonly onStorage = (event: StorageEvent) => {
    if (event.key === ACTIVITY_KEY && event.newValue) {
      const value = Number(event.newValue);
      if (!Number.isNaN(value)) this.lastActivity = value;
      return;
    }

    // Another tab signed out (or timed out) and removed the session — mirror it here.
    if (event.key === AUTH_KEY && event.newValue === null && this.auth.isLoggedIn()) {
      this.stop();
      this.auth.clearSessionLocally('idle');
    }
  };

  constructor() {
    // Start watching while signed in; stop (and clean up listeners) the moment the session ends.
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      if (loggedIn && typeof window !== 'undefined') {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  /** Begins (or restarts) idle tracking. Safe to call when already running. */
  start(): void {
    if (this.running || typeof window === 'undefined') return;

    // If the tab/browser was closed and reopened after the timeout, sign out immediately rather
    // than granting a fresh 30 minutes. The heartbeat is absent after a clean logout, so this
    // only fires when a stale session actually lingered.
    const stored = this.readHeartbeat();

    if (stored !== null && Date.now() - stored >= IdleService.TIMEOUT_MS) {
      // Deferred out of the synchronous effect run: start() may be invoked from an effect, and
      // signing out mutates signals (which must not happen inside the effect itself).
      setTimeout(() => this.auth.logout({ reason: 'idle' }), 0);
      return;
    }

    this.running = true;
    this.lastActivity = Date.now();
    this.lastWrite = Date.now();
    this.writeHeartbeat();

    for (const eventName of IdleService.ACTIVITY_EVENTS) {
      window.addEventListener(eventName, this.onActivity, { passive: true });
    }
    window.addEventListener('storage', this.onStorage);

    this.intervalId = setInterval(() => this.checkIdle(), IdleService.CHECK_MS);
  }

  /** Stops idle tracking and removes all listeners. */
  stop(): void {
    if (!this.running) return;
    this.running = false;

    if (typeof window !== 'undefined') {
      for (const eventName of IdleService.ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, this.onActivity);
      }
      window.removeEventListener('storage', this.onStorage);
    }

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private recordActivity(): void {
    if (!this.running) return;

    const now = Date.now();
    this.lastActivity = now;

    if (now - this.lastWrite >= IdleService.WRITE_THROTTLE_MS) {
      this.lastWrite = now;
      this.writeHeartbeat();
    }
  }

  private writeHeartbeat(): void {
    try {
      localStorage.setItem(ACTIVITY_KEY, String(this.lastActivity));
    } catch {
      /* storage unavailable (private mode) — idle timeout still works within this tab */
    }
  }

  private readHeartbeat(): number | null {
    try {
      const raw = localStorage.getItem(ACTIVITY_KEY);
      if (!raw) return null;
      const value = Number(raw);
      return Number.isNaN(value) ? null : value;
    } catch {
      return null;
    }
  }

  private checkIdle(): void {
    if (!this.running) return;

    if (Date.now() - this.lastActivity >= IdleService.TIMEOUT_MS) {
      this.stop();
      this.auth.logout({ reason: 'idle' });
    }
  }
}
