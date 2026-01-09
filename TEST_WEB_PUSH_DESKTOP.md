# Test Web Push Notifications on Desktop Browser

You can test Web Push notifications in Chrome, Edge, or Firefox on your computer. The Web Push Protocol is the same, so if it works in Chrome, it will work in iOS Safari (when properly installed).

## Quick Test (Easiest Method)

### 1. Start PWA Dev Server

```powershell
cd C:\projects\vila-app\pwa
npm run dev
```

This will start the dev server at `http://localhost:5173`

### 2. Open Test Page in Browser

Open in Chrome/Edge/Firefox:
```
http://localhost:5173/test-push-page.html
```

### 3. Test Push Subscription

1. Click **"Request Permission"** → Allow notifications
2. Click **"Subscribe to Push"** → Creates Web Push subscription
3. Enter your username when prompted (e.g., `employee1`)
4. Click **"Register with Backend"** → Saves subscription to database

### 4. Test Sending Notification

**Option A: Use the test script**
```powershell
cd C:\projects\vila-app\pwa
.\send-test-push.ps1 -Username employee1
```

**Option B: Use the "🔔 Test Direct Notification" button**
- Click the button on the test page
- This sends a notification directly (bypasses backend)

### 5. Close Browser Tab and Test

1. **Close the browser tab completely**
2. Send a push notification from backend
3. **Notification should appear** even though tab is closed!

## Alternative: Use Standalone Test Page

### 1. Start HTTP Server

```powershell
cd C:\projects\vila-app\pwa
.\serve-test-page.ps1
```

This starts a server on `http://localhost:8080`

### 2. Open Test Page

Open in browser:
```
http://localhost:8080/test-push-page.html
```

### 3. Follow Same Steps

Same as above - request permission, subscribe, register, test.

## What to Check

### ✅ Success Indicators

1. **Subscription Created:**
   - Console shows: "✅ Push subscription created!"
   - Subscription status shows JSON with `endpoint` and `keys`

2. **Registered with Backend:**
   - Console shows: "✅ Subscription registered with backend!"
   - Check database - token should be JSON (not `web-timestamp-random`)

3. **Notification Received:**
   - Notification appears in system notification center
   - Works even when browser tab is closed

### ❌ Common Issues

1. **"Service Worker not found"**
   - Make sure you're using HTTP (not `file://`)
   - Check service worker file exists: `/sw-simple.js` or `/sw.js`

2. **"Permission denied"**
   - Click browser notification icon in address bar
   - Or: Browser Settings → Site Settings → Notifications → Allow

3. **"VAPID key not available"**
   - Check backend is running
   - Check backend has VAPID keys in `.env`
   - Test: `GET http://127.0.0.1:4000/api/push/vapid-key`

## Testing Background Notifications

To test that notifications work when the app is closed:

1. **Subscribe and register** (follow steps above)
2. **Close the browser tab completely**
3. **Send notification from backend:**
   ```powershell
   .\send-test-push.ps1 -Username employee1
   ```
4. **Notification should appear** in system notification center!

## Differences: Desktop vs iOS

| Feature | Desktop Browser | iOS Safari PWA |
|---------|----------------|----------------|
| Web Push Protocol | ✅ Same | ✅ Same |
| Works when closed | ✅ Yes | ✅ Yes (if added to home screen) |
| Service Worker | ✅ Yes | ✅ Yes |
| VAPID Keys | ✅ Required | ✅ Required |
| Testing | ✅ Easy | ⚠️ Requires real device |

**Important:** The Web Push Protocol is identical, so if it works in Chrome, it will work in iOS Safari when:
- iOS 16.4+
- PWA added to home screen
- Notification permission granted

## Debug Console

Open browser DevTools (F12) and check:

1. **Console tab** - Look for:
   - ✅ "Service worker ready"
   - ✅ "VAPID key received"
   - ✅ "Push subscription created!"
   - ✅ "Subscription registered with backend!"

2. **Application tab** → **Service Workers**:
   - Should show service worker as "activated and running"
   - Click "inspect" to see service worker console

3. **Application tab** → **Storage** → **Notifications**:
   - Should show registered push subscription

## Next Steps

Once you verify it works in Chrome:
1. ✅ Web Push subscription is created correctly
2. ✅ Backend can send notifications
3. ✅ Service worker receives push events
4. ✅ Notifications appear when tab is closed

Then on iPhone:
- Same protocol, same code
- Just need to add PWA to home screen
- Should work the same way!












