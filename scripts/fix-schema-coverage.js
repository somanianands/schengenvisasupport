const fs = require('fs');
const path = require('path');

const root = process.cwd();

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, '/');
    if (rel.startsWith('node_modules/')) continue;
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile() && entry.name === 'index.html') {
      files.push(rel);
    }
  }
  return files;
}

function stripTags(s) {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function titleFromSlug(slug) {
  return slug
    .split('-')
    .map((w) => {
      const up = w.toUpperCase();
      if (['vfs', 'bls', 'uk', 'usa', 'faq', 'eu'].includes(w)) return up;
      if (w === 'schengen') return 'Schengen';
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function buildBreadcrumbFromNav(html, relPath) {
  const navMatch = html.match(/<nav[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  const items = [];

  if (navMatch) {
    const nav = navMatch[1];
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    while ((m = liRegex.exec(nav)) !== null) {
      const li = m[1];
      const aMatch = li.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      if (aMatch) {
        items.push({ name: stripTags(aMatch[2]), item: `https://schengenvisasupport.com${aMatch[1]}` });
      } else {
        items.push({ name: stripTags(li) });
      }
    }
  }

  if (items.length >= 2) {
    return items;
  }

  const pagePath = '/' + relPath.replace(/index\.html$/, '');
  const parts = pagePath.split('/').filter(Boolean);
  const built = [{ name: 'Home', item: 'https://schengenvisasupport.com/' }];
  let acc = '';
  for (let i = 0; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    const isLast = i === parts.length - 1;
    const name = titleFromSlug(parts[i]);
    if (isLast) built.push({ name });
    else built.push({ name, item: `https://schengenvisasupport.com${acc}/` });
  }
  return built;
}

function makeBreadcrumbScript(items) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => {
      const obj = { '@type': 'ListItem', position: idx + 1, name: it.name };
      if (it.item) obj.item = it.item;
      return obj;
    }),
  };
  return `  <script type="application/ld+json">${JSON.stringify(payload)}</script>\n`;
}

function extractFaqPairs(html) {
  const faqHeading = html.match(/<h2[^>]*>\s*(FAQs?|Frequently Asked Questions)\s*<\/h2>/i);
  if (!faqHeading) return [];

  const start = faqHeading.index;
  const tail = html.slice(start);
  const endSection = tail.search(/<\/section>/i);
  const endArticle = tail.search(/<\/article>/i);
  let end = tail.length;
  if (endSection !== -1) end = Math.min(end, endSection + 10);
  if (endArticle !== -1) end = Math.min(end, endArticle);
  const block = tail.slice(0, end);

  const pairs = [];
  const qaRegex = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = qaRegex.exec(block)) !== null) {
    const q = stripTags(m[1]);
    const a = stripTags(m[2]);
    if (q && a) pairs.push({ q, a });
  }
  return pairs.slice(0, 8);
}

function makeFaqScript(pairs) {
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map((p) => ({
      '@type': 'Question',
      name: p.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: p.a,
      },
    })),
  };
  return `  <script type="application/ld+json">${JSON.stringify(payload)}</script>\n`;
}

let breadcrumbAdded = 0;
let faqAdded = 0;
let filesTouched = 0;

const files = walk(root);
for (const rel of files) {
  const full = path.join(root, rel);
  let html = fs.readFileSync(full, 'utf8');
  let changed = false;

  const hasHeadClose = /<\/head>/i.test(html);
  if (!hasHeadClose) continue;

  const hasBreadcrumb = /"@type"\s*:\s*"BreadcrumbList"/.test(html);
  if (!hasBreadcrumb) {
    const items = buildBreadcrumbFromNav(html, rel);
    html = html.replace(/<\/head>/i, `${makeBreadcrumbScript(items)}</head>`);
    breadcrumbAdded++;
    changed = true;
  }

  const hasFaq = /"@type"\s*:\s*"FAQPage"/.test(html);
  if (!hasFaq) {
    const pairs = extractFaqPairs(html);
    if (pairs.length >= 2) {
      html = html.replace(/<\/head>/i, `${makeFaqScript(pairs)}</head>`);
      faqAdded++;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(full, html);
    filesTouched++;
  }
}

console.log(`Files scanned: ${files.length}`);
console.log(`Files touched: ${filesTouched}`);
console.log(`Breadcrumb schema added: ${breadcrumbAdded}`);
console.log(`FAQ schema added: ${faqAdded}`);
