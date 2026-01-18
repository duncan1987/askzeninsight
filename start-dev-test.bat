@echo off
setlocal EnableDelayedExpansion

REM Load environment variables from .env.local
for /f "tokens=1,2 delims==" %%a in (.env.local) do (
    set %%a=%%b
)

REM Add test mode flag
set CREEM_SKIP_WEBHOOK_VERIFICATION=true

REM Start Next.js dev server
"C:\Program Files\nodejs\node.exe" node_modules\next\dist\bin\next dev
