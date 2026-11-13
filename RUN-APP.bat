@echo off
title Flame in Freefall
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [X] Node.js is not installed on this computer.
  echo      Download the LTS version from https://nodejs.org , install it, then run this file again.
  start "" https://nodejs.org/en/download
  pause
  exit /b 1
)

echo Node version:
node -v

rem Run Next.js through node directly, so a missing node_modules\.bin folder cannot break it.
set NEXT=node node_modules\next\dist\bin\next
rem Check that the installed packages are complete; a half-finished install is removed and redone.
node -e "require.resolve('next/dist/server/require-hook');require.resolve('react-dom');require.resolve('three')" >nul 2>nul
if errorlevel 1 (
  echo.
  echo Packages are missing or incomplete. Reinstalling - this can take a few minutes, keep the window open...
  if exist node_modules rmdir /s /q node_modules
  if exist .next rmdir /s /q .next
  call npm install
  if errorlevel 1 (
    echo.
    echo  [X] npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

rem Runs on port 3005. To edit the code with live reload instead, run:  npx next dev -p 3005
set PORT=3005
echo.
echo Building the app - takes about a minute...
call %NEXT% build
if errorlevel 1 (
  echo  [X] Build failed - send a screenshot of this window.
  pause
  exit /b 1
)
echo.
echo Flame in Freefall is running on http://localhost:%PORT%  - keep this window open.
start "" /b powershell -NoProfile -Command "for($i=0;$i -lt 180;$i++){try{Invoke-WebRequest -UseBasicParsing http://localhost:%PORT% -TimeoutSec 3 | Out-Null; Start-Process http://localhost:%PORT%; break}catch{Start-Sleep 1}}"
call %NEXT% start -p %PORT%
pause
