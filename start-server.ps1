# Simple HTTP server for PWA testing
# This script helps you start a local server to test the PWA

Write-Host "Starting PWA server..." -ForegroundColor Green
Write-Host ""

# Check if Python is available
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    Write-Host "Using Python HTTP server on http://localhost:8000" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    python -m http.server 8000
    exit
}

# Check if Node.js http-server is available
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    $httpServer = Get-Command http-server -ErrorAction SilentlyContinue
    if ($httpServer) {
        Write-Host "Using Node.js http-server on http://localhost:8000" -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        http-server -p 8000
        exit
    } else {
        Write-Host "Node.js found but http-server is not installed." -ForegroundColor Yellow
        Write-Host "Install it with: npm install -g http-server" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Check if PHP is available
$php = Get-Command php -ErrorAction SilentlyContinue
if ($php) {
    Write-Host "Using PHP server on http://localhost:8000" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    php -S localhost:8000
    exit
}

# If nothing is available
Write-Host "No suitable server found!" -ForegroundColor Red
Write-Host ""
Write-Host "Please install one of the following:" -ForegroundColor Yellow
Write-Host "  - Python 3: https://www.python.org/downloads/" -ForegroundColor White
Write-Host "  - Node.js: https://nodejs.org/" -ForegroundColor White
Write-Host "  - PHP: https://www.php.net/downloads.php" -ForegroundColor White
Write-Host ""
Write-Host "Or use any other HTTP server that serves files from this directory." -ForegroundColor Yellow

