# How to Check if Push Events Are Being Received

## Step 1: Open Service Worker Console

1. Press **F12** (open DevTools)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. Find your service worker: `http://localhost:5173/sw-simple.js`
5. Click the **"inspect"** link (opens service worker console in a new window)

## Step 2: Send Test Notification

Keep the service worker console open and visible, then run:

```powershell
.\send-test-push.ps1 -Username test21
```

## Step 3: Watch the Console

**You should see one of these:**

### ✅ If it's working:
```
🔔 PUSH EVENT RECEIVED!
App state: Service Worker active
Event data: Has data
✅ Notification displayed successfully
```

### ❌ If push event isn't received:
- No logs appear in service worker console
- This means the push event isn't reaching the service worker
- **Possible causes:**
  - Subscription endpoint is invalid
  - VAPID keys don't match
  - Backend error sending push

### ⚠️ If push event received but notification fails:
```
🔔 PUSH EVENT RECEIVED!
❌ Error showing notification: [error message]
```
- This means the push arrived but showing notification failed
- Check the error message for details

## Step 4: Check Backend Logs

Look at your backend terminal (where `python run_server.py` is running).

**You should see:**
```
Web Push sent successfully to https://fcm.googleapis.com/fcm/send/...
```

**If you see errors:**
- `Web Push error: ...` - Check the error message
- Common issues: Invalid subscription, expired token, VAPID key mismatch

## Troubleshooting

### No push event in service worker console:
1. **Check subscription is valid:**
   - Go back to test page
   - Click "Check Subscription"
   - Verify endpoint starts with `https://fcm.googleapis.com/`

2. **Check backend sent successfully:**
   - Look at backend terminal logs
   - Should see "Web Push sent successfully"

3. **Verify VAPID keys match:**
   - Frontend gets public key from `/api/push/vapid-key`
   - Backend uses private key from environment
   - They must be a matching pair

### Push event received but no notification:
1. Check Chrome notification settings: `chrome://settings/content/notifications`
2. Check Windows Focus Assist (might be suppressing)
3. Check service worker console for error messages












