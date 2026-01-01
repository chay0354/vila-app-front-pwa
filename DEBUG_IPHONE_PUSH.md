# Debug iPhone PWA Push Notifications

## Problem: Fallback Token Registered

If you see a token like `web-1767109942578-jqjoq0lny` in the database, it means the iPhone PWA **failed to create a real Web Push subscription** and fell back to a dummy token.

**This token will NOT work for push notifications!**

## How to Debug

### 1. Check Browser Console on iPhone

1. Open the PWA on iPhone (from home screen)
2. Open Safari Developer Tools (if available) or use remote debugging
3. Sign in to the app
4. Look for error messages in the console

The improved error logging will show exactly what failed:

- ❌ **Service Worker not supported** → Not using HTTPS or browser issue
- ❌ **PushManager not available** → iOS < 16.4 or PWA not added to home screen
- ❌ **Notification permission denied** → User denied permission
- ❌ **VAPID key not available** → Backend not configured
- ❌ **Service worker not ready** → Service worker registration issue
- ❌ **Subscription creation failed** → Check specific error message

### 2. Common Issues and Fixes

#### Issue: PushManager not available

**Symptoms:**
- Token starts with `web-` followed by timestamp
- Console shows "PushManager not supported"

**Causes:**
1. **iOS version < 16.4** → Web Push requires iOS 16.4+
2. **PWA not added to home screen** → **MOST COMMON ISSUE**
3. **Using Chrome/Firefox on iOS** → Must use Safari

**Fix:**
1. Open PWA in Safari (not Chrome/Firefox)
2. Tap Share button
3. Select "Add to Home Screen"
4. Open PWA from home screen (not Safari)
5. Sign in again

#### Issue: Notification Permission Denied

**Symptoms:**
- Console shows "Notification permission not granted"
- Permission status is "denied" or "default"

**Fix:**
1. iPhone Settings → [Your App Name]
2. Tap "Notifications"
3. Enable "Allow Notifications"
4. Sign in to PWA again

#### Issue: VAPID Key Not Available

**Symptoms:**
- Console shows "VAPID public key not available"
- Backend returns 404 or empty response for `/api/push/vapid-key`

**Fix:**
1. Check backend `.env` file has:
   ```
   VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   VAPID_EMAIL=mailto:admin@bolavilla.com
   ```
2. Restart backend server
3. Test: `GET /api/push/vapid-key` should return the public key

#### Issue: Service Worker Not Ready

**Symptoms:**
- Console shows "Service worker not ready"
- Service worker registration failed

**Fix:**
1. Check service worker file exists: `/sw.js` or `/sw-simple.js`
2. Check service worker is registered: `navigator.serviceWorker.ready`
3. Check browser console for service worker errors
4. Ensure using HTTPS (not HTTP)

### 3. Verify Real Web Push Subscription

A **real** Web Push subscription token looks like this:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "base64-encoded-key...",
    "auth": "base64-encoded-key..."
  }
}
```

The token in the database should be a **JSON string** of this object, not `web-timestamp-random`.

### 4. Testing Steps

1. **Delete the fallback token** from database:
   ```sql
   DELETE FROM push_tokens WHERE username = 'employee1' AND token LIKE 'web-%';
   ```

2. **On iPhone:**
   - Ensure iOS 16.4+
   - Open PWA in Safari
   - Add to home screen
   - Open from home screen
   - Grant notification permission
   - Sign in

3. **Check console** for:
   - ✅ "Service worker ready"
   - ✅ "VAPID key received"
   - ✅ "Web Push subscription created successfully!"
   - ✅ "Web Push subscription registered successfully"

4. **Check database** - token should be JSON, not `web-...`

### 5. Quick Diagnostic Script

Run this in the browser console on iPhone (after signing in):

```javascript
// Check Web Push support
console.log('Service Worker:', 'serviceWorker' in navigator);
console.log('PushManager:', 'PushManager' in window);
console.log('Notification Permission:', Notification.permission);

// Check service worker
navigator.serviceWorker.ready.then(reg => {
  console.log('Service Worker Ready:', reg.active ? 'Yes' : 'No');
  console.log('Service Worker Scope:', reg.scope);
  
  // Check existing subscription
  reg.pushManager.getSubscription().then(sub => {
    if (sub) {
      console.log('✅ Existing subscription found!');
      console.log('Endpoint:', sub.endpoint);
    } else {
      console.log('❌ No subscription found');
    }
  });
});
```

## Expected Flow

1. User opens PWA from home screen (not Safari)
2. User signs in
3. App requests notification permission → User grants
4. App gets VAPID key from backend
5. App creates Web Push subscription
6. App sends subscription to backend
7. Backend stores subscription (should be JSON, not `web-...`)
8. ✅ Push notifications will work!

## Still Not Working?

1. Check iPhone iOS version (must be 16.4+)
2. Verify PWA is added to home screen
3. Check notification permission in iPhone Settings
4. Check backend logs for VAPID key endpoint
5. Check service worker is registered and active
6. Try signing out and signing in again




