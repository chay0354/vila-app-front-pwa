# Fix: Service Worker Works But Notifications Don't Appear

## ✅ Your Service Worker is Working!

The logs show:
- ✅ Push event received
- ✅ Notification displayed successfully

This means the service worker is working perfectly. The issue is Chrome blocking the notification display.

## 🔧 Fix Chrome Notification Settings

### Step 1: Open Chrome Notification Settings

1. Copy this URL: `chrome://settings/content/notifications`
2. Paste it in Chrome address bar and press Enter

### Step 2: Check localhost Settings

Look for:
- `localhost`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

**If you see it in "Not allowed to send notifications":**
1. Click the **X** next to it to remove
2. Go back to your test page
3. Refresh the page
4. Click "Request Permission" again
5. Click **"Allow"** when prompted

**If you don't see localhost:**
- It might be in "Allowed to send notifications" but still blocked
- Try removing it and re-adding

### Step 3: Verify It Works

1. Go back to your test page
2. Click the "Push" button in DevTools
3. **Notification should now appear!**

## 🧪 Test Backend Push

Once Chrome notifications work:

1. **Close the browser tab completely**
2. Send notification from backend:
   ```powershell
   .\send-test-push.ps1 -Username test21
   ```
3. **Notification should appear even with tab closed!**

## ✅ Success Indicators

You'll know it's working when:
- ✅ You see notifications appear on screen
- ✅ Notifications work when tab is closed
- ✅ Service worker console shows "Notification displayed successfully"
- ✅ No errors in console

## 🐛 Still Not Working?

1. **Check Windows Focus Assist:**
   - Windows Settings → System → Focus Assist
   - Turn it off temporarily

2. **Check Chrome is not in "Do Not Disturb":**
   - Chrome menu → Settings → Notifications
   - Make sure notifications are enabled

3. **Try a different browser:**
   - Edge works the same way
   - Firefox also supports Web Push

4. **Check system notification center:**
   - Windows: Click notification icon (bottom right)
   - Sometimes notifications appear there even if not as a popup











