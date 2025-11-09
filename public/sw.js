self.addEventListener('push', function(event) {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    // fallback to text
    payload = { title: 'Notification', body: event.data.text() };
  }
  const title = payload.title || 'Notification';
  const options = {
    body: payload.body || '',
    tag: payload.msgId || ('tag-' + Date.now()),
    renotify: false,
    requireInteraction: false,
    data: { url: payload.url || '/', msgId: payload.msgId, extra: payload.data || {} },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === data.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow && data.url) return clients.openWindow(data.url);
    })
  );
});

/* When subscription changes (browser updates keys), ask pages to resubscribe and update Firestore */
self.addEventListener('pushsubscriptionchange', function(event) {
  event.waitUntil(
    clients.matchAll({ includeUncontrolled: true }).then(clientsArr => {
      for (const c of clientsArr) c.postMessage('RESUBSCRIBE');
      return Promise.resolve();
    })
  );
});
