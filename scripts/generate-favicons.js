/**
 * Generate favicon PNG files from SVG
 * Run with: node scripts/generate-favicons.js
 *
 * This script requires:
 * - npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgContent = `
<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="180" height="180" rx="40" fill="#f8fafc" />

  <g fill="url(#sparkle-gradient)" transform="translate(90, 90)">
    <path d="M0 -55 C5 -35 10 -25 25 -15 L25 -15 C10 -5 5 5 0 25 C-5 5 -10 -5 -25 -15 L-25 -15 C-10 -25 -5 -35 0 -55 Z" />
    <circle cx="0" cy="-45" r="5" />
    <circle cx="0" cy="45" r="5" />
    <circle cx="-45" cy="0" r="5" />
    <circle cx="45" cy="0" r="5" />
    <circle cx="-32" cy="-32" r="3.5" />
    <circle cx="32" cy="-32" r="3.5" />
    <circle cx="-32" cy="32" r="3.5" />
    <circle cx="32" cy="32" r="3.5" />
    <circle cx="-15" cy="-50" r="2.5" />
    <circle cx="15" cy="-50" r="2.5" />
    <circle cx="-50" cy="-15" r="2.5" />
    <circle cx="50" cy="-15" r="2.5" />
    <circle cx="-15" cy="50" r="2.5" />
    <circle cx="15" cy="50" r="2.5" />
    <circle cx="-50" cy="15" r="2.5" />
    <circle cx="50" cy="15" r="2.5" />
  </g>
</svg>
`;

const darkSvgContent = `
<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a78bfa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f472b6;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="180" height="180" rx="40" fill="#1e293b" />

  <g fill="url(#sparkle-gradient)" transform="translate(90, 90)">
    <path d="M0 -55 C5 -35 10 -25 25 -15 L25 -15 C10 -5 5 5 0 25 C-5 5 -10 -5 -25 -15 L-25 -15 C-10 -25 -5 -35 0 -55 Z" />
    <circle cx="0" cy="-45" r="5" />
    <circle cx="0" cy="45" r="5" />
    <circle cx="-45" cy="0" r="5" />
    <circle cx="45" cy="0" r="5" />
    <circle cx="-32" cy="-32" r="3.5" />
    <circle cx="32" cy="-32" r="3.5" />
    <circle cx="-32" cy="32" r="3.5" />
    <circle cx="32" cy="32" r="3.5" />
    <circle cx="-15" cy="-50" r="2.5" />
    <circle cx="15" cy="-50" r="2.5" />
    <circle cx="-50" cy="-15" r="2.5" />
    <circle cx="50" cy="-15" r="2.5" />
    <circle cx="-15" cy="50" r="2.5" />
    <circle cx="15" cy="50" r="2.5" />
    <circle cx="-50" cy="15" r="2.5" />
    <circle cx="50" cy="15" r="2.5" />
  </g>
</svg>
`;

async function generateFavicons() {
  const publicDir = path.join(__dirname, '..', 'public');

  try {
    // Generate 32x32 light mode PNG
    await sharp(Buffer.from(svgContent))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'icon-light-32x32.png'));

    // Generate 32x32 dark mode PNG
    await sharp(Buffer.from(darkSvgContent))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'icon-dark-32x32.png'));

    // Generate 180x180 Apple icon PNG
    await sharp(Buffer.from(svgContent))
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-icon.png'));

    console.log('✅ Favicons generated successfully!');
    console.log('   - icon-light-32x32.png');
    console.log('   - icon-dark-32x32.png');
    console.log('   - apple-icon.png');
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    console.error('\n💡 Make sure to install sharp: npm install sharp');
  }
}

generateFavicons();
