@echo off
rem Local dev server with split routing for cross-border network conditions:
rem - Node server-side fetch (Supabase) -> local proxy 127.0.0.1:7897
rem   (see scripts/dev-proxy-preload.cjs; direct connection is blocked)
rem - Turbopack font download (fonts.gstatic.com) and domestic endpoints
rem   stay DIRECT (they fail through the proxy)
rem Do NOT set HTTPS_PROXY/HTTP_PROXY globally here - that breaks fonts.
set NODE_OPTIONS=--require %~dp0scripts\dev-proxy-preload.cjs
call pnpm dev > dev-server.log 2>&1
