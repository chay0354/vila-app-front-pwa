let registration = null;
let subscription = null;

// Logging function
function log(message, type = 'info') {
  const logContainer = document.getElementById('log');
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  logEntry.textContent = `[${timestamp}] ${message}`;
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
  console.log(`[${type}]`, message);
}

// Update status
function updateStatus(message) {
  document.getElementById('status').textContent = message;
  log(message);
}

// Check notification permission
function checkPermission() {
  if ('Notification' in window) {
    const permission = Notification.permission;
    document.getElementById('permissionStatus').textContent = permission;
    document.getElementById('permissionStatus').className = `status-${permission}`;
    return permission;
  } else {
    document.getElementById('permissionStatus').textContent = 'Not supported';
    log('Notifications are not supported in this browser', 'error');
    return null;
  }
}

// Register service worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      document.getElementById('swStatus').textContent = 'Registered';
      document.getElementById('swStatus').className = 'status-granted';
      log('Service worker registered successfully', 'success');
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        log('Service worker update found', 'info');
      });
      
      return registration;
    } catch (error) {
      document.getElementById('swStatus').textContent = 'Error';
      document.getElementById('swStatus').className = 'status-denied';
      log(`Service worker registration failed: ${error.message}`, 'error');
      return null;
    }
  } else {
    document.getElementById('swStatus').textContent = 'Not supported';
    log('Service workers are not supported in this browser', 'error');
    return null;
  }
}

// Request notification permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    log('Notifications are not supported in this browser', 'error');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    log('Notification permission already granted', 'success');
    checkPermission();
    document.getElementById('sendTestNotification').disabled = false;
    return true;
  }
  
  if (Notification.permission === 'denied') {
    log('Notification permission was denied. Please enable it in browser settings.', 'error');
    checkPermission();
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    log(`Notification permission: ${permission}`, permission === 'granted' ? 'success' : 'warning');
    checkPermission();
    
    if (permission === 'granted') {
      document.getElementById('sendTestNotification').disabled = false;
      return true;
    }
    return false;
  } catch (error) {
    log(`Error requesting permission: ${error.message}`, 'error');
    return false;
  }
}

// Send test notification directly
async function sendTestNotification() {
  if (Notification.permission !== 'granted') {
    log('Notification permission not granted', 'error');
    return;
  }
  
  try {
    // Send notification through service worker if available
    if (registration && registration.active) {
      registration.active.postMessage({
        type: 'SEND_NOTIFICATION',
        title: 'Test Notification',
        body: `Test notification sent at ${new Date().toLocaleTimeString()}`
      });
      log('Test notification sent via service worker', 'success');
    } else {
      // Fallback to direct notification
      new Notification('Test Notification', {
        body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'test-notification',
        vibrate: [200, 100, 200]
      });
      log('Test notification sent directly', 'success');
    }
  } catch (error) {
    log(`Error sending notification: ${error.message}`, 'error');
  }
}

// Subscribe to push notifications
async function subscribeToPush() {
  if (!registration) {
    log('Service worker not registered', 'error');
    return;
  }
  
  if (!('PushManager' in window)) {
    log('Push messaging is not supported in this browser', 'error');
    return;
  }
  
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa40HI8F7j7k5K8F8GJgv3YPC-a9bS1iON1VjU6JDmtA51VnWzjbKPLdHmJi20'
      )
    });
    
    document.getElementById('subscriptionStatus').textContent = 'Subscribed';
    document.getElementById('subscriptionStatus').className = 'status-granted';
    log('Subscribed to push notifications', 'success');
    log(`Subscription endpoint: ${subscription.endpoint}`, 'info');
    
    return subscription;
  } catch (error) {
    document.getElementById('subscriptionStatus').textContent = 'Error';
    document.getElementById('subscriptionStatus').className = 'status-denied';
    log(`Push subscription failed: ${error.message}`, 'error');
    
    // For Safari, we might not have a valid VAPID key, so just log the error
    if (error.message.includes('key')) {
      log('Note: For production, you need a valid VAPID key', 'warning');
    }
    
    return null;
  }
}

// Convert VAPID key from base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Initialize app
async function init() {
  updateStatus('Initializing PWA...');
  
  // Check permission status
  checkPermission();
  
  // Register service worker
  registration = await registerServiceWorker();
  
  if (registration) {
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    log('Service worker is ready', 'success');
    
    // Check existing push subscription
    try {
      subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        document.getElementById('subscriptionStatus').textContent = 'Already subscribed';
        document.getElementById('subscriptionStatus').className = 'status-granted';
        log('Already subscribed to push notifications', 'info');
      }
    } catch (error) {
      log(`Error checking subscription: ${error.message}`, 'warning');
    }
  }
  
  updateStatus('Ready');
  
  // Enable subscribe button if service worker is ready
  if (registration) {
    document.getElementById('subscribe').disabled = false;
  }
}

// Event listeners
document.getElementById('requestPermission').addEventListener('click', requestNotificationPermission);
document.getElementById('sendTestNotification').addEventListener('click', sendTestNotification);
document.getElementById('subscribe').addEventListener('click', subscribeToPush);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Listen for service worker messages
navigator.serviceWorker.addEventListener('message', (event) => {
  log(`Message from service worker: ${JSON.stringify(event.data)}`, 'info');
});

