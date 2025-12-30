# iOS PWA Push Notifications Setup

This guide explains how push notifications work for iOS PWA (Progressive Web App) added to home screen from Safari.

## ✅ Requirements

- **iOS 16.4+** (required for Web Push API support)
- **Safari browser** (not Chrome/Firefox on iOS)
- **PWA must be added to home screen** (required for background push)
- **HTTPS** (required for service workers and push notifications)
- **VAPID keys** configured on backend

## 🔑 How It Works

### 1. User Adds PWA to Home Screen

1. Open the PWA in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The PWA is now installed

### 2. User Signs In

When the user signs in:
- App requests notification permission
- Creates Web Push subscription with VAPID key
- Sends subscription to backend: `POST /push/register`
- Backend stores subscription in database

### 3. Backend Sends Push Notification

When backend sends a notification:
- Uses `pywebpush` (Python) or `web-push` (Node.js) library
- Sends to subscription endpoint (e.g., `https://fcm.googleapis.com/fcm/send/...`)
- Push service delivers to device
- **Service worker receives push event even when app is closed**
- Notification appears on device

### 4. User Receives Notification

- Notification appears on lock screen
- Notification appears in notification center
- Works even when:
  - App is completely closed
  - Device is locked
  - Safari is not running

## 📱 Testing

### Test Push Subscription

1. Sign in to the PWA
2. Check browser console for: "Web Push subscription registered successfully"
3. Check backend logs to verify subscription was saved

### Test Sending Notification

```bash
curl -X POST https://your-backend.com/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test push notification",
    "username": "your_username"
  }'
```

### Verify It Works When App is Closed

1. Add PWA to home screen
2. Sign in
3. **Close Safari completely** (swipe up and close)
4. Send a push notification from backend
5. Notification should appear on device

## 🔧 Technical Details

### Frontend (PWA)

**File: `src/utils/notifications.ts`**
- `registerPushSubscription()` - Creates Web Push subscription
- Converts VAPID key to Uint8Array format
- Sends subscription to backend

**File: `public/sw.js`**
- Service worker handles `push` event
- Shows notification even when app is closed
- Handles `notificationclick` to open app

### Backend

**File: `back/app/main.py`**
- `/push/register` - Stores push subscription
- `/push/send` - Sends push notification using `pywebpush`
- Uses VAPID keys for authentication

### Subscription Format

The subscription sent to backend:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "base64-encoded-public-key",
    "auth": "base64-encoded-auth-secret"
  }
}
```

## 🐛 Troubleshooting

### Notifications Not Appearing

1. **Check iOS version**: Must be 16.4+
2. **Check if PWA is added to home screen**: Required for background push
3. **Check notification permission**: Settings → [Your App] → Notifications
4. **Check service worker**: Should be registered and active
5. **Check backend logs**: Verify subscription was saved and notification was sent

### Subscription Not Registering

1. Check browser console for errors
2. Verify VAPID public key is available: `GET /api/push/vapid-key`
3. Check backend logs for registration errors
4. Verify HTTPS is being used (not HTTP)

### Notifications Only Work When App is Open

- This means service worker push handler is not working
- Check service worker is registered: `navigator.serviceWorker.ready`
- Check service worker file is accessible: `/sw.js`
- Verify service worker has `push` event listener

## 📚 Resources

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Safari Web Push Support](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [web-push npm package](https://www.npmjs.com/package/web-push)
- [pywebpush Python package](https://github.com/web-push-libs/pywebpush)

## ✅ Checklist

- [ ] iOS 16.4+ device
- [ ] PWA added to home screen
- [ ] Notification permission granted
- [ ] Service worker registered
- [ ] VAPID keys configured on backend
- [ ] Push subscription registered after sign-in
- [ ] Backend can send push notifications
- [ ] Notifications appear when app is closed

## 🎯 Key Points

1. **Must be added to home screen** - This is required for background push on iOS
2. **Service worker handles push** - Even when app is closed, service worker receives push events
3. **Web Push Protocol** - Uses standard Web Push Protocol (same as Chrome/Edge)
4. **VAPID authentication** - Required for Web Push on all platforms
5. **Works offline** - Service worker can receive push even when device is offline (queued)


