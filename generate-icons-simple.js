// Generate simple but properly sized PNG icons using pure Node.js
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple PNG with solid color (green poker chip theme)
// This creates a minimal valid PNG file with the correct dimensions
function createSimplePNG(size) {
  const width = size;
  const height = size;

  // PNG header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk (image header)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(2, 9);  // color type (RGB)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Create image data - green circle on transparent background
  const bytesPerPixel = 3; // RGB
  const scanlineSize = 1 + width * bytesPerPixel; // filter byte + pixels
  const imageData = Buffer.alloc(scanlineSize * height);

  const center = size / 2;
  const radius = size * 0.4;

  for (let y = 0; y < height; y++) {
    const scanlineStart = y * scanlineSize;
    imageData[scanlineStart] = 0; // filter type (none)

    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const pixelStart = scanlineStart + 1 + x * bytesPerPixel;

      if (distance <= radius) {
        // Inside circle - green (#16a34a)
        imageData[pixelStart] = 0x16;     // R
        imageData[pixelStart + 1] = 0xa3; // G
        imageData[pixelStart + 2] = 0x4a; // B
      } else {
        // Outside circle - white background
        imageData[pixelStart] = 0xFF;     // R
        imageData[pixelStart + 1] = 0xFF; // G
        imageData[pixelStart + 2] = 0xFF; // B
      }
    }
  }

  // Compress image data (simple deflate)
  const compressed = zlib.deflateSync(imageData);

  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  // Combine all chunks
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = calculateCRC(Buffer.concat([typeBuffer, data]));

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function calculateCRC(buffer) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc = crcTable[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
  }
  crc = crc ^ 0xFFFFFFFF;

  const result = Buffer.alloc(4);
  result.writeUInt32BE(crc >>> 0, 0);
  return result;
}

async function generateIcons() {
  const sizes = [16, 48, 128];

  for (const size of sizes) {
    const png = createSimplePNG(size);
    const outputPath = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(outputPath, png);
    console.log(`✅ Created icon${size}.png (${size}x${size})`);
  }

  console.log('\n🎉 All icons generated successfully!');
  console.log('Icons are simple green circles - good enough for Chrome Web Store submission.');
}

generateIcons().catch(console.error);
