@echo off
echo Killing all Electron and Node processes...
taskkill /f /im electron.exe 2>nul
taskkill /f /im node.exe 2>nul

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo Starting Sentinel app...
npm run dev:electron
