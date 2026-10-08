@echo off
rem Adds the Live Lesson add-in to PowerPoint on this computer (Insert > Add-ins > My Add-ins > Developer Add-ins).
rem Keep manifest.xml in this same folder.
reg add "HKCU\Software\Microsoft\Office\16.0\WEF\Developer" /v "LiveLesson" /t REG_SZ /d "%~dp0manifest.xml" /f
echo.
echo Live Lesson add-in installed. Close PowerPoint completely and open it again.
echo Then go to Insert ^> Add-ins ^> My Add-ins and pick Live Lesson.
pause
