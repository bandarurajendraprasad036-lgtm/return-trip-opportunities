import { afterEach, it, expect, vi } from 'vitest';
import { enablePush } from '@/lib/firebase-push';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('reports missing web configuration without requesting permission', async () => {
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID', '');
  const requestPermission = vi.fn(); vi.stubGlobal('Notification', { requestPermission });
  expect((await enablePush()).status).toBe('not-configured');
  expect(requestPermission).not.toHaveBeenCalled();
});
it('does not treat denied permission as registration', async () => {
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID', '1:123:web:abc');
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY', 'public-test');
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID', 'test');
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY', 'public-test');
  vi.stubGlobal('Notification', { permission: 'denied', requestPermission: vi.fn().mockResolvedValue('denied') });
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {} });
  expect((await enablePush()).status).toBe('denied');
});