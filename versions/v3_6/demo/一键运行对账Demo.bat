@echo off
chcp 65001 >nul
title SmartRecon Demo Launcher
cd /d "%~dp0"
echo ============================================
echo   SmartRecon Recon Agent Demo - Launcher
echo ============================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    python recon_agent_demo.py
) else (
    where py >nul 2>nul
    if %errorlevel%==0 (
        py recon_agent_demo.py
    ) else (
        echo [ERROR] Python not found.
        echo Please install Python 3 and add it to PATH.
        echo Visit https://www.python.org/downloads/
    )
)

echo.
echo ============================================
echo   Done. Press any key to close...
echo ============================================
pause >nul
