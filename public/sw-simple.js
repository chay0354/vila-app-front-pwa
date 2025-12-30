// Simple service worker for testing push notifications
// This version doesn't require Workbox or VitePWA processing

console.log('Simple service worker loaded');

// Push notification handler - Works even when app is closed (iOS 16.4+)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  console.log('App state: Service Worker active (works even when app is closed)');
  
  let notificationData = {
    title: 'Test Notification',
    body: 'You have a new notification!',
    icon: '/app-icon.jpg',
    badge: '/app-icon.jpg',
    tag: 'notification',
    data: {},
  };
  
  // Try to parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) notificationData.title = data.title;
      if (data.body) notificationData.body = data.body;
      if (data.icon) notificationData.icon = data.icon;
      if (data.badge) notificationData.badge = data.badge;
      if (data.tag) notificationData.tag = data.tag;
      if (data.data) notificationData.data = data.data;
    } catch (e) {
      // If not JSON, try text
      try {
        const text = event.data.text();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            notificationData = { ...notificationData, ...parsed };
          } catch {
            notificationData.body = text;
          }
        }
      } catch (e2) {
        console.warn('Could not parse push data:', e2);
      }
    }
  }
  
  // Show notification - This works even when the app is completely closed
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: false,
      silent: false,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
    }).then(() => {
      console.log('Notification displayed successfully');
    }).catch((error) => {
      console.error('Error showing notification:', error);
    })
  );
});

// Handle notification click - Opens app when notification is tapped
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  // Get notification data if available
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const appUrl = new URL(self.location.origin);
        if (clientUrl.origin === appUrl.origin && 'focus' in client) {
          client.focus();
          if (urlToOpen !== '/' && 'navigate' in client) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // Otherwise, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Install event
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(clients.claim()); // Take control of all pages immediately
});

console.log('Service worker script loaded successfully');

