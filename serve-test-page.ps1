# Serve the test push page over HTTP (required for service workers)

Write-Host "Starting HTTP server for test push page..." -ForegroundColor Green
Write-Host "Service workers require HTTP/HTTPS, not file:// protocol" -ForegroundColor Yellow
Write-Host ""

$port = 8080
$url = "http://localhost:$port/test-push-page.html"

# Check if Python is available
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    Write-Host "Starting Python HTTP server on port $port..." -ForegroundColor Cyan
    Write-Host "Open in browser: $url" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    python -m http.server $port
    exit
}

# Check if Node.js http-server is available
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    $httpServer = Get-Command http-server -ErrorAction SilentlyContinue
    if ($httpServer) {
        Write-Host "Starting Node.js http-server on port $port..." -ForegroundColor Cyan
        Write-Host "Open in browser: $url" -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
        Write-Host ""
        http-server -p $port
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
    Write-Host "Starting PHP server on port $port..." -ForegroundColor Cyan
    Write-Host "Open in browser: $url" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    php -S localhost:$port
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
Write-Host "Or use your PWA dev server (npm run dev) and navigate to:" -ForegroundColor Yellow
Write-Host "  http://localhost:5173/test-push-page.html" -ForegroundColor White











