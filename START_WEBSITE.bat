@echo off
title Zaid's Capes Website Server
color 0A
cls
echo.
echo ================================================================
echo                  ZAID'S CAPES WEBSITE SERVER
echo ================================================================
echo.
echo Starting server...
echo.
cd /d "%~dp0"
python start_server.py
pause

