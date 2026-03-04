const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT_CSV = path.join(ROOT, 'BREADCRUMB_QA_REPORT.csv');
const OUT_MD = path.join(ROOT, 'BREADCRUMB_QA_REPORT.md');

function walkHtmlFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(full, acc);
    if (entry.isFile() && entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

function normalizePath(p) {
  return p.split(path.sep).join('/');
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseBreadcrumbNavs(html) {
  const navMatches = [...html.matchAll(/<nav\s+class="breadcrumb"[^>]*>[\s\S]*?<\/nav>/gi)].map(m => m[0]);
  return navMatches.map(nav => {
    const liMatches = [...nav.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m => m[1]);
    const crumbs = liMatches
      .map(li => {
        const a = li.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (a) {
          return {
            name: decodeEntities(stripTags(a[2])),
            item: a[1].trim()
          };
        }
        return {
          name: decodeEntities(stripTags(li)),
          item: null
        };
      })
      .filter(c => c.name.length > 0);
    return crumbs;
  });
}

function parseBreadcrumbSchema(html) {
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1].trim());

  for (const raw of scripts) {
    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const breadcrumb = arr.find(item => item && item['@type'] === 'BreadcrumbList');
      if (!breadcrumb || !Array.isArray(breadcrumb.itemListElement)) continue;

      const crumbs = breadcrumb.itemListElement
        .map(item => ({
          name: (item && item.name ? String(item.name) : '').trim(),
          item: item && item.item ? String(item.item).trim() : null
        }))
        .filter(c => c.name.length > 0);

      return crumbs;
    } catch (error) {
      continue;
    }
  }

  return null;
}

function normalizeSchemaItem(item) {
  if (!item) return null;
  return item.replace(/^https?:\/\/[^/]+/i, '');
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

const files = walkHtmlFiles(ROOT);
const rows = [];

for (const file of files) {
  const rel = normalizePath(path.relative(ROOT, file));
  const html = fs.readFileSync(file, 'utf8');

  const navs = parseBreadcrumbNavs(html);
  const schema = parseBreadcrumbSchema(html);

  if (navs.length === 0 && schema === null) continue;

  if (navs.length === 0) {
    rows.push({ file: rel, issueType: 'missing-nav', detail: 'BreadcrumbList schema exists but breadcrumb nav is missing' });
    continue;
  }

  if (navs.length > 1) {
    rows.push({ file: rel, issueType: 'multiple-nav', detail: `Multiple breadcrumb nav blocks found (${navs.length})` });
  }

  const nav = navs[0];

  if (schema === null) {
    rows.push({ file: rel, issueType: 'missing-schema', detail: 'Breadcrumb nav exists but BreadcrumbList schema is missing or invalid JSON' });
    continue;
  }

  if (nav.length !== schema.length) {
    rows.push({
      file: rel,
      issueType: 'length-mismatch',
      detail: `Nav length ${nav.length} vs schema length ${schema.length}`
    });
    continue;
  }

  for (let i = 0; i < nav.length; i++) {
    const n = nav[i];
    const s = schema[i];

    if (n.name !== s.name) {
      rows.push({
        file: rel,
        issueType: 'name-mismatch',
        detail: `Position ${i + 1}: nav='${n.name}' schema='${s.name}'`
      });
      break;
    }

    if (n.item && s.item) {
      const normalizedSchema = normalizeSchemaItem(s.item);
      if (normalizedSchema !== n.item) {
        rows.push({
          file: rel,
          issueType: 'link-mismatch',
          detail: `Position ${i + 1}: nav='${n.item}' schema='${s.item}'`
        });
        break;
      }
    }
  }
}

const header = ['file', 'issueType', 'detail'];
const csvLines = [header.join(',')].concat(rows.map(r => [r.file, r.issueType, r.detail].map(escapeCsv).join(',')));
fs.writeFileSync(OUT_CSV, csvLines.join('\n') + '\n');

const byType = rows.reduce((acc, row) => {
  acc[row.issueType] = (acc[row.issueType] || 0) + 1;
  return acc;
}, {});

const md = [];
md.push('# Breadcrumb QA Report');
md.push('');
md.push(`- Total HTML files scanned: ${files.length}`);
md.push(`- Total issues found: ${rows.length}`);
md.push('');

if (rows.length === 0) {
  md.push('No breadcrumb issues found.');
} else {
  md.push('## Issues by Type');
  md.push('');
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    md.push(`- ${type}: ${count}`);
  }
  md.push('');
  md.push('## Issue List');
  md.push('');
  rows.forEach((row, idx) => {
    md.push(`${idx + 1}. ${row.file} — ${row.issueType} — ${row.detail}`);
  });
}

fs.writeFileSync(OUT_MD, md.join('\n') + '\n');

console.log(`Scanned files: ${files.length}`);
console.log(`Issues found: ${rows.length}`);
console.log(`CSV: ${normalizePath(path.relative(ROOT, OUT_CSV))}`);
console.log(`MD: ${normalizePath(path.relative(ROOT, OUT_MD))}`);
