@echo off
powershell.exe -NoProfile -File "%~dp0install-nour-catalog.ps1"
if errorlevel 1 echo Installation needs administrator access. Right-click this file and choose Run as administrator.
pause
