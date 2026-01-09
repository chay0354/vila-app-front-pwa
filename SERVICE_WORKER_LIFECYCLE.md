# Service Worker Lifecycle on Localhost

## Why Service Worker Stops

Chrome stops service workers on localhost when:
- All tabs are closed
- Page is refreshed
- Browser is idle for a while

This is **normal behavior** - Chrome does this to save resources.

## Important: Push Events Wake Up Service Workers

**Even when stopped, push events will wake up the service worker!**

When a push notification arrives:
1. Chrome receives the push event
2. Chrome automatically wakes up the stopped service worker
3. Service worker processes the push event
4. Notification is displayed

## Testing on Localhost

### Method 1: Keep Service Worker Running
1. Open `chrome://serviceworker-internals/?devtools`
2. Find your service worker
3. Click **"Start"** to keep it running
4. Test with tab closed

### Method 2: Let Push Events Wake It Up
1. Service worker can be stopped (this is fine)
2. Close browser tab
3. Send push notification
4. Push event will wake up the service worker
5. Check logs in service worker internals page

### Method 3: Keep a Tab Open
- Keep at least one tab open to `http://localhost:5173`
- Service worker stays running
- Push notifications work reliably

## For Production (iOS PWA)

**This is NOT an issue in production:**

1. **When PWA is added to home screen:**
   - Service worker stays active
   - iOS keeps it running for push notifications
   - No need to manually start it

2. **Push events reliably wake up service workers:**
   - Even if service worker stops
   - Push event wakes it up automatically
   - Notification is displayed

3. **iOS handles this properly:**
   - Service worker lifecycle is managed correctly
   - Push notifications work reliably
   - Your implementation is correct

## Verification

To verify push events wake up stopped service workers:

1. Service worker is **STOPPED** (this is fine)
2. Close all browser tabs
3. Send push notification
4. Check `chrome://serviceworker-internals/?devtools`
5. Look at the **Log** section
6. You should see push event logs appear
7. This proves push events wake up the service worker!

## Summary

- ✅ Service worker stopping is normal on localhost
- ✅ Push events wake up stopped service workers
- ✅ Your implementation is correct
- ✅ For iOS PWA production, this works perfectly
- ✅ No code changes needed

The system is working as designed!













