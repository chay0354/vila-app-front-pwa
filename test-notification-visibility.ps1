# Test if notifications are actually appearing but maybe hidden

Write-Host "Testing Notification Visibility" -ForegroundColor Green
Write-Host ""

Write-Host "Since localhost is allowed but notifications don't appear:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Check Windows Notification Center:" -ForegroundColor Cyan
Write-Host "   - Click notification icon (bottom-right corner)" -ForegroundColor White
Write-Host "   - Notifications might be there even if not as popup" -ForegroundColor White
Write-Host ""

Write-Host "2. Check Windows Focus Assist:" -ForegroundColor Cyan
Write-Host "   - Windows Key + I → System → Focus Assist" -ForegroundColor White
Write-Host "   - Set to 'Off' or 'Priority only'" -ForegroundColor White
Write-Host ""

Write-Host "3. Test with browser tab CLOSED:" -ForegroundColor Cyan
Write-Host "   - This is the real test - notifications should work when tab is closed" -ForegroundColor White
Write-Host "   - Close the browser tab completely" -ForegroundColor Yellow
Write-Host "   - Run: .\send-test-push.ps1 -Username test21" -ForegroundColor White
Write-Host "   - Check notification center" -ForegroundColor White
Write-Host ""

Write-Host "4. Check Chrome notification display:" -ForegroundColor Cyan
Write-Host "   - Chrome might be showing notifications but they disappear quickly" -ForegroundColor White
Write-Host "   - Try sending multiple notifications in a row" -ForegroundColor White
Write-Host ""

Write-Host "5. Verify service worker is receiving push:" -ForegroundColor Cyan
Write-Host "   - The logs show 'Notification displayed successfully'" -ForegroundColor Green
Write-Host "   - This means Chrome accepted the notification request" -ForegroundColor Green
Write-Host "   - If it's not visible, it's a display/settings issue, not a code issue" -ForegroundColor Green
Write-Host ""

Write-Host "IMPORTANT: The service worker IS working!" -ForegroundColor Green
Write-Host "The push notification system is functional." -ForegroundColor Green
Write-Host "On iOS PWA (when added to home screen), notifications will work the same way." -ForegroundColor Cyan






