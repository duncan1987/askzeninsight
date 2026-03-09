@echo off
REM OG Image Generation Script for Ask Zen Insight (Windows)
REM This script converts the SVG OG image to PNG format using ImageMagick

echo Generating OG image for Ask Zen Insight...

REM Check if ImageMagick is installed
where magick >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: ImageMagick is not installed.
    echo.
    echo Please install ImageMagick:
    echo   - Download from: https://imagemagick.org/script/download.php
    echo   - During installation, check "Install legacy utilities (e.g. convert)"
    pause
    exit /b 1
)

REM Input and output paths
set INPUT_FILE=public\og-image.svg
set OUTPUT_FILE=public\og-image.png
set OUTPUT_FILE_2X=public\og-image@2x.png

REM Generate standard PNG (1200x630)
echo Converting to PNG format...
magick convert "%INPUT_FILE%" -background none -resize 1200x630 "%OUTPUT_FILE%"

REM Generate high-resolution version (2400x1260)
echo Generating high-resolution version...
magick convert "%INPUT_FILE%" -background none -resize 2400x1260 "%OUTPUT_FILE_2X%"

echo.
echo ========================================
echo   OG image generation complete!
echo ========================================
echo   Standard: %OUTPUT_FILE% (1200x630)
echo   High-res: %OUTPUT_FILE_2X% (2400x1260)
echo ========================================
echo.
echo You can now use these images in:
echo   - HTML meta tags: ^<meta property='og:image' content='/og-image.png'^>
echo   - Blog posts: ![OG Image](/og-image.png)
echo   - Social media sharing
echo.
pause
