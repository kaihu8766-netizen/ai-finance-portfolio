@echo off
chcp 65001 >nul
title LPR Monte Carlo Demo Launcher
cd /d "%~dp0"
echo ============================================
echo   LPR Monte Carlo Demo - Launcher
echo ============================================
echo.

rem ---- locate python ----
set "PYCMD="
where python >nul 2>nul
if %errorlevel%==0 (
    set "PYCMD=python"
) else (
    where py >nul 2>nul
    if %errorlevel%==0 (
        set "PYCMD=py"
    )
)
if "%PYCMD%"=="" (
    echo [ERROR] Python not found.
    echo Please install Python 3 and add it to PATH.
    echo Visit https://www.python.org/downloads/
    goto :end
)

rem ---- dependency check: numpy + matplotlib ----
%PYCMD% -c "import numpy, matplotlib" >nul 2>nul
if %errorlevel%==0 (
    goto :run
)

echo [!] Missing dependencies: numpy / matplotlib are required.
echo     Install manually: %PYCMD% -m pip install numpy matplotlib
echo.
set /p "INSTALL=Auto-install now? [Y/n]: "
if /i "%INSTALL%"=="Y" (
    echo.
    echo Installing numpy and matplotlib, please wait...
    %PYCMD% -m pip install numpy matplotlib
    if %errorlevel%==0 (
        echo [OK] Dependencies installed.
        goto :run
    ) else (
        echo.
        echo [ERROR] Auto-install failed. Please run manually:
        echo     %PYCMD% -m pip install numpy matplotlib
        goto :end
    )
) else (
    echo.
    echo [SKIP] Please install dependencies manually first:
    echo     %PYCMD% -m pip install numpy matplotlib
    goto :end
)

:run
%PYCMD% lpr_monte_carlo.py

:end
echo.
echo ============================================
echo   Done. Press any key to close...
echo ============================================
pause >nul
