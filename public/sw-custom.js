// Custom service worker for background notifications
// This runs even when the app is closed (if installed as PWA)
// Uses injectManifest mode - workbox code will be injected by VitePWA

// Workbox will inject: importScripts(...) and self.__WB_MANIFEST here
// The injection point is where VitePWA will add workbox code

// API_BASE_URL will be injected by the main app
let API_BASE_URL = ''

// Listen for messages from the main app to set API_BASE_URL
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_API_URL') {
    API_BASE_URL = event.data.url
    // Also store in IndexedDB for persistence
    setStoredValue('API_BASE_URL', event.data.url).catch(() => {})
  }
})

// Load API_BASE_URL from IndexedDB on startup
getStoredValue('API_BASE_URL').then((url) => {
  if (url) API_BASE_URL = url
}).catch(() => {})

// Periodic Background Sync - check for updates when app is closed
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNotifications())
  }
})

// Background sync - fallback for browsers that don't support periodic sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNotifications())
  }
})

// Push event - handle push notifications (if you set up push service later)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const title = data.title || 'bola villa'
  const options = {
    body: data.body || data.message || '',
    icon: '/app-icon.jpg',
    badge: '/app-icon.jpg',
    tag: 'notification',
    data: data,
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click - open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === self.location.origin && 'focus' in client) {
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

// Check for notifications in the background
async function checkForNotifications() {
  try {
    // Load API_BASE_URL if not set
    if (!API_BASE_URL) {
      const storedUrl = await getStoredValue('API_BASE_URL')
      if (storedUrl) API_BASE_URL = storedUrl
      if (!API_BASE_URL) return // Can't check without API URL
    }
    
    // Get user info from IndexedDB
    const userName = await getStoredValue('userName')
    if (!userName) return

    // Get last check timestamp
    const lastCheck = await getStoredValue('lastNotificationCheck') || 0
    const now = Date.now()
    
    // Don't check too frequently (minimum 30 seconds between checks)
    if (now - lastCheck < 30000) return

    // Check for new maintenance tasks assigned to user
    await checkMaintenanceTasks(userName)
    
    // Check for new chat messages
    await checkChatMessages(userName)
    
    // Update last check time
    await setStoredValue('lastNotificationCheck', now)
  } catch (error) {
    console.error('Error checking for notifications:', error)
  }
}

// Check for new maintenance tasks
async function checkMaintenanceTasks(userName) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/maintenance/tasks`)
    if (!response.ok) return
    
    const tasks = await response.json() || []
    const previousTasks = await getStoredValue('previousMaintenanceTasks') || []
    const previousTasksMap = new Map(previousTasks.map((t) => [t.id, t]))
    
    // Get system users to match user IDs
    const usersResponse = await fetch(`${API_BASE_URL}/api/users`)
    const users = usersResponse.ok ? (await usersResponse.json() || []) : []
    const currentUser = users.find((u) => u.username === userName)
    const currentUserId = currentUser?.id?.toString()
    
    for (const task of tasks) {
      const prevTask = previousTasksMap.get(task.id)
      const currentAssignedTo = (task.assigned_to || task.assignedTo || '').toString().trim()
      const prevAssignedTo = prevTask ? ((prevTask.assigned_to || prevTask.assignedTo || '').toString().trim()) : ''
      
      // Check if task was just assigned to current user
      if (currentAssignedTo && currentAssignedTo !== prevAssignedTo) {
        const isAssignedToMe =
          currentAssignedTo === userName ||
          (currentUserId && currentAssignedTo === currentUserId)
        
        if (isAssignedToMe) {
          await self.registration.showNotification('משימה חדשה הוקצתה לך', {
            body: `משימת תחזוקה חדשה: ${task.title || 'ללא כותרת'}`,
            icon: '/app-icon.jpg',
            badge: '/app-icon.jpg',
            tag: 'maintenance-task',
            data: { type: 'maintenance', taskId: task.id },
          })
        }
      }
    }
    
    await setStoredValue('previousMaintenanceTasks', tasks)
  } catch (error) {
    console.error('Error checking maintenance tasks:', error)
  }
}

// Check for new chat messages
async function checkChatMessages(userName) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/messages`)
    if (!response.ok) return
    
    const messages = await response.json() || []
    const previousMessages = await getStoredValue('previousChatMessages') || []
    const previousMessageIds = new Set(previousMessages.map((m) => m.id))
    
    const newMessages = messages.filter(
      (m) => !previousMessageIds.has(m.id) && m.sender !== userName
    )
    
    if (newMessages.length > 0) {
      const latestMessage = newMessages[newMessages.length - 1]
      await self.registration.showNotification(`הודעה חדשה מ-${latestMessage.sender}`, {
        body: latestMessage.content.length > 50
          ? latestMessage.content.substring(0, 50) + '...'
          : latestMessage.content,
        icon: '/app-icon.jpg',
        badge: '/app-icon.jpg',
        tag: 'chat-message',
        data: { type: 'chat', messageId: latestMessage.id },
      })
    }
    
    await setStoredValue('previousChatMessages', messages)
  } catch (error) {
    console.error('Error checking chat messages:', error)
  }
}

// IndexedDB helpers
function getStoredValue(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bola-villa-db', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['store'], 'readonly')
      const store = transaction.objectStore('store')
      const getRequest = store.get(key)
      
      getRequest.onsuccess = () => resolve(getRequest.result?.value)
      getRequest.onerror = () => reject(getRequest.error)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store')
      }
    }
  })
}

function setStoredValue(key, value) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bola-villa-db', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['store'], 'readwrite')
      const store = transaction.objectStore('store')
      const putRequest = store.put({ value }, key)
      
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(putRequest.error)
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store')
      }
    }
  })
}
