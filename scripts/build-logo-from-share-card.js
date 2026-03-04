#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const sharp = require('sharp');

async function main() {
  const repoRoot = process.cwd();
  const generator = path.join(repoRoot, 'scripts', 'generate-share-card.js');

  const width = 3600;
  const height = 1890;
  const slug = 'logo-source';
  const prefix = 'tmp_';
  const tempPng = path.join(repoRoot, 'images', `${prefix}${slug}.png`);

  const result = spawnSync('node', [
    generator,
    '--slug', slug,
    '--prefix', prefix,
    '--title', 'Schengen Visa Support\\nComplete Guide',
    '--desc', 'Official Schengen visa information and guidance.',
    '--url', 'schengenvisasupport.com',
    '--logo', 'true',
    '--qr', 'false',
    '--formats', 'png',
    '--saveSvg', 'false',
    '--engine', 'browser',
    '--width', String(width),
    '--height', String(height)
  ], { cwd: repoRoot, encoding: 'utf8' });

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || 'Failed to generate temp share card.');
    process.exit(1);
  }

  if (!fs.existsSync(tempPng)) {
    console.error('Temp PNG not found:', tempPng);
    process.exit(1);
  }

  const sphereR = Math.floor(Math.min(width, height) * 0.11);
  const sphereX = width - sphereR - 24;
  const sphereY = sphereR + 24;

  const pad = 14;
  const left = Math.max(0, sphereX - sphereR - pad);
  const top = Math.max(0, sphereY - sphereR - pad);
  const size = Math.min(width - left, height - top, sphereR * 2 + pad * 2);

  const squareOut = path.join(repoRoot, 'images', 'logo-from-share-card-square.png');
  const logoOut = path.join(repoRoot, 'images', 'logo-from-share-card.png');
  const logoHdOut = path.join(repoRoot, 'images', 'logo-from-share-card-hd.png');

  const squareBuf = await sharp(tempPng)
    .extract({ left, top, width: size, height: size })
    .resize(1400, 1400, { fit: 'fill', kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(squareBuf).toFile(squareOut);

  const circleMask = Buffer.from(`
    <svg width="700" height="700" xmlns="http://www.w3.org/2000/svg">
      <circle cx="350" cy="350" r="344" fill="white"/>
    </svg>
  `);

  const circleMaskHd = Buffer.from(`
    <svg width="1400" height="1400" xmlns="http://www.w3.org/2000/svg">
      <circle cx="700" cy="700" r="690" fill="white"/>
    </svg>
  `);

  const hdBuf = await sharp(squareBuf)
    .composite([{ input: circleMaskHd, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(hdBuf).toFile(logoHdOut);

  await sharp(hdBuf)
    .resize(700, 700, { fit: 'fill', kernel: 'lanczos3' })
    .sharpen({ sigma: 1.1, m1: 1.2, m2: 2.2, x1: 2, y2: 10, y3: 20 })
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toFile(logoOut);

  fs.unlinkSync(tempPng);

  console.log('Created:', squareOut);
  console.log('Created:', logoOut);
  console.log('Created:', logoHdOut);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
