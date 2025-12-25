# React Native Console Log Viewer
# This script shows real-time console logs from the React Native app

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

if (!(Test-Path $adb)) {
    Write-Output "Error: adb.exe not found. Make sure Android SDK is installed."
    exit 1
}

Write-Output "=== React Native Console Logs ==="
Write-Output "Press Ctrl+C to stop"
Write-Output ""

# Show React Native specific logs
& $adb logcat *:S ReactNative:V ReactNativeJS:V

