const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['node_modules', '.git']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.DS_Store')) continue;
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function extractHrefs(html) {
  const hrefs = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) hrefs.push(match[1]);
  return hrefs;
}

function cleanHref(href) {
  return href.split('#')[0].split('?')[0].trim();
}

function isSkippable(href) {
  return (
    !href ||
    href === '#' ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('javascript:') ||
    href.startsWith('data:')
  );
}

function candidateInternalPaths(filePath, href) {
  const raw = cleanHref(href);
  if (!raw) return [];

  const mkCandidates = (p) => {
    const c = [p];
    if (p.endsWith('/')) c.push(path.join(p, 'index.html'));
    else if (!path.extname(p)) {
      c.push(path.join(p, 'index.html'));
      c.push(`${p}.html`);
    }
    return [...new Set(c)];
  };

  if (raw.startsWith('/')) {
    const rel = raw.replace(/^\/+/, '');
    return mkCandidates(path.join(ROOT, rel));
  }

  return mkCandidates(path.resolve(path.dirname(filePath), raw));
}

function classifyHref(filePath, href) {
  const raw = cleanHref(href);
  if (isSkippable(raw)) return { type: 'skip', raw };

  if (/^https?:\/\//i.test(raw)) return { type: 'external', raw };

  return { type: 'internal', raw, candidates: candidateInternalPaths(filePath, raw) };
}

async function fetchStatus(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    }
    return { status: res.status, ok: res.status < 400 };
  } catch (err) {
    return { status: null, ok: false, error: err.name || String(err) };
  } finally {
    clearTimeout(timeout);
  }
}

async function runWithConcurrency(items, limit, fn) {
  const out = new Array(items.length);
  let index = 0;

  async function worker() {
    while (true) {
      const current = index++;
      if (current >= items.length) break;
      out[current] = await fn(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return out;
}

(async function main() {
  const htmlFiles = walk(ROOT);
  const links = [];
  const externalSet = new Set();

  for (const file of htmlFiles) {
    const relFile = path.relative(ROOT, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const hrefs = extractHrefs(content);

    for (const href of hrefs) {
      const info = classifyHref(file, href);
      links.push({ file: relFile, href, ...info });
      if (info.type === 'external') externalSet.add(info.raw);
    }
  }

  const internal = links.filter(l => l.type === 'internal');
  const internalResults = internal.map(l => {
    const exists = l.candidates.some(p => fs.existsSync(p));
    const matched = l.candidates.find(p => fs.existsSync(p));
    return {
      ...l,
      exists,
      matched: matched ? path.relative(ROOT, matched).replace(/\\/g, '/') : ''
    };
  });

  const externals = Array.from(externalSet).sort();
  const externalStatuses = await runWithConcurrency(externals, 12, async (url) => {
    const r = await fetchStatus(url);
    return { url, ...r };
  });
  const statusMap = new Map(externalStatuses.map(r => [r.url, r]));

  const linksWithStatus = links.map(l => {
    if (l.type === 'external') return { ...l, ...(statusMap.get(l.raw) || {}) };
    return l;
  });

  const brokenInternal = internalResults.filter(l => !l.exists);
  const broken404External = externalStatuses.filter(r => r.status === 404);
  const brokenExternalOther = externalStatuses.filter(r => r.status === null || (r.status >= 400 && r.status !== 404));

  const lines = [];
  lines.push('# Link Audit Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- HTML files scanned: ${htmlFiles.length}`);
  lines.push(`- Total anchor links found: ${links.length}`);
  lines.push(`- Internal links checked: ${internal.length}`);
  lines.push(`- External unique URLs checked: ${externals.length}`);
  lines.push(`- Broken internal links: ${brokenInternal.length}`);
  lines.push(`- External 404 URLs: ${broken404External.length}`);
  lines.push(`- External other errors/timeouts: ${brokenExternalOther.length}`);
  lines.push('');

  lines.push('## Broken Internal Links');
  if (!brokenInternal.length) lines.push('- None');
  else {
    for (const b of brokenInternal) {
      lines.push(`- ${b.file} -> ${b.href}`);
    }
  }
  lines.push('');

  lines.push('## External 404 URLs');
  if (!broken404External.length) lines.push('- None');
  else {
    for (const b of broken404External) lines.push(`- ${b.url}`);
  }
  lines.push('');

  lines.push('## External Other Errors');
  if (!brokenExternalOther.length) lines.push('- None');
  else {
    for (const b of brokenExternalOther) {
      lines.push(`- ${b.url} -> ${b.status ?? b.error}`);
    }
  }
  lines.push('');

  const reportPath = path.join(ROOT, 'LINK_AUDIT_REPORT.md');
  fs.writeFileSync(reportPath, lines.join('\n'));

  const csvHeader = ['file','href','type','normalized','internal_exists','internal_matched','external_status','external_ok','external_error'];
  const csvRows = [csvHeader.join(',')];

  for (const l of linksWithStatus) {
    const internalRow = internalResults.find(i => i.file === l.file && i.href === l.href && i.raw === l.raw);
    const row = [
      l.file,
      l.href,
      l.type,
      l.raw || '',
      internalRow ? String(internalRow.exists) : '',
      internalRow ? internalRow.matched : '',
      l.status ?? '',
      typeof l.ok === 'boolean' ? String(l.ok) : '',
      l.error || ''
    ].map(v => `"${String(v).replace(/"/g,'""')}"`);

    csvRows.push(row.join(','));
  }

  fs.writeFileSync(path.join(ROOT, 'LINK_AUDIT_FULL.csv'), csvRows.join('\n'));

  console.log(JSON.stringify({
    htmlFiles: htmlFiles.length,
    totalLinks: links.length,
    internalChecked: internal.length,
    externalChecked: externals.length,
    brokenInternal: brokenInternal.length,
    external404: broken404External.length,
    externalOtherErrors: brokenExternalOther.length,
    report: 'LINK_AUDIT_REPORT.md',
    csv: 'LINK_AUDIT_FULL.csv'
  }, null, 2));
})();
