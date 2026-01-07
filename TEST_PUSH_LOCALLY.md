# Testing Push Notifications Locally (Without Phone)

## 🧪 How to Test Push Notifications When App is Closed

### Prerequisites

1. **Backend running** on `http://127.0.0.1:4000`
2. **PWA running** on `http://localhost:5173` (or your dev server)
3. **Chrome/Edge or Safari** (desktop browsers support background push)

## 📋 Step-by-Step Testing

### Method 1: Using Chrome/Edge (Recommended)

1. **Start your PWA dev server:**
   ```bash
   cd pwa
   npm run dev
   ```

2. **Open the PWA in Chrome/Edge:**
   - Navigate to `http://localhost:5173`
   - Sign in to register push subscription

3. **Verify Service Worker is Active:**
   - Open DevTools (F12)
   - Go to Application → Service Workers
   - Verify service worker is "activated and running"

4. **Close the Browser Tab:**
   - **Important:** Actually close the tab (not just minimize)
   - The service worker will continue running in the background

5. **Send a Test Notification:**
   ```powershell
   # Run this from terminal
   $payload = @{
       title = "Test - App Closed"
       body = "This notification arrived even though the app is closed!"
       username = "your_username"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri "http://127.0.0.1:4000/api/push/send" -Method POST -Body $payload -ContentType "application/json"
   ```

6. **Check for Notification:**
   - A notification should appear in your system notification center
   - Even though the browser tab is closed!

### Method 2: Using Safari (macOS)

1. **Enable Web Push in Safari:**
   - Safari → Settings → Advanced
   - Check "Show features for web developers"
   - Safari 16.4+ supports Web Push

2. **Open PWA in Safari:**
   - Navigate to `http://localhost:5173`
   - Sign in to register push subscription

3. **Close Safari Window:**
   - Close the window completely
   - Service worker continues in background

4. **Send Test Notification:**
   - Use the same PowerShell command as above

5. **Check Notification Center:**
   - Notification should appear in macOS Notification Center

### Method 3: Using Browser DevTools (Advanced)

1. **Open DevTools → Application → Service Workers**

2. **Check "Offline" checkbox:**
   - This simulates the app being "closed"
   - Service worker still receives push events

3. **Send push notification from terminal**

4. **Watch DevTools Console:**
   - You'll see the push event being received
   - Notification will be shown

## 🔍 Verification Steps

### 1. Check Service Worker Status

Open DevTools → Application → Service Workers:
- ✅ Should show "activated and running"
- ✅ Should show "push" event listener registered

### 2. Check Push Subscription

In browser console:
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub);
    if (sub) {
      console.log('Endpoint:', sub.endpoint);
      console.log('Keys:', {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
        auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))))
      });
    }
  });
});
```

### 3. Test Push Event Reception

In service worker console (DevTools → Application → Service Workers → "inspect"):
- Should see "Push notification received" when you send a notification
- Should see "Notification displayed successfully"

## 🐛 Troubleshooting

### Notifications Not Appearing When Tab is Closed

**Issue:** Service worker not receiving push events

**Solutions:**
1. **Check browser settings:**
   - Chrome: Settings → Privacy and security → Site settings → Notifications
   - Ensure notifications are allowed for localhost

2. **Check service worker registration:**
   - DevTools → Application → Service Workers
   - Should be "activated and running"
   - If not, unregister and refresh

3. **Verify push subscription:**
   - Check if subscription exists in database
   - Verify subscription format is correct

4. **Check browser console for errors:**
   - Look for service worker errors
   - Check for push event errors

### Service Worker Not Staying Active

**Issue:** Service worker stops when tab closes

**Solutions:**
1. **Use Chrome/Edge:** Better service worker persistence
2. **Keep at least one tab open:** Service worker stays active if any tab is open
3. **Check browser settings:** Some browsers may suspend service workers aggressively

### Push Notification Not Received

**Issue:** Backend sends but notification doesn't appear

**Solutions:**
1. **Check backend logs:**
   - Verify notification was sent successfully
   - Check for Web Push errors

2. **Verify subscription is valid:**
   - Check subscription endpoint is accessible
   - Verify VAPID keys are correct

3. **Test with browser open first:**
   - Send notification with tab open
   - If it works, then try with tab closed

## 🧪 Automated Testing Script

Create a test script to verify everything:

```powershell
# test-push-local.ps1
Write-Host "Testing Local Push Notifications" -ForegroundColor Green

# 1. Check backend is running
Write-Host "`n1. Checking backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:4000/health" -Method GET
    Write-Host "   [OK] Backend is running" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Backend is not running!" -ForegroundColor Red
    Write-Host "   Start it with: cd back; python run_server.py" -ForegroundColor Yellow
    exit
}

# 2. Get VAPID key
Write-Host "`n2. Checking VAPID key..." -ForegroundColor Yellow
try {
    $vapid = Invoke-RestMethod -Uri "http://127.0.0.1:4000/api/push/vapid-key" -Method GET
    Write-Host "   [OK] VAPID key available" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] VAPID key not available" -ForegroundColor Red
}

# 3. Instructions
Write-Host "`n3. Testing Steps:" -ForegroundColor Yellow
Write-Host "   a) Open PWA in browser: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   b) Sign in to register push subscription" -ForegroundColor Cyan
Write-Host "   c) Close the browser tab completely" -ForegroundColor Cyan
Write-Host "   d) Run this command to send notification:" -ForegroundColor Cyan
Write-Host "      .\send-test-push.ps1 -Username your_username" -ForegroundColor White
Write-Host "   e) Check for notification in system notification center" -ForegroundColor Cyan
```

## ✅ Success Criteria

You'll know it's working when:
- ✅ Notification appears even with browser tab closed
- ✅ Notification appears in system notification center
- ✅ Clicking notification opens the app
- ✅ Service worker logs show push event received

## 📝 Notes

- **Chrome/Edge:** Best for testing, service workers persist well
- **Safari:** Works but may be more aggressive about suspending service workers
- **Firefox:** Also supports Web Push, good for testing
- **Localhost:** Works the same as production for push notifications
- **HTTPS:** Not required for localhost, but required for production

## 🎯 Quick Test Checklist

- [ ] Backend running on port 4000
- [ ] PWA running on localhost
- [ ] Signed in and push subscription registered
- [ ] Service worker active (DevTools → Application)
- [ ] Browser tab closed completely
- [ ] Test notification sent from terminal
- [ ] Notification appears in system notification center
- [ ] Clicking notification opens the app











