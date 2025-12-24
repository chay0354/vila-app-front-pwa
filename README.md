# Push Notification Test PWA

A Progressive Web App (PWA) that sends test push notifications and works on Safari.

## Features

- ✅ PWA support with manifest.json
- ✅ Service Worker for offline functionality
- ✅ Push notification support
- ✅ Safari compatible
- ✅ Request notification permissions
- ✅ Send test notifications
- ✅ Subscribe to push notifications

## Setup Instructions

### 1. Serve the PWA over HTTPS (or localhost)

PWAs require HTTPS (or localhost) to work properly. Safari especially requires this for service workers and push notifications.

**Option A: Using Python (if installed)**
```bash
cd pwa
python -m http.server 8000
```

**Option B: Using Node.js http-server**
```bash
npm install -g http-server
cd pwa
http-server -p 8000
```

**Option C: Using PHP**
```bash
cd pwa
php -S localhost:8000
```

### 2. Access the PWA

Open your browser and navigate to:
- `http://localhost:8000` (for localhost)
- Or your HTTPS URL if deployed

### 3. Install the PWA

**On Safari (iOS/macOS):**
1. Open the PWA in Safari
2. Tap/click the Share button
3. Select "Add to Home Screen"
4. The PWA will be installed

**On Chrome/Edge:**
1. Look for the install icon in the address bar
2. Click "Install" when prompted

### 4. Test Push Notifications

1. Click "Request Notification Permission" to grant notification permissions
2. Click "Send Test Notification" to send a test notification
3. (Optional) Click "Subscribe to Push" to subscribe to push notifications (requires VAPID key for production)

## Safari-Specific Notes

- Safari on iOS requires the PWA to be added to the home screen for full functionality
- Push notifications work on Safari 16.4+ (macOS) and iOS 16.4+
- Service workers are supported in Safari 11.1+
- The app must be served over HTTPS (or localhost)

## Icons

The PWA requires icons for proper installation. You'll need to create:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

You can use any image editor or online tool to create these icons. For testing, you can use placeholder images.

## Production Deployment

For production use with real push notifications:

1. Generate a VAPID key pair for your server
2. Update the `applicationServerKey` in `app.js` with your public VAPID key
3. Set up a backend server to send push notifications
4. Deploy to HTTPS hosting

## Browser Support

- ✅ Safari 16.4+ (macOS and iOS)
- ✅ Chrome/Edge (all recent versions)
- ✅ Firefox (all recent versions)
- ✅ Opera (all recent versions)

## Troubleshooting

**Notifications not working:**
- Ensure you've granted notification permissions
- Check that the site is served over HTTPS (or localhost)
- On Safari iOS, make sure the PWA is added to home screen

**Service Worker not registering:**
- Check browser console for errors
- Ensure the site is served over HTTPS (or localhost)
- Clear browser cache and try again

**Push subscription failing:**
- The default VAPID key is for testing only
- For production, generate your own VAPID key pair

