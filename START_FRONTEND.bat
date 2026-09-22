@echo off
setlocal
cd /d %~dp0frontend
echo Installing frontend dependencies...
npm install
if errorlevel 1 (
  echo.
  echo npm install failed. Check the Node.js/npm installation and try again.
  pause
  exit /b 1
)
echo.
echo Starting Vite...
npm run dev
