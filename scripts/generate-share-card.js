#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const argv = require('minimist')(process.argv.slice(2));
let QRCode = null;
try {
  QRCode = require('qrcode');
} catch {}

async function main() {
  const slug = argv.slug || argv.s;
  if (!slug) {
    console.error('Usage: node scripts/generate-share-card.js --slug my-page-slug --title "Page Title" --desc "Short description" --url "schengenvisasupport.com" [--prefix "schengen_visa_"] [--saveSvg true|false] [--height 630] [--logo true] [--qr true|false] [--qrSize 140] [--titleSize auto] [--titleWeight 800] [--titleSpacing 0.8] [--descSize 22] [--descSpacing 0.12] [--urlLabel "Visit For More Details - site.com"] [--urlSize 24] [--engine sharp|browser] [--density 192] [--pngQuality 92] [--webpQuality 90]');
    console.error('You can embed a newline in the title with "\\n" and specify custom width/height.');
    process.exit(2);
  }

  const title = argv.title || argv.t || 'Schengen Visa Support';
  const desc = argv.desc || argv.d || 'Practical checklist, appointment tips and sample documents.';
  const url = argv.url || argv.u || 'schengenvisasupport.com';
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const homepageUrl = 'https://schengenvisasupport.com/';
  const displayDomain = 'https://SchengenVisaSupport.com';
  const rawQrUrl = argv.qrUrl || homepageUrl;
  const qrUrl = normalizeUrl(rawQrUrl, homepageUrl);
  const urlLabel = argv.urlLabel || argv.ul || `${displayDomain}`;
  const trustLine = argv.trustLine || 'Visit for latest information...';
  const qrCaption = argv.qrCaption || 'Scan to open guide';
  const formats = (argv.formats || 'png').split(',').map(f => f.trim());

  const repoRoot = process.cwd();
  const templatePath = path.join(repoRoot, 'images', 'share-card-template.svg');
    const prefix = argv.prefix !== undefined ? String(argv.prefix) : 'schengen_visa_';
    const baseName = `${prefix}${slug}`;
    const outSvg = path.join(repoRoot, 'images', `${baseName}.svg`);
    const outPng = path.join(repoRoot, 'images', `${baseName}.png`);
    const outWebp = path.join(repoRoot, 'images', `${baseName}.webp`);
    const saveSvg = String(argv.saveSvg || 'false').toLowerCase() === 'true';
    const tempSvg = path.join(repoRoot, 'images', `.${baseName}.tmp.svg`);
  
  const width = parseInt(argv.width || argv.w || '1200', 10);
  const height = parseInt(argv.height || argv.h || '630', 10); // OG standard height
  const includeLogo = argv.logo === 'true' || argv.l === 'true';
  const density = parseInt(argv.density || '192', 10);
  const pngQuality = parseInt(argv.pngQuality || '92', 10);
  const webpQuality = parseInt(argv.webpQuality || '90', 10);
  const engine = String(argv.engine || 'sharp').toLowerCase();
  const titleSize = argv.titleSize !== undefined ? parseInt(argv.titleSize, 10) : 56;
  const titleWeight = parseInt(argv.titleWeight || '800', 10);
  const descSize = argv.descSize !== undefined ? parseInt(argv.descSize, 10) : 22;
  const titleSpacing = parseFloat(argv.titleSpacing || '0.8');
  const descSpacing = parseFloat(argv.descSpacing || '0.12');
  const urlSize = parseInt(argv.urlSize || '24', 10);
  const includeQr = argv.qr !== undefined ? String(argv.qr).toLowerCase() === 'true' : true;
  const qrSizeArg = argv.qrSize !== undefined ? parseInt(argv.qrSize, 10) : 140;
  const reservedRight = Math.max(280, Math.round(width * 0.27));
  const contentWidth = width - 64 - reservedRight;
  const contentHeight = height - 120;

  if (!fs.existsSync(templatePath)) {
    console.error('Template SVG not found:', templatePath);
    process.exit(1);
  }

  let svg = fs.readFileSync(templatePath, 'utf8');
  svg = svg.replace(/%%WIDTH%%/g, width);
  svg = svg.replace(/%%HEIGHT%%/g, height);

  // compute sphere geometry (single logo in top-right corner)
  const sphereR = Math.floor(Math.min(width, height) * 0.11);
  const sphereX = width - sphereR - 24;
  const sphereY = sphereR + 24;
  const sphereYplus = sphereY + 20;
  const sphereShineY = sphereY - Math.floor(sphereR * 0.25);
  const sphereShineRx = Math.floor(sphereR * 0.84);
  const sphereShineRy = Math.floor(sphereR * 0.58);
  svg = svg.replace(/%%SPHERER%%/g, sphereR);
  svg = svg.replace(/%%SPHEREX%%/g, sphereX);
  svg = svg.replace(/%%SPHEREY%%/g, sphereY);
  svg = svg.replace(/%%SPHEREYPLUS%%/g, sphereYplus);
  svg = svg.replace(/%%SPHERESHINEY%%/g, sphereShineY);
  svg = svg.replace(/%%SPHERESHINERX%%/g, sphereShineRx);
  svg = svg.replace(/%%SPHERESHINERY%%/g, sphereShineRy);
  svg = svg.replace(/%%CONTENT_WIDTH%%/g, contentWidth);
  svg = svg.replace(/%%CONTENT_HEIGHT%%/g, contentHeight);

  // support multiple title lines: convert literal backslash-n to actual newline and hard-wrap
  const titleText = title.replace(/\\n/g, '\n');
  const titleRawLines = titleText.split(/\r?\n/);
  const titleMaxLines = parseInt(argv.titleMaxLines || '4', 10);
  let fittedTitleSize = titleSize;
  let titleLines = [];
  while (fittedTitleSize >= 30) {
    const titleCharLimit = Math.max(14, Math.floor(contentWidth / (fittedTitleSize * 0.62)));
    const candidate = wrapAllLines(titleRawLines, titleCharLimit);
    if (candidate.length <= titleMaxLines) {
      titleLines = candidate;
      break;
    }
    fittedTitleSize -= 2;
  }
  if (!titleLines.length) {
    const titleCharLimit = Math.max(12, Math.floor(contentWidth / (fittedTitleSize * 0.62)));
    const candidate = wrapAllLines(titleRawLines, titleCharLimit);
    titleLines = candidate.length <= titleMaxLines
      ? candidate
      : candidate.slice(0, titleMaxLines - 1).concat([candidate.slice(titleMaxLines - 1).join(' ')]);
  }

  const lineHeight = Math.max(48, Math.round(fittedTitleSize * 1.08));
  // build <tspan> markup with dy adjustments
  let titleMarkup = '';
  titleLines.forEach((ln, idx) => {
    const yOffset = idx === 0 ? '0' : `${lineHeight}`;
    titleMarkup += `<tspan x="64" dy="${yOffset}">${escapeXml(ln)}</tspan>`;
  });

  const descCharLimit = Math.max(28, Math.floor(contentWidth / (descSize * 0.55)));
  const descLines = wrapLines([desc], descCharLimit, 3, true);
  const descLineHeight = Math.max(28, Math.round(descSize * 1.35));
  let descMarkup = '';
  descLines.forEach((ln, idx) => {
    const yOffset = idx === 0 ? '0' : `${descLineHeight}`;
    descMarkup += `<tspan x="64" dy="${yOffset}">${escapeXml(ln)}</tspan>`;
  });

  svg = svg.replace(/%%TITLE_LINES%%/g, titleMarkup);
  svg = svg.replace(/%%TITLE_SIZE%%/g, fittedTitleSize);
  svg = svg.replace(/%%TITLE_WEIGHT%%/g, titleWeight);
  svg = svg.replace(/%%TITLE_SPACING%%/g, titleSpacing);
  svg = svg.replace(/%%DESC_SIZE%%/g, descSize);
  svg = svg.replace(/%%DESC_SPACING%%/g, descSpacing);
  svg = svg.replace(/%%URL_SIZE%%/g, urlSize);
  svg = svg.replace(/%%URL_X%%/g, 64);
  svg = svg.replace(/%%DESC_LINES%%/g, descMarkup);
  svg = svg.replace(/%%URL_LABEL%%/g, escapeXml(urlLabel));
  svg = svg.replace(/%%TRUST_LINE%%/g, escapeXml(trustLine));

  // compute vertical positions based on content
  const titleY = 120;
  const underlineY = titleY + lineHeight * titleLines.length + 12;
  const descY = underlineY + 24;
  const trustY = height - 70;
  const urlY = height - 40;

  svg = svg.replace(/%%TITLE_Y%%/g, titleY);
  svg = svg.replace(/%%UNDERLINE_Y%%/g, underlineY);
  svg = svg.replace(/%%DESC_Y%%/g, descY);
  svg = svg.replace(/%%TRUST_Y%%/g, trustY);
  svg = svg.replace(/%%URL_Y%%/g, urlY);

  let qrBlock = '';
  if (includeQr && QRCode) {
    const qrSize = Math.max(96, qrSizeArg);
    const qrPad = 12;
    const boxSize = qrSize + qrPad * 2;
    const boxX = width - boxSize - 24;
    const boxY = height - boxSize - 24;
    const qrX = boxX + qrPad;
    const qrY = boxY + qrPad;
    const qrData = await QRCode.toDataURL(qrUrl, {
      margin: 0,
      width: qrSize,
      color: { dark: '#111111', light: '#ffffff' }
    });
    const captionY = boxY - 8;
    qrBlock = `<text x="${boxX + boxSize / 2}" y="${captionY}" text-anchor="middle" font-size="14" fill="#ffffff" opacity="0.92">${escapeXml(qrCaption)}</text><rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="10" fill="#ffffff" opacity="0.98" /><image href="${qrData}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" />`;
  }
  svg = svg.replace(/%%QR_BLOCK%%/g, qrBlock);

  // ensure Poppins font faces are embedded
  svg = await injectFontFaces(svg);

  // keep one logo only (sphere text logo in corner); no extra image logo
  if (includeLogo) {
    // reserved for future logo styles
  }

  fs.writeFileSync(saveSvg ? outSvg : tempSvg, svg, 'utf8');
  if (saveSvg) {
    console.log('Wrote', outSvg);
  }
  if (includeQr) {
    console.log('QR target:', qrUrl);
  }

  // Convert to PNG and/or WebP
  try {
    const svgInputPath = saveSvg ? outSvg : tempSvg;
    if (engine === 'browser') {
      await renderWithBrowser({ svgPath: svgInputPath, width, height, formats, outPng, outWebp, webpQuality });
    } else {
      const baseImage = sharp(svgInputPath, { density });
      if (formats.includes('png')) {
        await baseImage.clone().png({ compressionLevel: 9, quality: pngQuality }).toFile(outPng);
      }
      if (formats.includes('webp')) {
        await baseImage.clone().webp({ quality: webpQuality, smartSubsample: true }).toFile(outWebp);
      }
    }

    if (formats.includes('png') && fs.existsSync(outPng)) {
      const pngSize = fs.statSync(outPng).size / 1024;
      console.log(`Generated ${outPng} (${pngSize.toFixed(1)}KB)`);
    }
    if (formats.includes('webp') && fs.existsSync(outWebp)) {
      const webpSize = fs.statSync(outWebp).size / 1024;
      console.log(`Generated ${outWebp} (${webpSize.toFixed(1)}KB)`);
    }
  } catch (err) {
    console.error('Error generating image:', err);
    if (engine === 'browser') {
      console.error('Tip: install browser runtime with `npx playwright install chromium`');
    }
    process.exit(1);
  } finally {
    if (!saveSvg && fs.existsSync(tempSvg)) {
      fs.unlinkSync(tempSvg);
    }
  }
}

