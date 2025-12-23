// Generate proper icons with poker theme
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG for a poker chip icon
function createPokerChipSVG(size) {
  const center = size / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.35;
  const middleRadius = size * 0.4;

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad${size}">
          <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#15803d;stop-opacity:1" />
        </radialGradient>
      </defs>

      <!-- Outer circle (green) -->
      <circle cx="${center}" cy="${center}" r="${outerRadius}" fill="url(#grad${size})" stroke="#fff" stroke-width="${size * 0.03}"/>

      <!-- White segments around the edge -->
      ${[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = (angle * Math.PI) / 180;
        const x1 = center + Math.cos(rad) * middleRadius;
        const y1 = center + Math.sin(rad) * middleRadius;
        const x2 = center + Math.cos(rad) * outerRadius;
        const y2 = center + Math.sin(rad) * outerRadius;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="${size * 0.05}" stroke-linecap="round"/>`;
      }).join('\n      ')}

      <!-- Inner circle (darker green) -->
      <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="#15803d" stroke="#fff" stroke-width="${size * 0.02}"/>

      <!-- Dollar sign in center -->
      <text x="${center}" y="${center * 1.15}"
            font-family="Arial, sans-serif"
            font-size="${size * 0.35}"
            font-weight="bold"
            fill="#fff"
            text-anchor="middle">$</text>
    </svg>
  `;
}

async function generateIcons() {
  const sizes = [16, 48, 128];

  for (const size of sizes) {
    const svg = createPokerChipSVG(size);
    const outputPath = path.join(iconsDir, `icon${size}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`✅ Created icon${size}.png (${size}x${size})`);
  }

  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
