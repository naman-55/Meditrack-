// MediTrack Web Push Service Worker (RFC 8292 Compliant)
self.addEventListener('push', function (event) {
  let data = {
    title: 'MediTrack Health Alert',
    body: 'A health alert has been generated for your account.',
    data: { url: '/family-alerts' }
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/assets/icon-192.png',
    badge: '/assets/badge-72.png',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/family-alerts' },
    actions: [
      { action: 'open_alert', title: 'View Health Alert' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: data.data?.severity === 'CRITICAL' || data.data?.severity === 'HIGH'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/family-alerts';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Focus existing window if open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
