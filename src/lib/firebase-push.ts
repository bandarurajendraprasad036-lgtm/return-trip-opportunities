import { bellMuted } from './bell';

export type PushStatus = 'registered' | 'not-configured' | 'unsupported' | 'open-in-new-tab' | 'denied' | 'failed' | 'idle';
export function pushDeviceId() {
  let id = localStorage.getItem('gayatri-push-device');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('gayatri-push-device', id); }
  return id;
}
export async function enablePush(): Promise<{ status: PushStatus; token?: string }> {
  const appId = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID'];
  const vapidKey = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY'];
  const config = { apiKey: import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY'], projectId: import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID'], appId, messagingSenderId: appId?.split(':')[1] ?? '' };
  if (!config.apiKey || !config.projectId || !appId || !vapidKey || !config.messagingSenderId) return { status: 'not-configured' };
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return { status: 'unsupported' };
  if (window.top !== window.self) return { status: 'open-in-new-tab' };
  try {
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission !== 'granted') return { status: 'denied' };
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
    if (!(await isSupported())) return { status: 'unsupported' };
    const { initializeApp, getApps } = await import('firebase/app');
    // Separate scope prevents replacing the existing offline app-shell worker.
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${new URLSearchParams(config)}`, { scope: '/firebase-cloud-messaging-push-scope/' });
    const messaging = getMessaging(getApps().find(a => a.name === 'gayatri-push') ?? initializeApp(config, 'gayatri-push'));
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    return token ? { status: 'registered', token } : { status: 'failed' };
  } catch { return { status: 'failed' }; }
}
export const deviceSound = () => !bellMuted();