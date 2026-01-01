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

/**
 * Get VAPID public key from backend
 */
async function getVapidPublicKey(apiBaseUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/push/vapid-key`)
    if (res.ok) {
      const data = await res.json()
      return data.publicKey || null
    }
  } catch (error) {
    console.warn('Error fetching VAPID key:', error)
  }
  return null
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Register Web Push subscription for background notifications
 * Works on iOS 16.4+ PWA with proper Web Push API
 */
export const registerPushSubscription = async (username: string, apiBaseUrl: string): Promise<void> => {
  if (typeof window === 'undefined') return

  // Check if Web Push is supported (iOS 16.4+)
  if (!('serviceWorker' in navigator)) {
    console.error('❌ Service Worker not supported - Web Push requires service workers')
    console.error('   This usually means:')
    console.error('   - Not using HTTPS')
    console.error('   - Browser doesn\'t support service workers')
    // Fallback: register device token
    try {
      const deviceId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await fetch(`${apiBaseUrl}/push/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          token: deviceId,
          platform: 'web',
        }),
      })
      console.warn('⚠️ Registered fallback token (Web Push not available)')
    } catch (error) {
      console.warn('Error registering fallback token:', error)
    }
    return
  }

  if (!('PushManager' in window)) {
    console.error('❌ PushManager not supported - Web Push API not available')
    console.error('   This usually means:')
    console.error('   - iOS version < 16.4 (Web Push requires iOS 16.4+)')
    console.error('   - PWA not added to home screen (required for iOS)')
    console.error('   - Using Chrome/Firefox on iOS (must use Safari)')
    // Fallback: register device token
    try {
      const deviceId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await fetch(`${apiBaseUrl}/push/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          token: deviceId,
          platform: 'web',
        }),
      })
      console.warn('⚠️ Registered fallback token (Web Push not available)')
    } catch (error) {
      console.warn('Error registering fallback token:', error)
    }
    return
  }

  // Check notification permission
  if (Notification.permission !== 'granted') {
    console.error('❌ Notification permission not granted')
    console.error('   Current permission:', Notification.permission)
    console.error('   User must grant notification permission for Web Push to work')
    console.error('   On iOS: Settings → [Your App] → Notifications → Allow Notifications')
    return
  }

  try {
    // Get VAPID public key from backend
    const vapidPublicKey = await getVapidPublicKey(apiBaseUrl)
    
    if (!vapidPublicKey) {
      console.error('❌ VAPID public key not available from backend')
      console.error('   Backend must have VAPID_PUBLIC_KEY configured')
      // Fallback to device token
      const deviceId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await fetch(`${apiBaseUrl}/push/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          token: deviceId,
          platform: 'web',
        }),
      })
      console.warn('⚠️ Registered fallback token (VAPID key not available)')
      return
    }

    console.log('✅ VAPID key received, registering service worker...')
    
    // Get service worker registration
    let registration
    try {
      registration = await navigator.serviceWorker.ready
      console.log('✅ Service worker ready')
    } catch (error: any) {
      console.error('❌ Service worker not ready:', error.message)
      console.error('   Make sure service worker is registered and active')
      throw error
    }

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
    console.log('✅ VAPID key converted, subscribing to push...')

    // Subscribe to push notifications with VAPID key
    let subscription
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      })
      console.log('✅ Web Push subscription created successfully!')
      console.log('   Endpoint:', subscription.endpoint.substring(0, 50) + '...')
    } catch (error: any) {
      console.error('❌ Failed to create Web Push subscription:', error.message)
      console.error('   Common causes:')
      console.error('   - PWA not added to home screen (iOS requirement)')
      console.error('   - Notification permission denied')
      console.error('   - Service worker not active')
      throw error
    }

    // Convert PushSubscription to the format expected by web-push
    // The subscription object needs to be serialized properly
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    }

    // Store the full subscription JSON as the token for the backend
    const token = JSON.stringify(subscriptionData)

    // Register with backend
    const res = await fetch(`${apiBaseUrl}/push/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        token,
        platform: 'web',
      }),
    })

    if (res.ok) {
      console.log('Web Push subscription registered successfully (iOS 16.4+ compatible)')
    } else {
      console.warn('Failed to register Web Push subscription:', res.status)
    }
  } catch (error: any) {
    console.error('❌ Error creating Web Push subscription:', error.message)
    console.error('   Full error:', error)
    console.error('   Stack:', error.stack)
    
    // Fallback: register device token
    console.warn('⚠️ Falling back to device token (Web Push subscription failed)')
    try {
      const deviceId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await fetch(`${apiBaseUrl}/push/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          token: deviceId,
          platform: 'web',
        }),
      })
      console.warn('⚠️ Registered fallback token - push notifications will NOT work')
      console.warn('   To fix: Check the errors above and ensure:')
      console.warn('   1. iOS 16.4+')
      console.warn('   2. PWA added to home screen')
      console.warn('   3. Notification permission granted')
      console.warn('   4. Service worker registered')
      console.warn('   5. VAPID keys configured in backend')
    } catch (fallbackError) {
      console.error('❌ Error registering fallback token:', fallbackError)
    }
  }
}

/**
 * Start background polling for notifications (works on iOS PWA)
 */
export const startBackgroundPolling = (username: string, apiBaseUrl: string, onNotification: (title: string, body: string) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}
  
  let lastCheckTime = Date.now()
  let pollInterval: number | null = null
  
  const checkForNotifications = async () => {
    try {
      // Check for new chat messages
      const chatRes = await fetch(`${apiBaseUrl}/api/chat/messages?limit=1&order=created_at.desc`)
      if (chatRes.ok) {
        const messages = await chatRes.json()
        if (messages && messages.length > 0) {
          const latestMessage = messages[0]
          const messageTime = new Date(latestMessage.created_at).getTime()
          if (messageTime > lastCheckTime && latestMessage.sender !== username) {
            onNotification('הודעה חדשה', `${latestMessage.sender}: ${latestMessage.content}`)
            lastCheckTime = messageTime
          }
        }
      }
      
      // Check for new maintenance task assignments
      const tasksRes = await fetch(`${apiBaseUrl}/api/maintenance/tasks`)
      if (tasksRes.ok) {
        const tasks = await tasksRes.json()
        const userTasks = tasks.filter((t: any) => {
          const assignedTo = (t.assigned_to || t.assignedTo || '').toString()
          return assignedTo === username || assignedTo.includes(username)
        })
        if (userTasks.length > 0) {
          const newTasks = userTasks.filter((t: any) => {
            const taskTime = new Date(t.created_at || t.updated_at).getTime()
            return taskTime > lastCheckTime
          })
          if (newTasks.length > 0) {
            onNotification('משימה חדשה', `הוקצתה לך משימת תחזוקה חדשה`)
            lastCheckTime = Date.now()
          }
        }
      }
    } catch (error) {
      console.warn('Error checking for notifications:', error)
    }
  }
  
  // Poll every 30 seconds when page is visible, every 2 minutes when hidden
  const startPolling = () => {
    if (pollInterval) clearInterval(pollInterval)
    
    const interval = document.hidden ? 120000 : 30000 // 2 min when hidden, 30 sec when visible
    pollInterval = window.setInterval(checkForNotifications, interval)
    checkForNotifications() // Check immediately
  }
  
  // Handle visibility changes
  const handleVisibilityChange = () => {
    startPolling()
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  startPolling()
  
  // Return cleanup function
  return () => {
    if (pollInterval) clearInterval(pollInterval)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

