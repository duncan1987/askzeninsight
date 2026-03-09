#!/bin/bash

# OG Metadata Testing Script
# Quick script to verify OG metadata configuration

echo "======================================"
echo "  OG Metadata Testing Script"
echo "======================================"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Error: Development server is not running at http://localhost:3000"
    echo "Please start the server first:"
    echo "  export PATH=\"/c/Program Files/nodejs:\$PATH\" && npm run dev"
    exit 1
fi

echo "✅ Development server is running"
echo ""

# Get page content
echo "📄 Fetching page content..."
PAGE_CONTENT=$(curl -s http://localhost:3000)
echo "✅ Page content fetched"
echo ""

# Test OG tags
echo "🔍 Testing Open Graph Tags..."
echo "--------------------------------------"

OG_TITLE=$(echo "$PAGE_CONTENT" | grep -oP '(?<=og:title" content=")[^"]*' || echo "NOT FOUND")
OG_DESC=$(echo "$PAGE_CONTENT" | grep -oP '(?<=og:description" content=")[^"]*' | head -c 80 || echo "NOT FOUND")
OG_IMAGE=$(echo "$PAGE_CONTENT" | grep -oP '(?<=og:image" content=")[^"]*' || echo "NOT FOUND")

if [ "$OG_TITLE" != "NOT FOUND" ]; then
    echo "✅ og:title: $OG_TITLE"
else
    echo "❌ og:title: NOT FOUND"
fi

if [ "$OG_DESC" != "NOT FOUND" ]; then
    echo "✅ og:description: $OG_DESC..."
else
    echo "❌ og:description: NOT FOUND"
fi

if [ "$OG_IMAGE" != "NOT FOUND" ]; then
    echo "✅ og:image: $OG_IMAGE"
else
    echo "❌ og:image: NOT FOUND"
fi

echo ""

# Test Twitter tags
echo "🔍 Testing Twitter Card Tags..."
echo "--------------------------------------"

TWITTER_CARD=$(echo "$PAGE_CONTENT" | grep -oP '(?<=twitter:card" content=")[^"]*' || echo "NOT FOUND")
TWITTER_IMAGE=$(echo "$PAGE_CONTENT" | grep -oP '(?<=twitter:image" content=")[^"]*' || echo "NOT FOUND")

if [ "$TWITTER_CARD" != "NOT FOUND" ]; then
    echo "✅ twitter:card: $TWITTER_CARD"
else
    echo "❌ twitter:card: NOT FOUND"
fi

if [ "$TWITTER_IMAGE" != "NOT FOUND" ]; then
    echo "✅ twitter:image: $TWITTER_IMAGE"
else
    echo "❌ twitter:image: NOT FOUND"
fi

echo ""

# Test SEO tags
echo "🔍 Testing SEO Tags..."
echo "--------------------------------------"

KEYWORDS=$(echo "$PAGE_CONTENT" | grep -oP '(?<=name="keywords" content=")[^"]*' || echo "NOT FOUND")
DESCRIPTION=$(echo "$PAGE_CONTENT" | grep -oP '(?<=name="description" content=")[^"]*' | head -c 80 || echo "NOT FOUND")

if [ "$KEYWORDS" != "NOT FOUND" ]; then
    echo "✅ keywords: $KEYWORDS"
else
    echo "❌ keywords: NOT FOUND"
fi

if [ "$DESCRIPTION" != "NOT FOUND" ]; then
    echo "✅ description: $DESCRIPTION..."
else
    echo "❌ description: NOT FOUND"
fi

echo ""

# Test image accessibility
echo "🔍 Testing OG Image Accessibility..."
echo "--------------------------------------"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/og-image.svg | grep -q "200"; then
    IMAGE_SIZE=$(curl -sI http://localhost:3000/og-image.svg | grep -i "content-length" | cut -d' ' -f2 | tr -d '\r')
    echo "✅ OG Image is accessible"
    echo "✅ Image Size: $IMAGE_SIZE bytes"
else
    echo "❌ OG Image is NOT accessible"
fi

echo ""

# Summary
echo "======================================"
echo "  Testing Complete!"
echo "======================================"
echo ""
echo "🌐 Development Server: http://localhost:3000"
echo "🧪 Online Testing Tools:"
echo "   - Facebook: https://developers.facebook.com/tools/debug/"
echo "   - Twitter: https://cards-dev.twitter.com/validator"
echo "   - LinkedIn: https://www.linkedin.com/post-inspector/"
echo ""
