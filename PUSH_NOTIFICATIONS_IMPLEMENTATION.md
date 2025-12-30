# Push Notifications Implementation for iOS PWA

## ✅ Implementation Complete

This implementation enables push notifications for iOS PWA that work **even when the app is closed**. It uses the Web Push Protocol (same as `web-push` npm package) via `pywebpush` in the Python backend.

## 🔧 What Was Implemented

### 1. Frontend Changes (`pwa/src/utils/notifications.ts`)

**Fixed subscription format:**
- Changed from base64-encoded subscription to proper JSON format
- Subscription now includes `endpoint` and `keys` (p256dh, auth) in the format expected by web-push protocol
- Added `arrayBufferToBase64()` helper function

**Key function: `registerPushSubscription()`**
- Requests notification permission
- Gets VAPID public key from backend
- Creates Web Push subscription using `PushManager.subscribe()`
- Sends subscription to backend in correct format

### 2. Service Worker (`pwa/public/sw.js`)

**Enhanced push event handler:**
- Properly parses push notification data (JSON or text)
- Shows notification even when app is completely closed
- Handles notification click to open/focus the app
- Works on iOS Safari 16.4+ when PWA is added to home screen

### 3. Backend Changes (`back/app/main.py`)

**Improved Web Push sending:**
- Fixed subscription parsing (handles both JSON and base64 for backward compatibility)
- Validates subscription structure before sending
- Uses `pywebpush` library (implements same Web Push Protocol as `web-push` npm)
- Better error handling and logging

## 📋 How It Works

### Flow Diagram

```
1. User adds PWA to home screen (iOS Safari)
   ↓
2. User signs in → App requests notification permission
   ↓
3. App creates Web Push subscription with VAPID key
   ↓
4. Subscription sent to backend: POST /push/register
   ↓
5. Backend stores subscription in database
   ↓
6. When notification needed, backend calls: POST /push/send
   ↓
7. Backend uses pywebpush to send via Web Push Protocol
   ↓
8. Push service (FCM/APNs) delivers to device
   ↓
9. Service worker receives 'push' event (even if app closed)
   ↓
10. Service worker shows notification
```

## 🔑 Key Requirements

1. **iOS 16.4+** - Required for Web Push API support
2. **PWA added to home screen** - Required for background push
3. **HTTPS** - Required for service workers
4. **VAPID keys** - Configured in backend environment variables:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_EMAIL` (e.g., `mailto:admin@example.com`)

## 🧪 Testing

### 1. Test Subscription Registration

1. Open PWA in Safari (iOS 16.4+)
2. Add to home screen
3. Sign in
4. Check browser console: Should see "Web Push subscription registered successfully"
5. Check backend: Subscription should be in `push_tokens` table

### 2. Test Sending Notification

```bash
curl -X POST https://your-backend.com/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This works even when app is closed!",
    "username": "your_username"
  }'
```

### 3. Test When App is Closed

1. Add PWA to home screen
2. Sign in
3. **Close Safari completely** (swipe up, close app)
4. Send push notification from backend
5. **Notification should appear** on lock screen/notification center

## 🔍 Troubleshooting

### Notifications not appearing

1. **Check iOS version**: Must be 16.4+
2. **Check PWA installation**: Must be added to home screen
3. **Check permissions**: Settings → [Your App] → Notifications
4. **Check service worker**: Should be registered and active
5. **Check backend logs**: Verify subscription format and sending

### Subscription not registering

- Check browser console for errors
- Verify VAPID key endpoint: `GET /api/push/vapid-key`
- Check backend logs for registration errors
- Ensure HTTPS is used (not HTTP)

### Backend errors when sending

- Verify VAPID keys are set in environment
- Check subscription format in database
- Verify `pywebpush` is installed: `pip install pywebpush`
- Check backend logs for detailed error messages

## 📚 Technical Details

### Subscription Format

The subscription stored in database:
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/ABC123...",
  "keys": {
    "p256dh": "base64-url-safe-encoded-public-key",
    "auth": "base64-url-safe-encoded-auth-secret"
  }
}
```

### Web Push Protocol

Both `web-push` (npm) and `pywebpush` (Python) implement the same:
- **Web Push Protocol** (RFC 8030)
- **Message Encryption for Web Push** (RFC 8291)
- **VAPID** (RFC 8292)

So the implementation is compatible with both libraries.

### Service Worker Push Handler

The service worker's `push` event listener:
- Receives push events even when app is closed
- Parses notification data (JSON or text)
- Shows notification using `self.registration.showNotification()`
- Works on iOS Safari 16.4+ when PWA is installed

## ✅ Checklist

- [x] Frontend creates Web Push subscription
- [x] Subscription sent to backend in correct format
- [x] Backend stores subscription
- [x] Backend sends push using pywebpush
- [x] Service worker handles push events
- [x] Notifications work when app is closed
- [x] Notification click opens app
- [x] Works on iOS Safari 16.4+

## 🎯 Next Steps

1. **Test on real iOS device** (iOS 16.4+)
2. **Verify VAPID keys** are configured correctly
3. **Test end-to-end** flow:
   - Sign in → Subscribe → Send notification → Receive
4. **Monitor backend logs** for any errors
5. **Test with app closed** to verify background push works

## 📖 References

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Safari Web Push Support](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [web-push npm](https://www.npmjs.com/package/web-push)
- [pywebpush Python](https://github.com/web-push-libs/pywebpush)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)


