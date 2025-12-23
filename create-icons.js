// Simple script to create placeholder icon files
// This creates minimal valid PNG files with solid colors

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal 1x1 green PNG in base64 (valid PNG format)
const greenPixelPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder icons
['icon16.png', 'icon48.png', 'icon128.png'].forEach(filename => {
  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, greenPixelPNG);
  console.log(`Created ${filename}`);
});

console.log('\n✅ Placeholder icons created!');
console.log('⚠️  These are 1x1 pixel placeholders. Replace them with proper icons before publishing.');
console.log('   You can use https://www.favicon-generator.org/ or similar tools.\n');
