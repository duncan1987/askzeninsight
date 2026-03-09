# OG Image Setup - Quick Start

## ✅ Files Created

1. **`public/og-image.svg`** - Vector format, ready to use
2. **`generate-og-image.bat`** - Windows PNG generation script
3. **`generate-og-image.sh`** - macOS/Linux PNG generation script
4. **`OG-IMAGE-GUIDE.md`** - Complete documentation
5. **`ask-zen-insight-blog-post.md`** - Dev.to blog post

## 🚀 Quick Start (3 Options)

### Option 1: Use SVG Directly (Recommended)

No conversion needed! Modern browsers and many platforms support SVG.

```typescript
// In app/layout.tsx
export const metadata: Metadata = {
  openGraph: {
    images: [{
      url: "/og-image.svg",
      width: 1200,
      height: 630,
    }],
  },
}
```

### Option 2: Generate PNG on Windows

1. Install ImageMagick: https://imagemagick.org/script/download.php
   - ✅ Check "Install legacy utilities (e.g. convert)"
2. Run: `generate-og-image.bat`
3. Update metadata to use `/og-image.png`

### Option 3: Generate PNG on macOS/Linux

1. Install ImageMagick: `brew install imagemagick`
2. Run: `chmod +x generate-og-image.sh && ./generate-og-image.sh`
3. Update metadata to use `/og-image.png`

## 📝 For Your Blog Post

Update `ask-zen-insight-blog-post.md`:

```markdown
![Ask Zen Insight](https://your-site.com/og-image.png)
```

Replace `your-site.com` with your actual domain.

## 🎨 Design Features

Your OG image includes:

- ✅ **Zen-inspired design** with enso circle and sparkles
- ✅ **Perfect dimensions** 1200x630px (standard OG size)
- ✅ **Brand colors** matching your site's dark/light themes
- ✅ **Clear hierarchy** - title, subtitle, tagline
- ✅ **Feature badges** - "Free to Use", "Real-time AI"
- ✅ **Professional typography** using Inter font

## 🌐 Platform Preview

Your OG image will look great on:

- ✅ Facebook/LinkedIn - Full preview (1200x630)
- ✅ Twitter - Large card with full image
- ✅ Dev.to - Featured image for blog posts
- ✅ WhatsApp - Optimized preview
- ✅ Slack - Rich link preview

## 📋 Next Steps

1. **Generate PNG** (recommended for broader compatibility)
2. **Update your layout.tsx** with OG metadata
3. **Test on social platforms** using debug tools
4. **Deploy and share** your blog post

## 🔗 Testing Tools

Test your OG image appearance:

- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

## 💡 Pro Tips

1. **SVG is better** - Use `/og-image.svg` if platform supports it
2. **Cache control** - Social platforms cache OG images for 24-48 hours
3. **File size** - Keep PNG under 200KB for optimal performance
4. **A/B testing** - Try different designs to see which performs better

## 🎯 Checklist

- [ ] Generate PNG files (optional but recommended)
- [ ] Update `app/layout.tsx` with OG metadata
- [ ] Test on Facebook Debugger
- [ ] Test on Twitter Card Validator
- [ ] Update blog post with OG image URL
- [ ] Deploy changes to production

---

**Need detailed documentation?** Check `OG-IMAGE-GUIDE.md` for complete instructions.

**Questions?** Review the troubleshooting section in the guide.
