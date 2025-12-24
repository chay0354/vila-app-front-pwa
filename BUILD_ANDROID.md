# Building and Uploading Android App

> **📱 For detailed step-by-step Google Play Store upload instructions, see [GOOGLE_PLAY_UPLOAD.md](./GOOGLE_PLAY_UPLOAD.md)**

## Quick Start (For Testing - Uses Debug Keystore)

If you just want to test the app, you can build with the debug keystore:

```powershell
cd front
.\scripts\build-release-apk.ps1
```

This will create an APK at `android/app/build/outputs/apk/release/app-release.apk`

**Note**: For Google Play Store, you need a proper release keystore (see below).

---

## Production Build (For Google Play Store)

### Step 1: Generate a Release Keystore

First, you need to create a release keystore file for signing your app. **Keep this file safe - you'll need it for all future updates!**

```powershell
cd front\android\app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted to enter:
- Keystore password (remember this!)
- Key password (can be same as keystore password)
- Your name, organization, etc.

**IMPORTANT**: Save the keystore file and passwords securely! If you lose this, you won't be able to update your app on Google Play.

### Step 2: Configure Release Signing

1. Copy the example file:
```powershell
cd front\android
copy keystore.properties.example keystore.properties
```

2. Edit `keystore.properties` and fill in your values:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=release-key
storeFile=app/release.keystore
```

**Note**: `keystore.properties` is already in `.gitignore` - it won't be committed to git.

### Step 3: Build Release APK or AAB

#### Option A: Build APK (for direct installation/testing)

```powershell
cd front
.\scripts\build-release-apk.ps1
```

Or manually:
```powershell
cd front\android
.\gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

#### Option B: Build AAB (for Google Play Store - **recommended**)

```powershell
cd front
.\scripts\build-release-aab.ps1
```

Or manually:
```powershell
cd front\android
.\gradlew bundleRelease
```

The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 4: Upload to Google Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app (if first time) or select existing app
3. Complete app information:
   - App name, description, screenshots
   - Privacy policy URL
   - App category
4. Go to "Production" → "Create new release"
5. Upload the AAB file (`app-release.aab`)
6. Fill in release notes (what's new in this version)
7. Review and submit for review

**First Time Setup:**
- You need a Google Play Developer account ($25 one-time fee)
- Complete all required app information
- Set up app content rating
- Add at least 2 screenshots

---

## Troubleshooting

### Build fails with "keystore not found"
- Make sure you created `release.keystore` in `android/app/` directory
- Check that `keystore.properties` exists and has correct paths

### "Execution failed for task ':app:signReleaseBundle'"
- Verify your keystore passwords in `keystore.properties`
- Make sure the keystore file path is correct

### App crashes on startup
- Check that your API endpoints are correct in `.env`
- Make sure backend is accessible from the device
- Check logs: `adb logcat | grep ReactNativeJS`

