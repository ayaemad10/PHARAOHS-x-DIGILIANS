@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Flame in Freefall - cleanup of files replaced in the release round
echo This restores the compact WebP images and deletes ONLY old images that now have a .webp copy, inside this folder.
echo.
pause
if exist "clean-images.zip" (
  echo Restoring compact WebP images from clean-images.zip ...
  tar -xf "clean-images.zip" && del /q "clean-images.zip"
)
if exist "public\data\saffire\frames\*.jpg" del /q "public\data\saffire\frames\*.jpg"
if exist "public\brand\logo.png" del /q "public\brand\logo.png"
if exist "public\brand\icon.png" del /q "public\brand\icon.png"
if exist "public\brand\logo-hero.jpg" del /q "public\brand\logo-hero.jpg"
if exist "public\team\*.jpg" del /q "public\team\*.jpg"
if exist "public\media\demo-poster.jpg" del /q "public\media\demo-poster.jpg"
if exist "public\media\saffire-v-poster.jpg" del /q "public\media\saffire-v-poster.jpg"
echo.
set /p DELNEXT=Also delete the .next build folder so the next run rebuilds cleanly? (y/n) 
if /i "%DELNEXT%"=="y" if exist ".next" rmdir /s /q ".next"
echo.
echo Done. Now run RUN-APP.bat
pause
