# Web Push Setup for iOS PWA

## Quick Setup (5 minutes)

### 1. Generate VAPID Keys (Already Done!)

VAPID keys have been generated. Add them to your backend environment:

```bash
VAPID_PUBLIC_KEY=BBfRyuHtUbJ5XoZyBsHhgCcCU7SqrrkjxDPZY4ZpkCtOrjyaXLbTLaqaZkhPNi3pv0zDzuG-jSVj_X2qGRHbw1M
VAPID_PRIVATE_KEY=KfWmS7BmwCBCOqRrv7J25ouFDmfqlbkmLk5RRGtCkdM
VAPID_EMAIL=mailto:admin@bolavilla.com
```

### 2. Add to Backend Environment

Add these to your backend `.env` file or Vercel environment variables.

### 3. Deploy

Deploy the backend and PWA. That's it!

## How It Works

1. **User signs in** → PWA requests notification permission
2. **Permission granted** → PWA subscribes to Web Push with VAPID public key
3. **Subscription saved** → Backend stores the subscription
4. **Notification sent** → Backend sends Web Push notification via pywebpush
5. **Service worker receives** → Shows notification even when app is closed (iOS 16.4+)

## Requirements

- **iOS 16.4+** for Web Push support in PWA
- **Notification permission** granted by user
- **VAPID keys** configured in backend

## Testing

Run the test script:
```bash
node test_ios_push_notifications.js <username>
```

Or send a test notification via API:
```bash
curl -X POST https://vila-app-back.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello from Web Push!","username":"your_username"}'
```

## Troubleshooting

- **No notifications?** Check that VAPID keys are set in backend environment
- **Permission denied?** User needs to allow notifications in iPhone Settings
- **iOS version?** Requires iOS 16.4+ for Web Push in PWA













