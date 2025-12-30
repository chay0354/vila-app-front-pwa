// Custom service worker with push notification support
// Import Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js')

// Precache assets (injected by VitePWA)
// VitePWA will replace self.__WB_MANIFEST with the actual manifest array
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

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

// Push notification handler - Works even when app is closed (iOS 16.4+)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  console.log('App state: Service Worker active (works even when app is closed)')
  
  let notificationData = {
    title: 'התראה חדשה',
    body: 'יש לך התראה חדשה',
    icon: '/app-icon.jpg',
    badge: '/app-icon.jpg',
    tag: 'notification',
    data: {},
  }
  
  // Try to parse push data
  if (event.data) {
    try {
      const data = event.data.json()
      if (data.title) notificationData.title = data.title
      if (data.body) notificationData.body = data.body
      if (data.icon) notificationData.icon = data.icon
      if (data.badge) notificationData.badge = data.badge
      if (data.tag) notificationData.tag = data.tag
      if (data.data) notificationData.data = data.data
    } catch (e) {
      // If not JSON, try text
      try {
        const text = event.data.text()
        if (text) {
          // Try to parse as JSON string
          try {
            const parsed = JSON.parse(text)
            notificationData = { ...notificationData, ...parsed }
          } catch {
            // If not JSON, use as body
            notificationData.body = text
          }
        }
      } catch (e2) {
        console.warn('Could not parse push data:', e2)
      }
    }
  }
  
  // Show notification - This works even when the app is completely closed
  // iOS Safari 16.4+ supports this via Web Push API
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: false,
      silent: false,
      data: notificationData.data,
      // iOS Safari specific options
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
    }).then(() => {
      console.log('Notification displayed successfully')
    }).catch((error) => {
      console.error('Error showing notification:', error)
    })
  )
})

// Handle notification click - Opens app when notification is tapped
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  event.notification.close()
  
  // Get notification data if available
  const notificationData = event.notification.data || {}
  const urlToOpen = notificationData.url || '/'
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        // Check if client URL matches our app
        const clientUrl = new URL(client.url)
        const appUrl = new URL(self.location.origin)
        if (clientUrl.origin === appUrl.origin && 'focus' in client) {
          // Focus existing window and navigate if needed
          client.focus()
          if (urlToOpen !== '/' && 'navigate' in client) {
            client.navigate(urlToOpen)
          }
          return
        }
      }
      // Otherwise, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

