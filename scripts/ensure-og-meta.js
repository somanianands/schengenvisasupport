#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

function usageAndExit() {
  console.error('Usage: node scripts/ensure-og-meta.js --file path/to/page.html --slug my-page-slug --title "Title" --desc "Description"');
  process.exit(2);
}

const file = argv.file || argv.f;
const slug = argv.slug || argv.s;
const title = argv.title || argv.t;
const desc = argv.desc || argv.d;
const prefix = argv.prefix !== undefined ? String(argv.prefix) : 'schengen_visa_';
const pageUrl = argv.url || argv.pageUrl || argv.pu;

if (!file || !slug) usageAndExit();

const repoRoot = process.cwd();
const targetPath = path.join(repoRoot, file);
if (!fs.existsSync(targetPath)) {
  console.error('File not found:', targetPath);
  process.exit(1);
}

let html = fs.readFileSync(targetPath, 'utf8');

// Remove previously injected block to avoid duplicates
html = html.replace(/\n?\s*<!-- Social share meta \(injected\) -->[\s\S]*?(?=\n\s*<(meta|link|script|\/head))/gi, '');

// Remove existing OG/Twitter image/title/description tags to keep one canonical set
html = html.replace(/\n?\s*<meta[^>]+(?:property|name)=["'](?:og:title|og:description|og:url|og:type|og:image|og:image:secure_url|og:image:type|og:image:width|og:image:height|og:image:alt|twitter:card|twitter:title|twitter:description|twitter:image|twitter:image:alt)["'][^>]*>/gi, '');

// Build meta block
const imageUrl = `https://schengenvisasupport.com/images/${prefix}${slug}.png`;
const finalUrl = pageUrl || `https://schengenvisasupport.com/${slug}/`;
const imageAlt = `${title || extractTitle(html) || 'Schengen Visa Support'} - social preview image`;
const meta = [];
meta.push(`<meta property="og:title" content="${escapeXml(title || extractTitle(html) || 'Schengen Visa Support')}">`);
meta.push(`<meta property="og:description" content="${escapeXml(desc || extractDescription(html) || '')}">`);
meta.push(`<meta property="og:url" content="${escapeXml(finalUrl)}">`);
meta.push(`<meta property="og:type" content="article">`);
meta.push(`<meta property="og:image" content="${imageUrl}">`);
meta.push(`<meta property="og:image:secure_url" content="${imageUrl}">`);
meta.push(`<meta property="og:image:type" content="image/png">`);
meta.push(`<meta property="og:image:width" content="1200">`);
meta.push(`<meta property="og:image:height" content="630">`);
meta.push(`<meta property="og:image:alt" content="${escapeXml(imageAlt)}">`);
meta.push(`<meta name="twitter:card" content="summary_large_image">`);
meta.push(`<meta name="twitter:title" content="${escapeXml(title || extractTitle(html) || '')}">`);
meta.push(`<meta name="twitter:description" content="${escapeXml(desc || extractDescription(html) || '')}">`);
meta.push(`<meta name="twitter:image" content="${imageUrl}">`);
meta.push(`<meta name="twitter:image:alt" content="${escapeXml(imageAlt)}">`);

const metaBlock = '\n    <!-- Social share meta (injected) -->\n    ' + meta.join('\n    ') + '\n';

// Insert after <title> or after existing meta description
let replaced = false;
if (/<title[^>]*>.*<\/title>/i.test(html)) {
  html = html.replace(/(<title[^>]*>.*?<\/title>)/i, `$1${metaBlock}`);
  replaced = true;
}

if (!replaced && /<head[^>]*>/i.test(html)) {
  html = html.replace(/(<head[^>]*>)/i, `$1${metaBlock}`);
  replaced = true;
}

if (!replaced) {
  console.error('Could not find <head> in file to inject meta tags.');
  process.exit(1);
}

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Injected meta tags into', targetPath);

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractDescription(html) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  return m ? m[1].trim() : '';
}

function escapeXml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
