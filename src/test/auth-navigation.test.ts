import { describe, expect, it } from 'vitest';
import { managedBrokerReturn, safeAuthReturn } from '@/lib/auth-navigation';

describe('bell login navigation', () => {
  it('bridges external-host Google entry to the managed broker without losing state or callback', () => {
    const result = managedBrokerReturn('?provider=google&state=bell-test&redirect_uri=https%3A%2F%2Fwww.gayatrione.com%2Fauth%2Fcallback', 'https://www.gayatrione.com');
    expect(result).not.toBeNull();
    const target = new URL(result ?? 'https://invalid.example');
    expect(target.origin).toBe('https://project--2c06ad9b-f779-5a1b-a09a-0d4125404c28.lovable.app');
    expect(target.pathname).toBe('/~oauth/initiate');
    expect(target.searchParams.get('state')).toBe('bell-test');
    expect(target.searchParams.get('redirect_uri')).toBe('https://www.gayatrione.com/auth/callback');
  });
  it('rejects foreign callbacks and missing state', () => {
    expect(managedBrokerReturn('?provider=google&state=x&redirect_uri=https://evil.example/auth/callback', 'https://gayatrione.com')).toBeNull();
    expect(managedBrokerReturn('?provider=google&redirect_uri=https://gayatrione.com/auth/callback', 'https://gayatrione.com')).toBeNull();
  });
  it.each(['/post/new', '/vehicles?category=goods&from=A&to=B', '/bell-board?section=work-wanted', '/bell-board?section=work-offered', '/bell-board?section=service-providers', '/bell-board?section=service-wanted', '/dashboard#account-profile'])('preserves the requested page %s', path => {
    expect(safeAuthReturn(path)).toBe(path);
  });
  it.each(['//evil.example', '/\\evil.example', 'https://evil.example', '/~oauth/initiate', '/admin'])('rejects unsafe or unapproved return %s', path => {
    expect(safeAuthReturn(path)).toBeNull();
  });
});