#!/bin/bash

# OG Image Generation Script for Ask Zen Insight
# This script converts the SVG OG image to PNG format using ImageMagick

echo "Generating OG image for Ask Zen Insight..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed."
    echo ""
    echo "Please install ImageMagick:"
    echo "  - macOS: brew install imagemagick"
    echo "  - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  - Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Input and output paths
INPUT_FILE="public/og-image.svg"
OUTPUT_FILE="public/og-image.png"
OUTPUT_FILE_2X="public/og-image@2x.png"

# Generate standard PNG (1200x630)
echo "Converting to PNG format..."
convert "$INPUT_FILE" -background none -resize 1200x630 "$OUTPUT_FILE"

# Generate high-resolution version (2400x1260)
echo "Generating high-resolution version..."
convert "$INPUT_FILE" -background none -resize 2400x1260 "$OUTPUT_FILE_2X"

# Optimize PNG size
echo "Optimizing PNG files..."
optipng -o7 "$OUTPUT_FILE" 2>/dev/null || echo "Note: optipng not available, skipping optimization"
optipng -o7 "$OUTPUT_FILE_2X" 2>/dev/null || echo "Note: optipng not available, skipping optimization"

echo ""
echo "✓ OG image generation complete!"
echo "  - Standard: $OUTPUT_FILE (1200x630)"
echo "  - High-res: $OUTPUT_FILE_2X (2400x1260)"
echo ""
echo "You can now use these images in:"
echo "  - HTML meta tags: <meta property='og:image' content='/og-image.png'>"
echo "  - Blog posts: ![OG Image](/og-image.png)"
echo "  - Social media sharing"
