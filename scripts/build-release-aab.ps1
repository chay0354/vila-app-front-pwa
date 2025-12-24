# Build Release AAB (Android App Bundle) for Google Play Store
# This creates an AAB file that must be uploaded to Google Play Store

$ErrorActionPreference = "Stop"

Write-Output "Building Release AAB for Google Play Store..."
Write-Output ""

Push-Location (Split-Path $PSScriptRoot -Parent)

try {
    # Navigate to android directory
    Set-Location android
    
    # Clean previous builds
    Write-Output "Cleaning previous builds..."
    .\gradlew clean
    
    # Build release AAB
    Write-Output "Building release AAB..."
    .\gradlew bundleRelease
    
    $aabPath = "app\build\outputs\bundle\release\app-release.aab"
    
    if (Test-Path $aabPath) {
        $fullPath = (Resolve-Path $aabPath).Path
        Write-Output ""
        Write-Output "[SUCCESS] Build successful!"
        Write-Output "AAB location: $fullPath"
        Write-Output ""
        Write-Output "Next steps:"
        Write-Output "1. Go to https://play.google.com/console"
        Write-Output "2. Select your app (or create new)"
        Write-Output "3. Go to Production -> Create new release"
        Write-Output "4. Upload the AAB file"
    } else {
        Write-Output "[ERROR] Build failed - AAB not found"
        exit 1
    }
} catch {
    Write-Output "[ERROR] Build failed: $_"
    exit 1
} finally {
    Pop-Location
}

