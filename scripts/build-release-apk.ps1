# Build Release APK for Android
# This creates an APK file that can be installed directly on devices

$ErrorActionPreference = "Stop"

Write-Output "Building Release APK..."
Write-Output ""

Push-Location (Split-Path $PSScriptRoot -Parent)

try {
    # Navigate to android directory
    Set-Location android
    
    # Clean previous builds
    Write-Output "Cleaning previous builds..."
    .\gradlew clean
    
    # Build release APK
    Write-Output "Building release APK..."
    .\gradlew assembleRelease
    
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    
    if (Test-Path $apkPath) {
        $fullPath = (Resolve-Path $apkPath).Path
        Write-Output ""
        Write-Output "[SUCCESS] Build successful!"
        Write-Output "APK location: $fullPath"
        Write-Output ""
        Write-Output "You can now install this APK on Android devices or upload it for distribution."
    } else {
        Write-Output "[ERROR] Build failed - APK not found"
        exit 1
    }
} catch {
    Write-Output "[ERROR] Build failed: $_"
    exit 1
} finally {
    Pop-Location
}

