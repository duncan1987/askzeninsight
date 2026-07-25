# OG Image Guide for Ask Zen Insight

## What is an OG Image?

An Open Graph (OG) image is a preview image displayed when your website is shared on social media platforms like Twitter, Facebook, LinkedIn, etc.

## Files Created

### 1. SVG Format (Vector)
- **Location:** `public/og-image.svg`
- **Advantages:** Infinite scalability, small file size, crisp at any resolution
- **Best for:** Modern browsers, responsive design

### 2. PNG Format (Raster)
- **Location:** `public/og-image.png` (1200x630px)
- **Location:** `public/og-image@2x.png` (2400x1260px)
- **Advantages:** Universal compatibility, optimized for social media
- **Best for:** Social sharing, platforms that don't support SVG

## How to Generate PNG Files

### On Windows (Recommended)

1. **Install ImageMagick:**
   - Download from: https://imagemagick.org/script/download.php
   - During installation, **check "Install legacy utilities (e.g. convert)"**
   - Add to PATH during installation

2. **Run the script:**
   ```cmd
   generate-og-image.bat
   ```

### On macOS/Linux

1. **Install ImageMagick:**
   ```bash
   # macOS
   brew install imagemagick

   # Ubuntu/Debian
   sudo apt-get install imagemagick
   ```

2. **Run the script:**
   ```bash
   chmod +x generate-og-image.sh
   ./generate-og-image.sh
   ```

## How to Use in Your Website

### 1. Add to Next.js Layout

Update `app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "Ask Zen Insight - AI-Powered Spiritual Guidance",
  description: "Receive thoughtful spiritual guidance and Zen wisdom through AI-powered conversations.",
  openGraph: {
    title: "Ask Zen Insight - AI-Powered Spiritual Guidance",
    description: "Discover inner wisdom through mindful conversation with our AI meditation teacher.",
    url: "https://askzeninsight.com",
    siteName: "Ask Zen Insight",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ask Zen Insight - AI-Powered Spiritual Guidance",
      },
      {
        url: "/og-image@2x.png",
        width: 2400,
        height: 1260,
        alt: "Ask Zen Insight - AI-Powered Spiritual Guidance",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ask Zen Insight - AI-Powered Spiritual Guidance",
    description: "Discover inner wisdom through mindful conversation with our AI meditation teacher.",
    images: ["/og-image.png"],
  },
}
```

### 2. Test Your OG Image

Use these tools to preview how your OG image will appear:

- **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/

### 3. Use in Blog Posts

For the dev.to blog post:

```markdown
![Ask Zen Insight](https://askzeninsight.com/og-image.png)
```

## OG Image Specifications

### Recommended Sizes
- **Standard:** 1200x630px (1.91:1 ratio)
- **High-res:** 2400x1260px (@2x for retina displays)

### File Size
- **Optimal:** Under 200KB
- **Maximum:** 5MB (platform dependent)

### Aspect Ratios
- **Facebook/LinkedIn:** 1200x630px (1.91:1)
- **Twitter:** 1200x600px (2:1) or 800x418px (1.91:1)
- **Pinterest:** 1000x1500px (2:3)

## Design Philosophy

The OG image embodies the Zen aesthetic:

- **Minimalism:** Clean, uncluttered design
- **Balance:** Symmetrical composition with the enso (Zen circle)
- **Colors:** Subtle grays and blues (#1e293b, #64748b, #94a3b8)
- **Typography:** Clean, readable fonts (Inter)
- **Symbolism:** Sparkles representing mindfulness and awareness

## Customization

### Changing Colors

Edit `public/og-image.svg` and modify these values:

```svg
<!-- Main gradient colors -->
<stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
<stop offset="100%" style="stop-color:#334155;stop-opacity:1" />

<!-- Text colors -->
<text fill="#1e293b">  <!-- Main text -->
<text fill="#475569">  <!-- Subtitle -->
<text fill="#64748b">  <!-- Tagline -->
```

### Changing Text

Find and modify in `public/og-image.svg`:

```svg
<!-- Main title -->
<text>Ask Zen Insight</text>

<!-- Subtitle -->
<text>AI-Powered Spiritual Guidance</text>

<!-- Tagline -->
<text>Discover inner wisdom through mindful conversation</text>
```

### Changing URL

Update the website URL:

```svg
<text>askzeninsight.com</text>
```

## Troubleshooting

### Issue: Image appears blank on social media

**Solution:**
1. Ensure your image is accessible publicly
2. Check file permissions
3. Clear Facebook/Twitter cache using debugging tools

### Issue: Image is too large

**Solution:**
1. Reduce image dimensions
2. Optimize using tools like TinyPNG
3. Use vector (SVG) format where possible

### Issue: Colors don't match

**Solution:**
1. Test on different platforms (each may color-correct)
2. Use sRGB color space
3. Avoid pure black (#000000) and white (#ffffff)

## Best Practices

1. **Update regularly:** Refresh your OG image when your branding changes
2. **Test across platforms:** Different platforms crop images differently
3. **Keep it simple:** Complex designs may not render well on all platforms
4. **Include branding:** Always show your logo or brand name
5. **Make it readable:** Ensure text is large enough to read on small screens

## Additional Resources

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Documentation](https://developers.facebook.com/docs/sharing/webmasters)

## Quick Reference

### Platform-Specific Requirements

| Platform | Size | Format | Max Size |
|----------|------|--------|----------|
| Facebook | 1200x630 | JPG/PNG | 8MB |
| Twitter | 1200x600 | JPG/PNG | 5MB |
| LinkedIn | 1200x627 | JPG/PNG | 5MB |
| Pinterest | 1000x1500 | JPG/PNG | 10MB |
| WhatsApp | 400x400 | JPG/PNG | 300KB |

---

**Need help?** Check the main project documentation or open an issue on GitHub.
