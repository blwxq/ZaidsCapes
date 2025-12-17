@echo off
title Zaid's Capes - Full Server
color 0A
cls
echo.
echo ================================================================
echo                  ZAID'S CAPES FULL SERVER
echo ================================================================
echo.
echo Starting combined server (static files + API)...
echo.
cd /d "%~dp0"
python api.py
pause

