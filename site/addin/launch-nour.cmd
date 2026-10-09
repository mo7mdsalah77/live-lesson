@echo off
setlocal
set "NOUR_LOG=%~dp0launch-nour.log"
set "NOUR_TOOL=%LOCALAPPDATA%\Nour\tools\node_modules\.bin\office-addin-dev-settings.cmd"
if not exist "%NOUR_TOOL%" (
  call npm.cmd install --prefix "%LOCALAPPDATA%\Nour\tools" --no-audit --no-fund office-addin-dev-settings@4.0.1 >> "%NOUR_LOG%" 2>&1
  if errorlevel 1 goto failed
)
for %%M in (taskpane-manifest.xml manifest.xml) do (
  call "%NOUR_TOOL%" register "%~dp0%%M" >> "%NOUR_LOG%" 2>&1
  if errorlevel 1 goto failed
  call "%NOUR_TOOL%" debugging "%~dp0%%M" --enable --debug-method direct >> "%NOUR_LOG%" 2>&1
  if errorlevel 1 goto failed
)
start "" "%~dp0Nour.potx"
exit /b 0
:failed
start "" notepad.exe "%NOUR_LOG%"
exit /b 1
