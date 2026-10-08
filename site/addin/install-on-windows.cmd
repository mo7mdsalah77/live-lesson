@echo off
rem Adds the Nour add-in to PowerPoint on this computer (Insert > Add-ins > My Add-ins > Developer Add-ins).
rem Keep manifest.xml in this same folder.
reg add "HKCU\Software\Microsoft\Office\16.0\WEF\Developer" /v "aae5001e-6872-4edb-aea5-1351ae3b275d" /t REG_SZ /d "%~dp0manifest.xml" /f
if exist "%~dp0taskpane-manifest.xml" reg add "HKCU\Software\Microsoft\Office\16.0\WEF\Developer" /v "a97e0b29-e7df-4c03-8121-0e1acb5e2844" /t REG_SZ /d "%~dp0taskpane-manifest.xml" /f
echo.
echo Nour add-in installed. Close PowerPoint completely and open it again.
echo Then go to Insert ^> Add-ins ^> My Add-ins and pick Nour for the side panel.
echo On the Home ribbon, click Add interaction to open it.
echo For the persistent catalog, run install-nour-catalog.cmd as administrator.
pause
