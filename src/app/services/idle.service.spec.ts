import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { IdleService } from './idle.service';
import { AuthService } from './auth.service';
import { ACTIVITY_KEY } from './app-storage';

describe('IdleService', () => {
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();

    logout = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            logout,
            clearSessionLocally: vi.fn(),
          },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('signs the user out after 30 minutes of inactivity', () => {
    const service = TestBed.inject(IdleService);
    service.start();

    vi.advanceTimersByTime(IdleService.TIMEOUT_MS + 31_000);

    expect(logout).toHaveBeenCalledWith({ reason: 'idle' });
  });

  it('does not sign out while the user keeps interacting', () => {
    const service = TestBed.inject(IdleService);
    service.start();

    vi.advanceTimersByTime(29 * 60 * 1000);
    window.dispatchEvent(new Event('mousemove'));
    vi.advanceTimersByTime(29 * 60 * 1000);

    expect(logout).not.toHaveBeenCalled();
    service.stop();
  });

  it('signs out immediately when the tab is reopened after the timeout', () => {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now() - (IdleService.TIMEOUT_MS + 60_000)));

    const service = TestBed.inject(IdleService);
    service.start();
    vi.advanceTimersByTime(1); // the sign-out is deferred out of the effect's synchronous run

    expect(logout).toHaveBeenCalledWith({ reason: 'idle' });
  });
});
