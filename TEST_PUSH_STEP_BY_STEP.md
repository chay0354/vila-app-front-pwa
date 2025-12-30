# Step-by-Step: Testing Push Notifications Locally

## Prerequisites

1. **Backend running** on `http://127.0.0.1:4000`
2. **PWA dev server running** (or use the simple HTTP server)

## Step 1: Start the Servers

### Terminal 1 - Backend:
```powershell
cd back
python run_server.py
```
Wait for: "Starting server on 0.0.0.0:4000"

### Terminal 2 - PWA Dev Server:
```powershell
cd pwa
npm run dev
```
Wait for: "Local: http://localhost:5173"

## Step 2: Open the Test Page

**Open in your browser:**
```
http://localhost:5173/test-push-page.html
```

*(If you don't have the dev server running, use: `.\serve-test-page.ps1` and open `http://localhost:8080/test-push-page.html`)*

## Step 3: Request Notification Permission

1. On the test page, click **"1. Request Permission"**
2. Browser will show a popup asking for notification permission
3. Click **"Allow"** or **"Allow notifications"**
4. You should see: ✅ "Notification permission granted"

## Step 4: Subscribe to Push Notifications

1. Click **"2. Subscribe to Push"** button (should now be enabled)
2. Wait for the logs to show:
   - ✅ Service worker registered
   - ✅ VAPID key received
   - ✅ Push subscription created!
3. You'll see your subscription details displayed

## Step 5: Register with Backend

1. A prompt will appear asking for your username
2. Enter your username (e.g., "test_user")
3. Click OK
4. You should see: ✅ "Subscription registered with backend!"

*(If you missed the prompt, click "Register with Backend" button)*

## Step 6: Close the Browser Tab

**IMPORTANT:** 
- **Close the browser tab completely** (click the X, don't just minimize)
- The service worker will continue running in the background
- This is the key test - notifications should work even when the app is closed!

## Step 7: Send Test Notification

**Open a new terminal** (Terminal 3):

```powershell
cd pwa
.\send-test-push.ps1 -Username your_username
```

Replace `your_username` with the username you entered in Step 5.

You should see:
```
[SUCCESS] Notification sent!
Sent to: 1 device(s)
```

## Step 8: Check for Notification

**Look at your system notification center:**
- **Windows:** Click the notification icon in the taskbar (bottom right)
- **macOS:** Look at the top-right corner or swipe down from top-right
- **Linux:** Depends on your desktop environment

**You should see a notification appear!** 🎉

Even though the browser tab is closed, the notification should appear because the service worker is still running.

## Step 9: Click the Notification (Optional)

Click on the notification - it should open the app in your browser.

## ✅ Success!

If you see the notification when the tab is closed, **it's working!** This means:
- ✅ Service worker is active
- ✅ Push notifications work in background
- ✅ Web Push Protocol is working
- ✅ Ready for iOS PWA testing!

## 🐛 Troubleshooting

### Notification doesn't appear:
1. **Check backend is running:** `http://127.0.0.1:4000/health`
2. **Check subscription was registered:** Look at backend logs
3. **Check browser notification settings:** Make sure notifications are allowed
4. **Try with tab open first:** Send notification while tab is open to verify it works

### Service worker not registering:
1. Make sure you're using `http://localhost:5173` (not `file://`)
2. Check browser console (F12) for errors
3. Try refreshing the page

### Backend registration fails:
1. Check backend is running on port 4000
2. Check backend logs for errors
3. Verify username exists in your system

## 📝 Quick Reference

**Page to open:**
- `http://localhost:5173/test-push-page.html` (if using PWA dev server)
- OR `http://localhost:8080/test-push-page.html` (if using serve-test-page.ps1)

**Steps:**
1. Request Permission → Allow
2. Subscribe to Push → Wait for success
3. Register with Backend → Enter username
4. **Close browser tab**
5. Send notification: `.\send-test-push.ps1 -Username your_username`
6. Check notification center

That's it! 🎯

