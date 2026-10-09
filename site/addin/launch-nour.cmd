@echo off
setlocal
set "NOUR_LOG=%~dp0launch-nour.log"
for %%M in (taskpane-manifest.xml manifest.xml) do (
  call npx.cmd --yes office-addin-dev-settings@4.0.1 register "%~dp0%%M" >> "%NOUR_LOG%" 2>&1
  if errorlevel 1 goto failed
  call npx.cmd --yes office-addin-dev-settings@4.0.1 debugging "%~dp0%%M" --enable --debug-method direct >> "%NOUR_LOG%" 2>&1
  if errorlevel 1 goto failed
)
start "" "%~dp0Nour.potx"
exit /b 0
:failed
start "" notepad.exe "%NOUR_LOG%"
exit /b 1
