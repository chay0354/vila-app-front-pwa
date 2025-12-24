# Step-by-Step Guide: Upload App to Google Play Store

> **🧪 For testing track instructions, see [TESTING_TRACK_UPLOAD.md](./TESTING_TRACK_UPLOAD.md)**

## Prerequisites Checklist

- [ ] Google account (Gmail)
- [ ] $25 USD (one-time Google Play Developer registration fee)
- [ ] Credit card or payment method
- [ ] App built and ready (AAB file)
- [ ] App icon (512x512 PNG)
- [ ] At least 2 screenshots of your app
- [ ] App description (in Hebrew and/or English)
- [ ] Privacy policy URL (if your app collects data)

---

## Step 1: Create Google Play Developer Account

1. **Go to Google Play Console**
   - Visit: https://play.google.com/console
   - Sign in with your Google account

2. **Accept Terms and Pay Registration Fee**
   - Click "Get Started" or "Create Account"
   - Read and accept the Developer Distribution Agreement
   - Pay the **$25 one-time registration fee** (valid for lifetime)
   - Complete your developer profile:
     - Developer name (will be shown to users)
     - Email address
     - Phone number
     - Country/Region

3. **Verify Your Account**
   - Google may require phone verification
   - Complete any additional verification steps

**Time**: 5-10 minutes  
**Cost**: $25 USD (one-time)

---

## Step 2: Prepare Your App Assets

Before creating the app listing, prepare these files:

### Required Assets:

1. **App Icon** (512x512 PNG)
   - Square icon, no transparency
   - Should look good at small sizes
   - Save as: `app-icon.png`

2. **Screenshots** (at least 2, up to 8)
   - Phone screenshots: 16:9 or 9:16 aspect ratio
   - Minimum: 320px height
   - Recommended: 1080x1920 or 1920x1080
   - Show your app's main features

3. **App Name** (30 characters max)
   - Example: "Vila App" or "Vila Management"

4. **Short Description** (80 characters max)
   - Brief summary shown in search results
   - Example: "Manage your vacation rental business"

5. **Full Description** (4000 characters max)
   - Detailed description of your app
   - Include features, benefits
   - Can be in Hebrew or English

6. **Privacy Policy URL** (required if app collects data)
   - Your app uses API calls, so you need this
   - Can host on GitHub Pages, Google Sites, or your website
   - Must be publicly accessible

### Optional Assets:

- Feature graphic (1024x500 PNG)
- Promotional video (YouTube link)
- Tablet screenshots

---

## Step 3: Build Your Release AAB

1. **Generate Release Keystore** (if not done already):
   ```powershell
   cd front\android\app
   keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
   ```
   - Enter a strong password (save it!)
   - Enter your details (name, organization, etc.)

2. **Configure Keystore**:
   ```powershell
   cd front\android
   copy keystore.properties.example keystore.properties
   ```
   - Edit `keystore.properties` and fill in your passwords
   - Set `storeFile=app/release.keystore`

3. **Build AAB**:
   ```powershell
   cd front
   .\scripts\build-release-aab.ps1
   ```

4. **Locate Your AAB**:
   - File location: `front\android\app\build\outputs\bundle\release\app-release.aab`
   - Keep this file safe - you'll need it for updates!

---

## Step 4: Create App in Play Console

1. **Go to Play Console**
   - Visit: https://play.google.com/console
   - Click **"Create app"** button

2. **Fill App Details**:
   - **App name**: Enter your app name (e.g., "Vila App")
   - **Default language**: Select Hebrew or English
   - **App or game**: Select "App"
   - **Free or paid**: Select "Free" (or "Paid" if you want to charge)
   - **Declarations**: Check boxes for:
     - [ ] US export laws
     - [ ] Content guidelines
   - Click **"Create app"**

---

## Step 5: Complete App Content

### 5.1 App Access

1. Go to **"App content"** in left menu
2. Click **"App access"**
3. Select: **"All or some functionality is restricted"** (if your app requires login)
   OR **"All functionality is available without restrictions"** (if no login)
4. Save

### 5.2 Privacy Policy

1. Go to **"App content"** → **"Privacy Policy"**
2. Enter your privacy policy URL
   - If you don't have one, create a simple page on:
     - GitHub Pages
     - Google Sites
     - Your website
3. Save

### 5.3 Target Audience & Content

1. Go to **"App content"** → **"Target audience and content"**
2. Select target age group
3. Answer questions about app content
4. Save

### 5.4 Data Safety

1. Go to **"App content"** → **"Data safety"**
2. Answer questions about data collection:
   - Does your app collect personal info? (Yes - if you have user accounts)
   - Does it share data? (No - unless you do)
   - Does it collect location? (No - unless you do)
3. Complete all sections
4. Save

---

## Step 6: Set Up Store Listing

1. Go to **"Store presence"** → **"Main store listing"**

