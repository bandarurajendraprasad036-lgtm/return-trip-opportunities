import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NotificationSettings } from '@/components/NotificationSettings';
import { bellMuted } from '@/lib/bell';
import { pushPolicy } from '@/lib/push-rules';

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });

it('dashboard OFF persists sound-only mute without disabling eligible notification delivery', () => {
  const view = render(<NotificationSettings />);
  fireEvent.click(screen.getByRole('switch'));
  expect(bellMuted()).toBe(true);
  expect(pushPolicy(new Date('2026-11-13T04:00:00Z'), { enabled: true }, !bellMuted())).toEqual({ allowed: true, silent: true });
  view.unmount();
  render(<NotificationSettings />);
  expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
});

it('dashboard ON restores sound without overriding account notification opt-out', () => {
  localStorage.setItem('gayatri-notices-muted', 'yes');
  vi.stubGlobal('AudioContext', class { resume = vi.fn(); });
  render(<NotificationSettings />);
  fireEvent.click(screen.getByRole('switch'));
  expect(bellMuted()).toBe(false);
  expect(pushPolicy(new Date('2026-11-13T04:00:00Z'), { enabled: false }, !bellMuted()).allowed).toBe(false);
});