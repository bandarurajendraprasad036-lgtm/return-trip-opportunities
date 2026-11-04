import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserPermission, requestBrowserPermission } from '@/lib/browser-notifications';
afterEach(() => vi.unstubAllGlobals());
describe('browser permission results', () => {
  it('reports unsupported browsers without requesting permission', async () => {
    vi.stubGlobal('Notification', undefined);
    expect(browserPermission()).toBe('unsupported');
    expect(await requestBrowserPermission()).toBe('unsupported');
  });
  it.each(['granted', 'denied', 'default'] as const)('returns actual %s permission without claiming delivery', async permission => {
    const requestPermission = vi.fn().mockResolvedValue(permission);
    vi.stubGlobal('Notification', { permission, requestPermission });
    expect(browserPermission()).toBe(permission);
    expect(await requestBrowserPermission()).toBe(permission);
  });
  it('reports a failed request distinctly from denial', async () => {
    vi.stubGlobal('Notification', { permission: 'default', requestPermission: vi.fn().mockRejectedValue(new Error('blocked')) });
    expect(await requestBrowserPermission()).toBe('failed');
  });
});