const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE_URL = 'https://schengenvisasupport.com';

function walkHtmlFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtmlFiles(full, acc);
    if (entry.isFile() && entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
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

function encodeJson(value) {
  return JSON.stringify(value, null, 2);
}

function parseCrumbsFromLi(navHtml) {
  const liMatches = [...navHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m => m[1]);
  if (!liMatches.length) return [];
  return liMatches
    .map(li => {
      const a = li.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (a) {
        return { name: decodeEntities(stripTags(a[2])), item: a[1].trim() };
      }
      return { name: decodeEntities(stripTags(li)), item: null };
    })
    .filter(c => c.name.length > 0);
}

function parseCrumbsFromInline(navHtml) {
  const innerMatch = navHtml.match(/<nav\s+class="breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i);
  if (!innerMatch) return [];
  const inner = innerMatch[1].trim();
  if (!inner) return [];

  const parts = inner.split(/\s*(?:›|&rsaquo;|&gt;)\s*/i).map(s => s.trim()).filter(Boolean);
  if (!parts.length) return [];

  const crumbs = [];
  for (const part of parts) {
    const a = part.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (a) {
      crumbs.push({ name: decodeEntities(stripTags(a[2])), item: a[1].trim() });
    } else {
      const name = decodeEntities(stripTags(part));
      if (name) crumbs.push({ name, item: null });
    }
  }
  return crumbs;
}

function parseCrumbsFromNav(navHtml) {
  const fromLi = parseCrumbsFromLi(navHtml);
  if (fromLi.length) return fromLi;
  return parseCrumbsFromInline(navHtml);
}

function parseBreadcrumbSchema(html) {
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];

  for (const script of scripts) {
    const raw = script[1].trim();
    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const index = arr.findIndex(item => item && item['@type'] === 'BreadcrumbList');
      if (index >= 0) {
        const breadcrumb = arr[index];
        const crumbs = Array.isArray(breadcrumb.itemListElement)
          ? breadcrumb.itemListElement
              .map(item => ({
                name: item && item.name ? String(item.name).trim() : '',
                item: item && item.item ? String(item.item).trim() : null
              }))
              .filter(c => c.name.length > 0)
          : [];

        return {
          fullMatch: script[0],
          content: raw,
          crumbs,
          arrayRoot: Array.isArray(parsed),
          parsed,
          arrayIndex: index
        };
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

function buildNavHtml(crumbs, originalNavTag = '<nav class="breadcrumb">') {
  const openTagMatch = originalNavTag.match(/<nav\s+class="breadcrumb"[^>]*>/i);
  const openTag = openTagMatch ? openTagMatch[0] : '<nav class="breadcrumb">';

  const liHtml = crumbs
    .map(c => {
      if (c.item) return `                            <li><a href="${c.item}">${c.name}</a></li>`;
      return `                            <li>${c.name}</li>`;
    })
    .join('\n');

  return `${openTag}\n                    <div class="container">\n                        <ol>\n${liHtml}\n                        </ol>\n                    </div>\n                </nav>`;
}

function absoluteUrl(item) {
  if (!item) return null;
  if (/^https?:\/\//i.test(item)) return item;
  return `${BASE_URL}${item}`;
}

function buildSchemaObject(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => {
      const out = {
        '@type': 'ListItem',
        position: i + 1,
        name: c.name
      };
      const item = absoluteUrl(c.item);
      if (item) out.item = item;
      return out;
    })
  };
}

function buildSchemaScriptFromObject(obj) {
  return `    <script type="application/ld+json">\n${encodeJson(obj).split('\n').map(line => '    ' + line).join('\n')}\n    </script>`;
}

function normalizeSchemaCrumbs(crumbs) {
  return crumbs.map(c => ({
    name: c.name,
    item: c.item ? c.item.replace(/^https?:\/\/[^/]+/i, '') : null
  }));
}

function crumbsEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].name !== b[i].name) return false;
    if ((a[i].item || null) !== (b[i].item || null)) return false;
  }
  return true;
}

const files = walkHtmlFiles(ROOT);
let changed = 0;

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  let touched = false;

  let navMatches = [...html.matchAll(/<nav\s+class="breadcrumb"[^>]*>[\s\S]*?<\/nav>/gi)].map(m => m[0]);

  if (navMatches.length > 1) {
    const first = navMatches[0];
    html = html.replace(/<nav\s+class="breadcrumb"[^>]*>[\s\S]*?<\/nav>/gi, (m, offset) => {
      const firstIndex = html.indexOf(first);
      if (offset === firstIndex) return m;
      touched = true;
      return '';
    });
    navMatches = [...html.matchAll(/<nav\s+class="breadcrumb"[^>]*>[\s\S]*?<\/nav>/gi)].map(m => m[0]);
  }

  const schemaInfo = parseBreadcrumbSchema(html);

  let crumbs = [];
  if (navMatches.length) {
    crumbs = parseCrumbsFromNav(navMatches[0]);
  }
  if (!crumbs.length && schemaInfo && schemaInfo.crumbs.length) {
    crumbs = normalizeSchemaCrumbs(schemaInfo.crumbs);
  }

  if (!navMatches.length && crumbs.length) {
    const newNav = buildNavHtml(crumbs);
    if (html.includes('</header>')) {
      html = html.replace('</header>', `</header>\n    \n${newNav}`);
      touched = true;
      navMatches = [newNav];
    }
  }

  if (navMatches.length && crumbs.length) {
    const oldNav = navMatches[0];
    const openTag = oldNav.match(/<nav\s+class="breadcrumb"[^>]*>/i)?.[0] || '<nav class="breadcrumb">';
    const newNav = buildNavHtml(crumbs, openTag);
    if (oldNav !== newNav) {
      html = html.replace(oldNav, newNav);
      touched = true;
      navMatches[0] = newNav;
    }
  }

  if (crumbs.length) {
    const schemaObject = buildSchemaObject(crumbs);
    const schemaScript = buildSchemaScriptFromObject(schemaObject);

    if (!schemaInfo) {
      if (html.includes('</head>')) {
        const insertPointRegex = /\n\s*<script\s+async\s+src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-16CJ2H74H1"[\s\S]*?<\/script>/i;
        if (insertPointRegex.test(html)) {
          html = html.replace(insertPointRegex, `\n${schemaScript}$&`);
        } else {
          html = html.replace('</head>', `${schemaScript}\n</head>`);
        }
        touched = true;
      }
    } else {
      const schemaCrumbs = normalizeSchemaCrumbs(schemaInfo.crumbs);
      if (!crumbsEqual(schemaCrumbs, crumbs)) {
        let newPayload;
        if (schemaInfo.arrayRoot) {
          const arr = Array.isArray(schemaInfo.parsed) ? schemaInfo.parsed : [schemaInfo.parsed];
          arr[schemaInfo.arrayIndex] = schemaObject;
          newPayload = encodeJson(arr);
        } else {
          newPayload = encodeJson(schemaObject);
        }
        const replacement = `    <script type="application/ld+json">\n${newPayload.split('\n').map(line => '    ' + line).join('\n')}\n    </script>`;
        html = html.replace(schemaInfo.fullMatch, replacement);
        touched = true;
      }
    }
  }

  if (touched) {
    fs.writeFileSync(file, html, 'utf8');
    changed++;
  }
}

console.log(`Files changed: ${changed}`);
