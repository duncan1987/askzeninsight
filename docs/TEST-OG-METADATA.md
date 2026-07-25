# OG Metadata Setup - Verification & Testing

## ✅ What Was Added

Your `app/layout.tsx` now includes comprehensive metadata:

### 1. Basic SEO
- **Keywords:** zen, meditation, mindfulness, spiritual guidance, AI meditation teacher
- **Authors & Publisher:** Proper attribution
- **Robots directives:** Allow indexing and following
- **Format detection:** Disabled for privacy

### 2. Open Graph (Facebook, LinkedIn, etc.)
- **Type:** Website
- **Locale:** en_US
- **Title:** Ask Zen Insight - AI-Powered Spiritual Guidance
- **Description:** Discover inner wisdom through mindful conversation...
- **Images:** /og-image.svg (1200x630px)

### 3. Twitter Cards
- **Card type:** summary_large_image
- **Title:** Same as OG
- **Description:** Same as OG
- **Images:** /og-image.svg

### 4. Additional Metadata
- **metadataBase:** URL base for proper link resolution
- **Verification:** Google verification (if configured)

## 🧪 How to Test

### 1. Local Testing

After starting your dev server (`pnpm dev`):

```bash
# Check the HTML source
curl http://localhost:3000 | grep "og:" | head -10

# Or use a browser to view source
# Right-click → View Page Source → Search for "og:"
```

### 2. Online Testing Tools

**Facebook Sharing Debugger:**
```
https://developers.facebook.com/tools/debug/
```
- Enter your URL (e.g., https://your-site.com)
- Click "Debug"
- Review the preview image and metadata

**Twitter Card Validator:**
```
https://cards-dev.twitter.com/validator
```
- Enter your URL
- Check if "summary_large_image" card appears

**LinkedIn Post Inspector:**
```
https://www.linkedin.com/post-inspector/
```
- Enter your URL
- Verify the preview

### 3. Browser Testing

Use these Chrome extensions:
- **Open Graph Preview** - Preview OG tags
- **Meta SEO Inspector** - Check all metadata

## 📋 Verification Checklist

- [ ] Deploy your site (or use staging URL)
- [ ] Test with Facebook Debugger
- [ ] Test with Twitter Card Validator
- [ ] Test with LinkedIn Post Inspector
- [ ] Share on a test account to see actual preview
- [ ] Check mobile preview (social apps may crop differently)

## 🔧 Configuration Options

### Update Your Domain

Update the `metadataBase` in `app/layout.tsx`:

```typescript
metadataBase: new URL("https://your-actual-domain.com")
```

### Update Twitter Handle

Change the Twitter handles in the metadata:

```typescript
twitter: {
  creator: "@your-twitter-handle",  // Your personal handle
  site: "@your-site-handle",       // Your site's handle
}
```

### Add Google Verification

Add your Google Search Console verification code:

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-verification-code
```

## 🎨 PNG vs SVG

### Using SVG (Current - Recommended)
- ✅ Smaller file size
- ✅ Perfect scaling
- ✅ Modern browsers support
- ⚠️ Some older platforms may not support

### Using PNG (Alternative)

Generate PNG files first:

```bash
# Windows
generate-og-image.bat

# macOS/Linux
./generate-og-image.sh
```

Then update metadata:

```typescript
openGraph: {
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "Ask Zen Insight - AI-Powered Spiritual Guidance",
    },
  ],
}
twitter: {
  images: ["/og-image.png"],
}
```

## 🌐 Platform-Specific Notes

### Facebook/Instagram
- Caches images for 24-48 hours
- Use Facebook Debugger to clear cache
- Prefers JPG over PNG

### Twitter
- Caches for 24 hours
- Requires Twitter Card validation
- Supports both SVG and PNG

### LinkedIn
- Caches for 7 days
- Prefers PNG format
- May crop top/bottom

### Pinterest
- Caches for 24 hours
- Prefers vertical images
- Supports SVG

## 🚀 Deployment Checklist

- [ ] Deploy to production/staging
- [ ] Verify og-image.svg is accessible at `/og-image.svg`
- [ ] Test on all social platforms
- [ ] Update `metadataBase` with production URL
- [ ] Update Twitter handles
- [ ] Add Google verification (if needed)
- [ ] Submit sitemap to search engines

## 📈 Monitoring

After deployment, monitor:

1. **Social shares:** Use tools like Buffer or Hootsuite
2. **SEO:** Google Search Console → "Enhancements" → "Open Graph"
3. **Traffic:** Google Analytics referral from social platforms
4. **Performance:** Page speed with large images

## 🎯 Next Steps

1. **Deploy changes** to production
2. **Test on social platforms** using the verification tools
3. **Share on platforms** to see real-world previews
4. **Monitor performance** and adjust if needed

## 🔗 Quick Reference Links

- **Facebook Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/
- **Open Graph Protocol:** https://ogp.me/
- **Twitter Cards:** https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards

---

**Ready to launch!** Your OG metadata is configured and ready for social sharing.
