// Dedicated messaging worker; does not cache or replace the offline app shell.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL('/notifications', self.location.origin).href;
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = windows.find(item => new URL(item.url).origin === self.location.origin);
    if (client) { await client.navigate(url); await client.focus(); }
    else await self.clients.openWindow(url);
  })());
});
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
firebase.messaging().onBackgroundMessage(payload => {
  const data = payload.data || {};
  return self.registration.showNotification('గాయత్రి వన్ · Gayatri One', {
    body: 'కొత్త సమాచారం వచ్చింది · New alert received', icon: '/icon-192.png',
    tag: data.id || 'gayatri-alert', silent: data.silent === 'true', data: { path: '/notifications' },
  });
});