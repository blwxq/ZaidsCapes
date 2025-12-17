@echo off
title Installing Website Dependencies
color 0A
cls
echo.
echo ================================================================
echo       INSTALLING WEBSITE DEPENDENCIES
echo ================================================================
echo.
echo Installing Flask and Flask-CORS...
python -m pip install flask flask-cors
echo.
echo Checking other dependencies...
python -c "import aiohttp, discord, dotenv; print('✅ All other dependencies are already installed!')"
echo.
echo ================================================================
echo Installation complete!
echo ================================================================
pause

