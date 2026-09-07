@echo off
setlocal EnableDelayedExpansion

REM Load environment variables from .env.local
for /f "tokens=1,2 delims==" %%a in (.env.local) do (
    set %%a=%%b
)

REM Run Jest with the loaded environment variables
where node >nul 2>&1
if %errorlevel%==0 (
    node node_modules\jest\bin\jest.js %*
) else if exist "C:\nvm4w\nodejs\node.exe" (
    "C:\nvm4w\nodejs\node.exe" node_modules\jest\bin\jest.js %*
) else (
    "C:\Program Files\nodejs\node.exe" node_modules\jest\bin\jest.js %*
)
