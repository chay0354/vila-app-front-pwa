# How to Share iOS App with a Link (Without App Store)

## Using Diawi (Simplest Method)

Diawi is a free service that lets you upload an iOS app and get a shareable link instantly.

---

## Step 1: Build Your iOS App (.ipa file)

### Option A: Build from Xcode

1. **Open your project in Xcode**:
   ```bash
   cd front/ios
   open FrontNative.xcworkspace
   ```

2. **Select "Any iOS Device" or "Generic iOS Device"** in the device selector (top bar)

3. **Archive the app**:
   - Go to **Product** → **Archive**
   - Wait for build to complete

4. **Export the .ipa**:
   - In the Organizer window, click **"Distribute App"**
   - Select **"Ad Hoc"** or **"Development"**
   - Choose your team/certificate
   - Click **"Export"**
   - Save the `.ipa` file

### Option B: Build from Command Line

```bash
cd front/ios
xcodebuild -workspace FrontNative.xcworkspace \
  -scheme FrontNative \
  -configuration Release \
  -archivePath ./build/FrontNative.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath ./build/FrontNative.xcarchive \
  -exportPath ./build/export \
  -exportOptionsPlist ExportOptions.plist
```

---

## Step 2: Upload to Diawi

1. **Go to Diawi**:
   - Visit: https://www.diawi.com
   - No account needed for basic use

2. **Upload your .ipa file**:
   - Click **"Choose file"** or drag and drop
   - Select your `.ipa` file
   - (Optional) Add a password for extra security
   - Click **"Send"**

3. **Wait for upload** (usually 1-2 minutes):
   - You'll see a progress bar
   - Wait for "Upload successful" message

4. **Get your share link**:
   - You'll see a link like: `https://i.diawi.com/xxxxx`
   - Copy this link
   - This is your shareable link!

---

## Step 3: Share the Link

Send users this link. When they click it on their iPhone/iPad:

1. **Link opens in Safari**
2. **Tap "Install"** button
3. **Go to Settings** → **General** → **VPN & Device Management**
4. **Trust the developer** (tap "Trust" under your developer name)
5. **App installs** on home screen
6. **Tap app icon** to open

---

## Alternative Services

If Diawi doesn't work, try these:

### InstallOnAir
- Website: https://www.installonair.com
- Similar to Diawi
- Free tier available

### AppBox
- Command-line tool
- Uploads to Dropbox automatically
- More technical setup

---

## Important Notes

### For Users Installing:
- **iOS 9+**: Users need to trust the developer in Settings
- **Device UDID**: For ad-hoc builds, you may need to register device UDIDs
- **Certificate**: App must be signed with a valid certificate

### For Development Builds:
- Works best with **Ad Hoc** or **Development** distribution
- May require device UDID registration
- Certificate must be valid

### For Enterprise Distribution:
- If you have Enterprise account ($299/year)
- Can distribute without device limits
- No UDID registration needed

---

## Troubleshooting

### "Unable to install app"
- Check that device UDID is registered (for ad-hoc builds)
- Verify certificate is valid
- Make sure user trusts the developer in Settings

### "App installation failed"
- Certificate may have expired
- Device not registered (for ad-hoc)
- Try rebuilding with valid certificate

### "Link not working"
- Check that upload completed successfully
- Try uploading again
- Use a different service

---

## Quick Start (Fastest)

1. Build `.ipa` in Xcode (Product → Archive → Export)
2. Go to https://www.diawi.com
3. Upload `.ipa` file
4. Copy the link
5. Share with users!

That's it! 🎉

