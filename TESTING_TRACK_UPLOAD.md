# How to Upload App to Google Play Testing Track

The testing track allows you to test your app with a limited group of users before releasing to production.

---

## Step 1: Build Your Release AAB

First, make sure you have a release AAB file built:

```powershell
cd front
.\scripts\build-release-aab.ps1
```

Your AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Step 2: Access Testing Track in Play Console

1. **Go to Google Play Console**
   - Visit: https://play.google.com/console
   - Sign in with your developer account

2. **Select Your App**
   - Click on your app from the dashboard

3. **Navigate to Testing**
   - In the left menu, find **"בדיקה ופרסום"** (Testing and Publishing)
   - Click on **"בדיקה"** (Testing)
   - You'll see different testing tracks:
     - **Internal testing** (up to 100 testers, fastest)
     - **Closed testing** (specific groups)
     - **Open testing** (anyone can join)

---

## Step 3: Choose a Testing Track

### Option A: Internal Testing (Recommended for Quick Testing)

**Best for**: Testing with your team (up to 100 testers)

1. Click **"Internal testing"** (or **"בדיקה פנימית"**)

2. Click **"Create new release"** (or **"צור שחרור חדש"**)

3. **Upload AAB**:
   - Click **"Upload"** button
   - Select your AAB file: `front\android\app\build\outputs\bundle\release\app-release.aab`
   - Wait for upload to complete

4. **Add Release Notes**:
   - Enter what's new in this version
   - Example: "Initial test release - testing core features"

5. **Save** the release

6. **Add Testers**:
   - Go to **"Testers"** tab
   - Click **"Create email list"** or **"Add testers"**
   - Add email addresses of people who should test
   - Or use the **"Copy link"** option to share a testing link

7. **Submit for Review**:
   - Click **"Review release"**
   - Review the information
   - Click **"Start rollout to Internal testing"**

### Option B: Closed Testing

**Best for**: Testing with specific groups (beta testers)

1. Click **"Closed testing"** (or **"בדיקה סגורה"**)

2. Click **"Create track"** (if first time) or select existing track

3. **Create Release**:
   - Click **"Create new release"**
   - Upload your AAB file
   - Add release notes
   - Save

4. **Set Up Testers**:
   - Go to **"Testers"** tab
   - Choose how to add testers:
     - **Email list**: Add specific email addresses
     - **Google Groups**: Use a Google Group
     - **Opt-in URL**: Share a link (anyone with link can join)

5. **Submit**:
   - Review and submit for review

### Option C: Open Testing

**Best for**: Public beta testing (anyone can join)

1. Click **"Open testing"** (or **"בדיקה פתוחה"**)

2. **Create Release**:
   - Click **"Create new release"**
   - Upload your AAB file
   - Add release notes
   - Save

3. **Set Up**:
   - Testers can join automatically via Play Store
   - No need to add specific emails

4. **Submit**:
   - Review and submit

---

## Step 4: Complete Required Information

Before you can publish to testing, make sure you've completed:

1. **App Content** (in left menu):
   - [ ] App access
   - [ ] Privacy policy
   - [ ] Target audience
   - [ ] Data safety

2. **Store Listing** (in left menu):
   - [ ] App name
   - [ ] Short description
   - [ ] Full description
   - [ ] App icon (512x512)
   - [ ] At least 2 screenshots

3. **Content Rating**:
   - [ ] Complete questionnaire

4. **Pricing & Distribution**:
   - [ ] Set pricing (Free/Paid)
   - [ ] Select countries

---

## Step 5: Submit for Review

1. **Review Your Release**:
   - Check version code
   - Verify AAB uploaded correctly
   - Review release notes

2. **Check for Errors**:
   - Look for any red warnings or errors
   - Fix any issues before submitting

3. **Submit**:
   - Click **"Review release"**
   - Click **"Start rollout"** or **"Submit for review"**

---

## Step 6: Wait for Review

- **Review time**: Usually 1-3 hours for testing tracks (faster than production)
- **You'll receive email** when approved or if changes needed

---

## Step 7: Share with Testers

### For Internal/Closed Testing:

1. **Get Testing Link**:
   - Go to **"Testers"** tab
   - Click **"Copy link"** or **"Get link"**
   - Share this link with your testers

2. **Testers Join**:
   - Testers click the link
   - They join the testing program
   - They can download your app from Play Store

### For Open Testing:

- App appears in Play Store with "Early access" badge
- Anyone can join and download

---

## Quick Reference

**AAB Location**: `front\android\app\build\outputs\bundle\release\app-release.aab`  
**Build Command**: `.\scripts\build-release-aab.ps1`  
**Testing Tracks**: Internal (fastest) → Closed → Open → Production  
**Review Time**: 1-3 hours for testing tracks  

---

## Troubleshooting

### "Missing required information"
- Complete all sections in App content and Store listing
- Check for red warnings in dashboard

### "AAB upload failed"
- Make sure file is .aab, not .apk
- Check file size (should be reasonable)
- Try uploading again

### "Version code already used"
- Increment version code in `android/app/build.gradle`:
  ```gradle
  versionCode 2  // Change from 1 to 2, etc.
  ```
- Rebuild AAB

### "Testers can't find app"
- Make sure you shared the correct testing link
- Testers need to be signed in to Google account
- For internal testing, testers must be added to the list first

---

## Next Steps After Testing

Once testing is successful:

1. **Fix any bugs** found during testing
2. **Update version** in `build.gradle`:
   ```gradle
   versionCode 2
   versionName "1.1"
   ```
3. **Build new AAB** with fixes
4. **Upload to Production** track (see GOOGLE_PLAY_UPLOAD.md)

---

## Testing Track Comparison

| Track | Max Testers | Review Time | Best For |
|-------|-------------|-------------|----------|
| **Internal** | 100 | ~1 hour | Quick team testing |
| **Closed** | Unlimited | ~2 hours | Beta testing with specific groups |
| **Open** | Unlimited | ~3 hours | Public beta, anyone can join |
| **Production** | Everyone | 1-3 days | Final release to all users |

**Recommendation**: Start with **Internal testing** for fastest feedback, then move to **Closed testing** for broader beta, then **Production** for public release.

