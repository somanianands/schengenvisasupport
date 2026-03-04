import re
import json
from collections import deque, defaultdict
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

START_URL = 'https://visacatcher.bot/appointments/dublin'
ALLOWED_HOST = urlparse(START_URL).netloc
MAX_PAGES = 1500

href_re = re.compile(r'href=["\']([^"\']+)["\']', re.I)

queue = deque([START_URL])
visited = set()
errors = {}
page_vfs = defaultdict(set)
all_vfs = set()


def fetch(url):
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; LinkAuditBot/1.0)'})
    with urlopen(req, timeout=20) as response:
        ctype = response.headers.get('Content-Type', '')
        data = response.read()
    return data.decode('utf-8', errors='ignore'), ctype


while queue and len(visited) < MAX_PAGES:
    url = urldefrag(queue.popleft())[0]
    if url in visited:
        continue
    visited.add(url)

    try:
        html, ctype = fetch(url)
    except (HTTPError, URLError, TimeoutError, Exception) as err:
        errors[url] = str(err)
        continue

    if 'text/html' not in ctype and '<html' not in html.lower():
        continue

    for href in href_re.findall(html):
        full = urldefrag(urljoin(url, href).strip())[0]
        if not full:
            continue

        parsed = urlparse(full)
        if parsed.scheme not in ('http', 'https'):
            continue

        if 'vfsglobal.com' in parsed.netloc or 'visa.vfsglobal.com' in full:
            page_vfs[url].add(full)
            all_vfs.add(full)

        if parsed.netloc == ALLOWED_HOST and full not in visited:
            queue.append(full)

report = {
    'start_url': START_URL,
    'host': ALLOWED_HOST,
    'pages_visited': len(visited),
    'errors': errors,
    'vfs_links_count': len(all_vfs),
    'vfs_links': sorted(all_vfs),
    'page_to_vfs': {k: sorted(v) for k, v in sorted(page_vfs.items())},
}

with open('VISACATCHER_VFS_LINKS.json', 'w', encoding='utf-8') as json_file:
    json.dump(report, json_file, ensure_ascii=False, indent=2)

with open('VISACATCHER_VFS_LINKS.md', 'w', encoding='utf-8') as md_file:
    md_file.write('# Visacatcher VFS Link Crawl Report\n\n')
    md_file.write(f'- Start URL: {START_URL}\n')
    md_file.write(f'- Host crawled: {ALLOWED_HOST}\n')
    md_file.write(f'- Pages visited: {len(visited)}\n')
    md_file.write(f'- VFS links found: {len(all_vfs)}\n')
    md_file.write(f'- Crawl errors: {len(errors)}\n\n')

    md_file.write('## Unique VFS Links\n')
    if all_vfs:
        for link in sorted(all_vfs):
            md_file.write(f'- {link}\n')
    else:
        md_file.write('- None found\n')

    md_file.write('\n## Pages Containing VFS Links\n')
    if page_vfs:
        for page, links in sorted(page_vfs.items()):
            md_file.write(f'\n### {page}\n')
            for link in sorted(links):
                md_file.write(f'- {link}\n')
    else:
        md_file.write('- None\n')

    if errors:
        md_file.write('\n## Crawl Errors\n')
        for page, err in sorted(errors.items()):
            md_file.write(f'- {page} -> {err}\n')

print(f'PAGES_VISITED={len(visited)}')
print(f'VFS_LINKS_FOUND={len(all_vfs)}')
print('REPORT=VISACATCHER_VFS_LINKS.md')
print('JSON=VISACATCHER_VFS_LINKS.json')
