# How to Share App with a Single Link

You have two options to share your app with a single link:

---

## Option 1: Internal App Sharing (Requires App to be Published First)

**Note**: Internal App Sharing requires your app to be published to at least one testing track first.

**Best for**: Quick sharing after initial publication

### Prerequisites:
- App must be published to at least one testing track (Internal/Closed/Open) OR Production
- You need to be authorized to upload files

### If You Get Permission Error:

**Solution**: Publish to Internal Testing first, then use Internal App Sharing

1. **Publish to Internal Testing** (one-time setup):
   - Go to **"בדיקה"** → **"בדיקה פנימית"** (Internal Testing)
   - Upload your AAB file (build with `.\scripts\build-release-aab.ps1`)
   - Complete required app information (if not done)
   - Submit for review
   - Wait for approval (usually 1-3 hours)

2. **After App is Published**:
   - Go to **"שיתוף פנימי של אפליקציות"** (Internal App Sharing)
   - Now you can upload APK files
   - Get shareable links

### Steps (After App is Published):

1. **Build APK**:
   ```powershell
   cd front
   .\scripts\build-release-apk.ps1
   ```

2. **Go to Internal App Sharing**:
   - Visit: https://play.google.com/console/internal-app-sharing
   - Or: **"שיתוף פנימי של אפליקציות"** in left menu

3. **Upload APK**:
   - Drag and drop or click **"העלאה"** (Upload)
   - Select: `front\android\app\build\outputs\apk\release\app-release.apk`
   - Wait for upload (1-2 minutes)

4. **Get Share Link**:
   - Click **"Share"** button
   - Copy the link: `https://play.google.com/apps/internaltest/...`

5. **Share the Link**:
   - Anyone with this link can download immediately
   - No review needed for each upload

### Advantages:
- ✅ Instant uploads after initial setup
- ✅ Works immediately after upload
- ✅ Anyone with link can download
- ✅ Perfect for quick updates and testing

### Disadvantages:
- ❌ Requires app to be published first (one-time)

---

## Option 2: Open Testing (Play Store Listing)

**Best for**: Public beta testing with Play Store presence

### Steps:

1. **Build AAB**:
   ```powershell
   cd front
   .\scripts\build-release-aab.ps1
   ```

2. **Go to Google Play Console**:
   - Visit: https://play.google.com/console
   - Select your app

3. **Navigate to Open Testing**:
   - Go to **"בדיקה ופרסום"** → **"בדיקה"** → **"בדיקות פתוחות"** (Open Testing)
   - Click **"Create new release"**

4. **Upload AAB**:
   - Upload your AAB file
   - Add release notes
   - Save

5. **Get Share Link**:
   - After review (1-3 hours), your app will be available
   - Get the link from the Open Testing page
   - Share this link with anyone

6. **Users Download**:
   - Users click the link
   - They join the "Early access" program
   - App appears in Play Store for them
   - They can install directly

### Advantages:
- ✅ App appears in Play Store
- ✅ Professional appearance
- ✅ Users can rate and review
- ✅ Can transition to production easily

### Disadvantages:
- ❌ Requires review (1-3 hours)
- ❌ Requires complete app listing (screenshots, description, etc.)

---

## Quick Comparison

| Feature | Internal App Sharing | Open Testing |
|---------|---------------------|--------------|
| **Speed** | Instant (1-2 min) | 1-3 hours review |
| **Link Type** | Direct download | Play Store link |
| **Requirements** | Just APK | Full app listing |
| **Who Can Download** | Anyone with link | Anyone with link |
| **Play Store Presence** | No | Yes |
| **Best For** | Quick sharing | Public beta |

---

## Recommendation

**For your use case** (share one link, anyone can download):

### If App is NOT Published Yet:
👉 **Use Open Testing** - Easiest way to get a shareable link without restrictions!

1. Build AAB: `.\scripts\build-release-aab.ps1`
2. Upload to Open Testing track
3. After review (1-3 hours), get the share link
4. Anyone can download via Play Store

### If App IS Already Published:
👉 **Use Internal App Sharing** - Fastest for quick updates!

1. Build APK: `.\scripts\build-release-apk.ps1`
2. Upload to Internal App Sharing
3. Get the share link immediately
4. Send link to anyone - they can download right away!

---

## Troubleshooting

### "Link not working"
- Make sure you copied the full link
- Check that the APK was uploaded successfully
- Try the link in an incognito browser

### "Can't install app"
- Users need to enable "Install from unknown sources" (if not using Play Store)
- For Internal App Sharing, they should use the Play Store link (no need for unknown sources)

### "Upload failed"
- Make sure you're uploading APK (not AAB) for Internal App Sharing
- Check file size (should be reasonable)
- Try uploading again

