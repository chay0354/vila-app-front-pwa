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
        // Register periodic background sync if supported
        await registerBackgroundSync()
      } else {
        console.warn('Web notification permission denied')
      }
    } catch (error) {
      console.warn('Error requesting web notification permission:', error)
    }
  } else if (Notification.permission === 'granted') {
    console.log('Web notification permission already granted')
    // Register periodic background sync if supported
    await registerBackgroundSync()
  }
}

/**
 * Register periodic background sync for notifications when app is closed
 */
async function registerBackgroundSync(): Promise<void> {
  if (typeof window === 'undefined') return
  
  if (!('serviceWorker' in navigator)) return
  
  try {
    const registration = await navigator.serviceWorker.ready
    
    // Try Periodic Background Sync (Chrome/Edge - requires PWA to be installed)
    if ('periodicSync' in (registration as any)) {
      try {
        const permissionStatus = await (navigator as any).permissions.query({ 
          name: 'periodic-background-sync' as PermissionName 
        })
        
        if (permissionStatus.state === 'granted') {
          await (registration as any).periodicSync.register('check-notifications', {
            minInterval: 60000, // Minimum 1 minute (browser may increase this)
          })
          console.log('Periodic background sync registered - notifications will work when app is closed')
        } else {
          console.log('Periodic sync permission not granted - will use fallback')
          // Fall through to background sync
        }
      } catch (error: any) {
        console.warn('Periodic sync not available:', error.message)
        // Fall through to background sync
      }
    }
    
    // Fallback: Use regular background sync (one-time sync when connection is restored)
    if ('sync' in (registration as any)) {
      try {
        await (registration as any).sync.register('check-notifications')
        console.log('Background sync registered (fallback) - will sync when connection restored')
      } catch (error) {
        console.warn('Error registering background sync:', error)
      }
    }
  } catch (error) {
    console.warn('Error setting up background sync:', error)
  }
}

/**
 * Store user data in IndexedDB for service worker access
 */
export const storeUserDataForBackgroundSync = async (userName: string | null): Promise<void> => {
  if (typeof window === 'undefined') return
  
  try {
    const db = await openIndexedDB()
    const transaction = db.transaction(['store'], 'readwrite')
    const store = transaction.objectStore('store')
    
    if (userName) {
      await store.put({ value: userName }, 'userName')
    } else {
      await store.delete('userName')
    }
    
    // Send API URL to service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if (registration.active) {
          registration.active.postMessage({
            type: 'SET_API_URL',
            url: import.meta.env.API_BASE_URL || '',
          })
        }
      } catch (error) {
        console.warn('Error sending API URL to service worker:', error)
      }
    }
  } catch (error) {
    console.warn('Error storing user data for background sync:', error)
  }
}

/**
 * Open IndexedDB database
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bola-villa-db', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store')
      }
    }
  })
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

