/**
 * Notification utility for PWA
 * Supports Web Notifications API with Safari PWA compatibility
 */

/**
 * Initialize notifications for the PWA
 */
export const initializeNotifications = async (): Promise<void> => {
  if (typeof window === 'undefined') return

  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('Web notifications not supported in this browser')
    return
  }

  // Request permission if not already granted/denied
  if (Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        console.log('Web notification permission granted')
      } else {
        console.warn('Web notification permission denied')
      }
    } catch (error) {
      console.warn('Error requesting web notification permission:', error)
    }
  } else if (Notification.permission === 'granted') {
    console.log('Web notification permission already granted')
  }
}

/**
 * Show a notification
 */
export const showNotification = async (title: string, message: string): Promise<void> => {
  if (typeof window === 'undefined') return

  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return
  }

  // If permission is granted, show notification
  if (Notification.permission === 'granted') {
    try {
      // Try to use service worker first (better for PWA, especially Safari)
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          await registration.showNotification(title, {
            body: message,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'notification',
            requireInteraction: false,
            silent: false,
          })
          return
        } catch (error) {
          console.warn('Error showing notification via service worker:', error)
          // Fall through to direct notification
        }
      }

      // Fallback: Direct notification (works in Safari PWA)
      new Notification(title, {
        body: message,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'notification',
      })
    } catch (error) {
      console.warn('Error showing notification:', error)
    }
  } else if (Notification.permission === 'default') {
    // Request permission first
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
        })
      }
    } catch (error) {
      console.warn('Error requesting notification permission:', error)
    }
  }
}

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = (): boolean => {
  if (typeof window === 'undefined') return false
  return 'Notification' in window
}

/**
 * Get notification permission status
 */
export const getNotificationPermission = (): NotificationPermission | 'unknown' => {
  if (typeof window === 'undefined') return 'unknown'
  if ('Notification' in window) {
    return Notification.permission
  }
  return 'unknown'
}

