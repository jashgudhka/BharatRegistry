# Stop Besu Network (Windows)

Write-Host "[!] Stopping Bharat Registry Besu Network..." -ForegroundColor Yellow

# Stop all Besu processes
Get-Process besu -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "[!] Network stopped." -ForegroundColor Green
