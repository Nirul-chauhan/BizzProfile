@echo off
title BizzProfile - Starting...
echo ============================================
echo   BizzProfile - Starting Frontend & Backend
echo ============================================
echo.

:: Kill any existing processes
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

:: Start Backend in new window
echo [1/2] Starting Backend on http://localhost:8000 ...
start "BizzProfile-Backend" cmd /k "cd /d C:\Users\hp\Desktop\BizzProfile\backend && C:\Users\hp\Desktop\BizzProfile\backend\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

:: Wait for backend to start
timeout /t 4 /nobreak >nul

:: Start Frontend in new window
echo [2/2] Starting Frontend on http://localhost:5173 ...
start "BizzProfile-Frontend" cmd /k "cd /d C:\Users\hp\Desktop\BizzProfile\frontend && npx vite --host --port 5173"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   Both servers are running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ============================================
echo.

:: Auto-open browser
start http://localhost:5173
