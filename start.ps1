Write-Host "Starting BizzProfile Backend..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000" -WorkingDirectory "$PSScriptRoot\backend"

Write-Host "Starting BizzProfile Frontend..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "vite", "--port", "5173" -WorkingDirectory "$PSScriptRoot\frontend"

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BizzProfile is running!" -ForegroundColor Cyan
Write-Host " Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host " Backend:  http://localhost:8000" -ForegroundColor Yellow
Write-Host " API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers." -ForegroundColor Gray

# Keep script alive and watch processes
while ($true) {
    Start-Sleep -Seconds 3
    $backend = Get-Process python -ErrorAction SilentlyContinue
    $frontend = Get-Process node -ErrorAction SilentlyContinue
    if (-not $backend) {
        Write-Host "Backend stopped! Restarting..." -ForegroundColor Red
        Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000" -WorkingDirectory "$PSScriptRoot\backend"
    }
}
