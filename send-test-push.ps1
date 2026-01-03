# Send Test Push Notification Locally
param(
    [string]$Username = "test_user",
    [string]$Title = "Test Notification",
    [string]$Body = "This is a test push notification - app should be closed!",
    [string]$BackendUrl = "http://127.0.0.1:4000"
)

Write-Host "Sending Test Push Notification" -ForegroundColor Green
Write-Host "Backend: $BackendUrl" -ForegroundColor Cyan
Write-Host "Username: $Username" -ForegroundColor Cyan
Write-Host ""

$payload = @{
    title = $Title
    body = $Body
    username = $Username
} | ConvertTo-Json

try {
    Write-Host "Sending notification..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/push/send" -Method POST -Body $payload -ContentType "application/json"
    
    Write-Host "[SUCCESS] Notification sent!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Cyan
    Write-Host "  Sent to: $($response.sent) device(s)" -ForegroundColor White
    Write-Host "  Total tokens: $($response.total_tokens)" -ForegroundColor White
    Write-Host ""
    
    if ($response.sent -gt 0) {
        Write-Host "✅ Notification should appear in your system notification center!" -ForegroundColor Green
        Write-Host "   (Even if the browser tab is closed)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  No devices received the notification" -ForegroundColor Yellow
        Write-Host "   Make sure:" -ForegroundColor Yellow
        Write-Host "   1. You're signed in to the PWA" -ForegroundColor White
        Write-Host "   2. Push subscription is registered" -ForegroundColor White
        Write-Host "   3. Service worker is active" -ForegroundColor White
    }
} catch {
    Write-Host "[ERROR] Failed to send notification" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Make sure the backend is running:" -ForegroundColor Yellow
    Write-Host "  cd back" -ForegroundColor White
    Write-Host "  python run_server.py" -ForegroundColor White
}






