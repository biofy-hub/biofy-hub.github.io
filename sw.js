/* Biofy Hub · avisos al móvil (Juan, 23/11/2026).
   Solo enseña las notificaciones que llegan (p. ej., «Te falta la quiniela de hoy») y abre el Hub al tocarlas.
   No guarda páginas ni datos en el móvil. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Biofy Hub', {
    body: d.body || '',
    icon: 'comun/marca/icono-192.png',
    badge: 'comun/marca/icono-96.png',
    tag: d.tag || 'quiniela',
    renotify: true,
    data: { url: d.url || './quinielas/' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || './quinielas/', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) if (w.url.startsWith(self.registration.scope) && 'focus' in w) { w.navigate(url); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
