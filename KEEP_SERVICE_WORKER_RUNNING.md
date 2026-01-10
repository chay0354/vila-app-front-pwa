# Keep Service Worker Running for Push Notifications

## Issue: Service Worker Stops When Tab is Closed

Chrome may stop service workers when all tabs are closed to save resources. This prevents push notifications from being received.

## Solutions

### Solution 1: Keep a Tab Open (Easiest)
- Keep at least one tab open to `http://localhost:5173`
- Service worker stays running
- Push notifications will work

### Solution 2: Use chrome://serviceworker-internals
1. Open `chrome://serviceworker-internals/?devtools`
2. Find your service worker
3. Click **"Start"** button to manually start it
4. Service worker will stay running even with tabs closed
5. Test push notifications

### Solution 3: Service Worker Auto-Start (For Production)
In production (HTTPS), service workers typically stay running for push notifications. The issue is mainly with localhost development.

## Why This Happens

- Chrome stops service workers when no tabs are open (resource saving)
- Push events can still wake up a stopped service worker
- But sometimes Chrome is aggressive about stopping them on localhost

## For iOS PWA (Production)

When the PWA is added to home screen on iOS:
- Service worker stays active
- Push notifications work reliably
- This is the intended behavior

## Testing Locally

For local testing:
1. Keep a tab open, OR
2. Use `chrome://serviceworker-internals` and click "Start"
3. Then test with tab closed

## Verification

After starting the service worker:
1. Status should show "RUNNING" (not "STOPPED")
2. Send push notification
3. Check logs in service worker internals page
4. Should see "🔔 PUSH EVENT RECEIVED!"














