// Custom service worker with push notification support
// VitePWA will inject precaching code here via self.__WB_MANIFEST

// Import Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js')

// Precache assets (injected by VitePWA)
if (self.__WB_MANIFEST) {
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)
}

// Cache images
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null
        },
      },
    ],
  })
)

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  let notificationData = {
    title: 'התראה חדשה',
    body: 'יש לך התראה חדשה',
    icon: '/app-icon.jpg',
    badge: '/app-icon.jpg',
    tag: 'notification',
  }
  
  // Try to parse push data
  if (event.data) {
    try {
      const data = event.data.json()
      if (data.title) notificationData.title = data.title
      if (data.body) notificationData.body = data.body
      if (data.icon) notificationData.icon = data.icon
    } catch (e) {
      // If not JSON, try text
      try {
        const text = event.data.text()
        if (text) notificationData.body = text
      } catch (e2) {
        console.warn('Could not parse push data:', e2)
      }
    }
  }
  
  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: false,
      silent: false,
    })
  )
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  event.notification.close()
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

