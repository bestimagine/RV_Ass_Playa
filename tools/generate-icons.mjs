/**
 * Generates the PWA PNG icons from code so no binary assets need to be
 * hand-committed. Run: node tools/generate-icons.mjs
 *
 * The mark is a low sun over a flat horizon — the playa at dawn.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/assets/icons');

const BG = [0x1b, 0x16, 0x10];
const SUN = [0xff, 0xb5, 0x45];
const HORIZON = [0xff, 0xd4, 0x79];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 3;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function blend(base, overlay, alpha) {
  return base.map((channel, i) => Math.round(channel * (1 - alpha) + overlay[i] * alpha));
}

/** Supersampled so the sun edge is not a staircase at 192px. */
function drawIcon(size, inset) {
  const pixels = Buffer.alloc(size * size * 3);
  const samples = 3;
  const artSize = size * (1 - inset * 2);
  const originX = size * inset;
  const originY = size * inset;

  const sunCentreX = artSize * 0.5;
  const sunCentreY = artSize * 0.46;
  const sunRadius = artSize * 0.235;
  const horizonTop = artSize * 0.66;
  const horizonBottom = artSize * 0.735;
  const horizonLeft = artSize * 0.12;
  const horizonRight = artSize * 0.88;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sunHits = 0;
      let horizonHits = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples - originX;
          const py = y + (sy + 0.5) / samples - originY;
          const dx = px - sunCentreX;
          const dy = py - sunCentreY;
          if (dx * dx + dy * dy <= sunRadius * sunRadius) sunHits += 1;
          if (py >= horizonTop && py <= horizonBottom && px >= horizonLeft && px <= horizonRight) {
            horizonHits += 1;
          }
        }
      }
      const total = samples * samples;
      let colour = BG;
      if (sunHits) colour = blend(colour, SUN, sunHits / total);
      if (horizonHits) colour = blend(colour, HORIZON, horizonHits / total);

      const offset = (y * size + x) * 3;
      pixels[offset] = colour[0];
      pixels[offset + 1] = colour[1];
      pixels[offset + 2] = colour[2];
    }
  }
  return encodePng(size, pixels);
}

const OUTPUTS = [
  { file: 'icon-192.png', size: 192, inset: 0.1 },
  { file: 'icon-512.png', size: 512, inset: 0.1 },
  { file: 'icon-maskable-512.png', size: 512, inset: 0.21 },
  { file: 'apple-touch-icon.png', size: 180, inset: 0.1 }
];

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="RV AI Assistant — Playa">
  <rect width="64" height="64" rx="12" fill="#1b1610"/>
  <circle cx="32" cy="29.5" r="12" fill="#ffb545"/>
  <rect x="9" y="42" width="46" height="5" rx="2.5" fill="#ffd479"/>
</svg>
`;

mkdirSync(OUT_DIR, { recursive: true });
for (const output of OUTPUTS) {
  const png = drawIcon(output.size, output.inset);
  writeFileSync(resolve(OUT_DIR, output.file), png);
  console.log(`wrote ${output.file} (${output.size}px, ${png.length} bytes)`);
}
writeFileSync(resolve(OUT_DIR, 'favicon.svg'), FAVICON_SVG);
console.log('wrote favicon.svg');
