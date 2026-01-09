# Debug Service Worker Push Events

## Using chrome://serviceworker-internals

### Step 1: Open Service Worker Internals
1. Open Chrome
2. Go to: `chrome://serviceworker-internals/?devtools`
3. You'll see a list of all registered service workers

### Step 2: Find Your Service Worker
Look for:
- **Scope:** `http://localhost:5173/`
- **Script:** `http://localhost:5173/sw-simple.js`
- **Status:** Should show "activated and running"

### Step 3: Open Service Worker Console
1. Click the **"inspect"** link next to your service worker
2. This opens a new DevTools window specifically for the service worker
3. **Keep this window open and visible**

### Step 4: Test Push Event Reception
1. **Close your browser tab** (the test page)
2. **Send notification from terminal:**
   ```powershell
   .\send-test-push.ps1 -Username test21
   ```
3. **Watch the service worker console window**

### Step 5: What to Look For

**✅ If you see:**
```
🔔 PUSH EVENT RECEIVED!
📊 Total push events received: 1
✅ Notification displayed successfully
```
**→ Push is working!** The service worker received the event.
- If notification doesn't appear, it's a Chrome display issue
- Check Windows Focus Assist and Chrome notification settings

**❌ If you DON'T see "🔔 PUSH EVENT RECEIVED!":**
**→ Push event isn't reaching the service worker**
- Check backend logs for errors
- Verify VAPID keys match
- Check subscription endpoint is valid
- Subscription might be expired/invalid

## Alternative: Application Panel Method

1. **Open any page** on `http://localhost:5173`
2. Press **F12** (DevTools)
3. Go to **Application** tab
4. Click **Service Workers** in left sidebar
5. Find `sw-simple.js`
6. Click **"inspect"** link
7. Service worker console opens
8. Follow steps 4-5 above

## What the Logs Mean

### Service Worker Console Shows:
- `🔔 PUSH EVENT RECEIVED!` → Push event arrived ✅
- `✅ Notification displayed successfully` → Notification was shown ✅
- `❌ Error showing notification: ...` → Error displaying notification ❌
- No logs at all → Push event didn't arrive ❌

### Backend Logs Show:
- `Web Push sent successfully` → Backend sent successfully ✅
- `Web Push error: ...` → Backend had error sending ❌

## Troubleshooting

### Push Event Received But No Notification:
1. Check Chrome: `chrome://settings/content/notifications`
2. Check Windows Focus Assist
3. Check Windows notification center (click notification icon)
4. Try with tab open first to verify notifications work

### Push Event NOT Received:
1. Check backend logs for errors
2. Verify subscription is valid (not expired)
3. Check VAPID keys match between frontend and backend
4. Verify subscription endpoint is accessible
5. Try creating a new subscription

## Success Criteria

You'll know it's working when:
- ✅ Service worker console shows "🔔 PUSH EVENT RECEIVED!"
- ✅ Service worker console shows "✅ Notification displayed successfully"
- ✅ Notification appears in system notification center
- ✅ Works even when browser tab is closed