async function renderWithBrowser({ svgPath, width, height, formats, outPng, outWebp, webpQuality }) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    throw new Error('playwright package is required for --engine browser');
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width, height, deviceScaleFactor: 2 }
    });

    const svg = fs.readFileSync(svgPath, 'utf8');
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent"><img id="card" src="${dataUrl}" width="${width}" height="${height}" style="display:block"/></body></html>`, { waitUntil: 'load' });

    const card = page.locator('#card');
    const screenshot = await card.screenshot({ type: 'png' });
    const raster = sharp(screenshot).resize(width, height, { kernel: 'lanczos3' });

    if (formats.includes('png')) {
      await raster.clone().png({ compressionLevel: 9 }).toFile(outPng);
    }
    if (formats.includes('webp')) {
      await raster.clone().webp({ quality: webpQuality, smartSubsample: true }).toFile(outWebp);
    }
  } finally {
    await browser.close();
  }
}

async function injectFontFaces(svg) {
  const repoRoot = process.cwd();
  const fontDir = path.join(repoRoot, 'images', 'fonts');
  if (!fs.existsSync(fontDir)) fs.mkdirSync(fontDir, { recursive: true });

  const downloads = [
    {name:'Poppins-Regular.ttf', weight:400},
    {name:'Poppins-Medium.ttf', weight:500},
    {name:'Poppins-SemiBold.ttf', weight:600},
    {name:'Poppins-Bold.ttf', weight:700},
    {name:'Poppins-ExtraBold.ttf', weight:800}
  ];
  for (const f of downloads) {
    const fontPath = path.join(fontDir, f.name);
    if (!fs.existsSync(fontPath)) {
      console.log('Downloading', f.name);
      const url = `https://github.com/google/fonts/raw/main/ofl/poppins/${f.name}`;
      const data = await fetch(url).then(r=>r.arrayBuffer());
      fs.writeFileSync(fontPath, Buffer.from(data));
    }
  }

  let css = '';
  for (const f of downloads) {
    const fontPath = path.join(fontDir, f.name);
    const buf = fs.readFileSync(fontPath);
    const b64 = buf.toString('base64');
    css += `@font-face{font-family:'Poppins';font-weight:${f.weight};src:url(data:font/ttf;base64,${b64}) format('truetype');}\n`;
  }

  // preserve existing style content (e.g. font-family rule)
  return svg.replace(/<style>([\s\S]*?)<\/style>/, (m, inner) => {
    return `<style>${css}${inner}</style>`;
  });
}

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrapLines(lines, maxChars, maxLines, ellipsizeLast = false) {
  const wrapped = [];

  for (const line of lines) {
    const words = line.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;

    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const next = `${current} ${words[i]}`;
      if (next.length <= maxChars) {
        current = next;
      } else {
        wrapped.push(current);
        current = words[i];
      }
      if (wrapped.length >= maxLines) break;
    }

    if (wrapped.length < maxLines) {
      wrapped.push(current);
    }
    if (wrapped.length >= maxLines) break;
  }

  let out = wrapped.slice(0, maxLines);
  if (ellipsizeLast && wrapped.length > maxLines) {
    out[maxLines - 1] = truncateWithEllipsis(out[maxLines - 1], maxChars);
  }
  if (ellipsizeLast && out.length === maxLines) {
    out[maxLines - 1] = truncateWithEllipsis(out[maxLines - 1], maxChars);
  }
  return out;
}

function wrapAllLines(lines, maxChars) {
  const wrapped = [];
  for (const line of lines) {
    const words = line.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const next = `${current} ${words[i]}`;
      if (next.length <= maxChars) {
        current = next;
      } else {
        wrapped.push(current);
        current = words[i];
      }
    }
    wrapped.push(current);
  }
  return wrapped;
}

function truncateWithEllipsis(text, maxChars) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1)).trim()}…`;
}

function normalizeUrl(url, fallback) {
  const value = String(url || '').trim();
  if (!value) return fallback;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withScheme);
    return parsed.toString();
  } catch {
    return fallback;
  }
}

main();