2. **Fill Required Fields**:

   **App name**: 
   ```
   Vila App
   ```

   **Short description** (80 chars max):
   ```
   Manage your vacation rental business - orders, invoices, and reports
   ```

   **Full description** (4000 chars max):
   ```
   Vila App is a comprehensive management solution for vacation rental businesses.
   
   Features:
   - Manage hotel orders and bookings
   - Track invoices and expenses
   - Generate income and expense reports
   - Warehouse management
   - Maintenance task tracking
   - Employee attendance tracking
   - And much more!
   
   Perfect for vacation rental owners and property managers.
   ```

   **App icon**: Upload your 512x512 PNG icon

   **Screenshots**: Upload at least 2 screenshots
   - Click "Add phone screenshot"
   - Upload your images

   **Graphic assets** (optional):
   - Feature graphic: 1024x500 PNG
   - Promotional video: YouTube link (optional)

   **Contact details**:
   - Email address
   - Phone number (optional)
   - Website (optional)

3. Click **"Save"** at the bottom

---

## Step 7: Set Up App Content Rating

1. Go to **"Store presence"** → **"Content rating"**

2. Click **"Start questionnaire"**

3. Answer questions about your app:
   - Does it contain violence? (No)
   - Does it contain sexual content? (No)
   - Does it contain drugs? (No)
   - Does it contain gambling? (No)
   - etc.

4. Complete questionnaire

5. Review rating (usually "Everyone")

6. Click **"Save"**

---

## Step 8: Set Up Pricing & Distribution

1. Go to **"Pricing and distribution"**

2. **Pricing**:
   - Select **"Free"** (or set price if paid app)

3. **Countries/Regions**:
   - Select **"Available in all countries"** (or choose specific countries)
   - For Hebrew app, at least select: Israel

4. **Device categories**:
   - [x] Phones
   - [ ] Tablets (optional)
   - [ ] TV (optional)
   - [ ] Wear OS (optional)

5. **User programs**:
   - [x] Google Play for Education (optional)
   - [x] Designed for Families (if appropriate)

6. **Consent**:
   - Check all required boxes
   - US export laws
   - Content guidelines

7. Click **"Save"**

---

## Step 9: Upload Your App (AAB)

1. Go to **"Production"** in left menu (under "Release")

2. Click **"Create new release"**

3. **Upload AAB**:
   - Click **"Upload"** button
   - Select your AAB file: `front\android\app\build\outputs\bundle\release\app-release.aab`
   - Wait for upload to complete (may take a few minutes)

4. **Release name** (optional):
   ```
   Version 1.0 (1)
   ```

5. **Release notes** (what's new):
   ```
   Initial release
   - Hotel order management
   - Invoice processing
   - Income and expense reports
   - Warehouse management
   - Maintenance tracking
   ```

6. **Review release**:
   - Check that version code is correct
   - Review app size
   - Check for any warnings

7. Click **"Save"** (at bottom of page)

---

## Step 10: Review and Submit

1. **Review Checklist**:
   - [ ] All required app content sections completed
   - [ ] Store listing complete (icon, screenshots, description)
   - [ ] Privacy policy added
   - [ ] Content rating completed
   - [ ] Pricing and distribution set
   - [ ] AAB uploaded to Production
   - [ ] Release notes added

2. **Go to "Dashboard"**:
   - Check for any errors or warnings
   - Fix any issues shown in red

3. **Submit for Review**:
   - Once all sections show green checkmarks
   - Go to **"Production"** → **"Releases"**
   - Click **"Review release"**
   - Review all information
   - Click **"Start rollout to Production"**

4. **Confirmation**:
   - You'll see: "Your app is being reviewed"
   - Review typically takes 1-3 days
   - You'll receive email when approved or if changes needed

---

## Step 11: After Submission

### While Waiting for Review:

- Check email for updates
- Review can take 1-3 business days
- Google may request changes or clarifications

### If Changes Requested:

1. Make the requested changes
2. Update your app if needed
3. Resubmit through Play Console

### When Approved:

1. **App goes live** automatically
2. **You'll receive email** confirmation
3. **App appears in Play Store** within a few hours
4. **Share your app link** with users!

---

## Step 12: Updating Your App (Future Releases)

When you want to update your app:

1. **Update version** in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Increment by 1
   versionName "1.1"  // Update version name
   ```

2. **Build new AAB**:
   ```powershell
   cd front
   .\scripts\build-release-aab.ps1
   ```

3. **Upload to Play Console**:
   - Go to **"Production"** → **"Create new release"**
   - Upload new AAB
   - Add release notes
   - Submit for review

---

## Common Issues & Solutions

### Issue: "App requires privacy policy"
**Solution**: Add privacy policy URL in App content → Privacy Policy

### Issue: "Missing screenshots"
**Solution**: Upload at least 2 screenshots in Store listing

### Issue: "Content rating incomplete"
**Solution**: Complete the content rating questionnaire

### Issue: "AAB upload failed"
**Solution**: 
- Check file size (should be reasonable)
- Make sure you're uploading .aab, not .apk
- Try uploading again

### Issue: "App rejected"
**Solution**: 
- Read rejection email carefully
- Address the specific issues mentioned
- Resubmit after fixing

---

## Quick Reference

**Play Console**: https://play.google.com/console  
**AAB Location**: `front\android\app\build\outputs\bundle\release\app-release.aab`  
**Build Script**: `.\scripts\build-release-aab.ps1`  
**Review Time**: 1-3 business days  
**Registration Fee**: $25 USD (one-time)

---

## Need Help?

- **Google Play Help**: https://support.google.com/googleplay/android-developer
- **Play Console Help**: Click "?" icon in Play Console
- **Community Forum**: https://support.google.com/googleplay/android-developer/community

Good luck with your app launch! 🚀

