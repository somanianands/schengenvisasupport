#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = process.cwd();
const argv = require('minimist')(process.argv.slice(2));

const only = argv.only ? String(argv.only) : '';
const limit = argv.limit ? parseInt(argv.limit, 10) : 0;
const force = String(argv.force || 'true').toLowerCase() === 'true';
const updateMeta = String(argv.updateMeta || 'true').toLowerCase() === 'true';

const legalPrefixes = [
  'privacy-policy',
  'terms-of-service',
  'cookie-policy',
  'disclaimer',
  'dmca'
];

function listIndexFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (entry.name === 'node_modules') continue;
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.isFile() && entry.name === 'index.html') {
        out.push(abs);
      }
    }
  }
  return out.sort();
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!m) return '';
  let title = m[1].trim();
  title = title
    .replace(/\s*[|\-–—]\s*Schengen\s*Visa\s*Support\s*$/i, '')
    .replace(/\s*[|\-–—]\s*SVS\s*$/i, '')
    .trim();
  return title;
}

function extractDescription(html) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  return m ? m[1].trim() : '';
}

function humanizeSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toTwoLineTitle(title) {
  const cleaned = title.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ');
  if (words.length <= 3) return cleaned;
  const half = Math.ceil(words.length / 2);
  const line1 = words.slice(0, half).join(' ');
  const line2 = words.slice(half).join(' ');
  return `${line1}\n${line2}`;
}

function makeUniqueSlugs(indexFiles) {
  const countByBase = new Map();
  const results = [];

  for (const file of indexFiles) {
    const rel = path.relative(repoRoot, path.dirname(file)).replace(/\\/g, '/');
    const base = rel === '.' ? 'home' : path.basename(rel);
    const seen = countByBase.get(base) || 0;
    countByBase.set(base, seen + 1);
    const slug = seen === 0 ? base : `${base}-${seen + 1}`;
    results.push({ file, relDir: rel, slug });
  }
  return results;
}

const allIndexFiles = listIndexFiles(repoRoot);
let pages = makeUniqueSlugs(allIndexFiles);

if (only) {
  pages = pages.filter((p) => p.relDir.includes(only) || p.slug.includes(only));
}
pages = pages.filter((p) => !legalPrefixes.some((prefix) => p.relDir === prefix || p.relDir.startsWith(`${prefix}/`)));
if (limit > 0) {
  pages = pages.slice(0, limit);
}

let generated = 0;
let skipped = 0;
let failed = 0;

console.log(`Found ${allIndexFiles.length} index pages. Processing ${pages.length} pages...`);

for (let i = 0; i < pages.length; i++) {
  const page = pages[i];
  const html = fs.readFileSync(page.file, 'utf8');
  const titleRaw = extractTitle(html) || humanizeSlug(page.slug);
  const title = toTwoLineTitle(titleRaw);
  const desc = extractDescription(html) || 'Schengen visa requirements, documents, and appointment guidance.';

  const outPng = path.join(repoRoot, 'images', `schengen_visa_${page.slug}.png`);
  if (!force && fs.existsSync(outPng)) {
    skipped++;
    continue;
  }

  const pageUrl = page.relDir === '.'
    ? 'https://schengenvisasupport.com/'
    : `https://schengenvisasupport.com/${page.relDir}/`;

  const cmdArgs = [
    'scripts/generate-share-card.js',
    '--slug', page.slug,
    '--prefix', 'schengen_visa_',
    '--title', title,
    '--desc', desc,
    '--url', 'schengenvisasupport.com',
    '--qrUrl', pageUrl,
    '--logo', 'true',
    '--formats', 'png',
    '--height', '630',
    '--saveSvg', 'true',
    '--engine', 'browser'
  ];

  const result = spawnSync('node', cmdArgs, {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  if (result.status === 0) {
    if (updateMeta) {
      const metaArgs = [
        'scripts/ensure-og-meta.js',
        '--file', `${page.relDir === '.' ? '' : `${page.relDir}/`}index.html`,
        '--slug', page.slug,
        '--title', titleRaw,
        '--desc', desc,
        '--prefix', 'schengen_visa_',
        '--url', pageUrl
      ];
      const metaResult = spawnSync('node', metaArgs, {
        cwd: repoRoot,
        encoding: 'utf8'
      });
      if (metaResult.status !== 0) {
        failed++;
        console.error(`Meta update failed: ${page.relDir} -> ${page.slug}`);
        if (metaResult.stderr) console.error(metaResult.stderr.trim());
        continue;
      }
    }
    generated++;
  } else {
    failed++;
    console.error(`Failed: ${page.relDir} -> ${page.slug}`);
    if (result.stderr) console.error(result.stderr.trim());
  }

  if ((i + 1) % 20 === 0 || i + 1 === pages.length) {
    console.log(`Progress ${i + 1}/${pages.length} | generated=${generated} skipped=${skipped} failed=${failed}`);
  }
}

console.log(`Done. generated=${generated} skipped=${skipped} failed=${failed}`);
