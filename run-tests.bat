@echo off
setlocal EnableDelayedExpansion

REM Load environment variables from .env.local
for /f "tokens=1,2 delims==" %%a in (.env.local) do (
    set %%a=%%b
)

REM Run Jest with the loaded environment variables
"C:\Program Files\nodejs\node.exe" node_modules\jest\bin\jest.js %*
