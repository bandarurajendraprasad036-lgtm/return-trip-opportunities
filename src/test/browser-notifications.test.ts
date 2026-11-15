import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserPermission, requestBrowserPermission, shouldShowDeniedNotice } from '@/lib/browser-notifications';
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });
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
    expect(requestPermission).toHaveBeenCalledTimes(permission === 'default' ? 1 : 0);
    expect(localStorage.getItem('gayatri-notification-permission')).toBe(permission);
  });
  it('never prompts again after permission is granted', async () => {
    const notification={permission:'default',requestPermission:vi.fn()};
    notification.requestPermission.mockImplementation(async()=>{notification.permission='granted';return 'granted';});
    vi.stubGlobal('Notification',notification);
    await requestBrowserPermission(); await requestBrowserPermission();
    expect(notification.requestPermission).toHaveBeenCalledTimes(1);
  });
  it('shows denied settings guidance only once across repeated visits', () => {
    expect(shouldShowDeniedNotice()).toBe(true);
    expect(localStorage.getItem('gayatri-notification-denied-notice')).toBe('1');
    expect(shouldShowDeniedNotice()).toBe(false);
  });
  it('uses actual permission instead of a stale saved grant', async () => {
    localStorage.setItem('gayatri-notification-permission','granted');
    const requestPermission=vi.fn();vi.stubGlobal('Notification',{permission:'denied',requestPermission});
    expect(await requestBrowserPermission()).toBe('denied');expect(requestPermission).not.toHaveBeenCalled();
  });
  it('reports a failed request distinctly from denial', async () => {
    vi.stubGlobal('Notification', { permission: 'default', requestPermission: vi.fn().mockRejectedValue(new Error('blocked')) });
    expect(await requestBrowserPermission()).toBe('failed');
  });
});