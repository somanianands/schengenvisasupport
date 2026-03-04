import os
import re
from collections import defaultdict

root = "."
ignore = {".git", "node_modules", ".venv"}

href_re = re.compile(r'<a\s+[^>]*href="([^"]+)"', re.I)
block_re = re.compile(r'<section class="need-based-links-block"[\s\S]*?</section>', re.I)

stats = defaultdict(int)
file_count = 0
with_need_block = 0

for dp, dns, fns in os.walk(root):
    dns[:] = [d for d in dns if d not in ignore]
    for fn in fns:
        if not fn.endswith('.html') or fn.startswith('_'):
            continue

        path = os.path.join(dp, fn)
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        file_count += 1

        stripped = re.sub(r'<header[\s\S]*?</header>', '', content, flags=re.I)
        stripped = re.sub(r'<footer[\s\S]*?</footer>', '', stripped, flags=re.I)
        stripped = re.sub(r'<nav[^>]*[\s\S]*?</nav>', '', stripped, flags=re.I)

        all_links = href_re.findall(content)
        content_links = href_re.findall(stripped)

        def classify(href: str) -> str:
            if href.startswith('http://') or href.startswith('https://'):
                return 'internal_abs' if 'schengenvisasupport.com' in href else 'external'
            if href.startswith('/'):
                return 'internal_rel'
            if href.startswith('#'):
                return 'anchor'
            if href.startswith('mailto:') or href.startswith('tel:'):
                return 'contact'
            return 'other'

        for href in all_links:
            stats['all_total'] += 1
            stats[f'all_{classify(href)}'] += 1

        for href in content_links:
            stats['content_total'] += 1
            stats[f'content_{classify(href)}'] += 1

        block_match = block_re.search(content)
        if block_match:
            with_need_block += 1
            block_links = href_re.findall(block_match.group(0))
            stats['need_block_links_total'] += len(block_links)
            internal = sum(1 for href in block_links if href.startswith('/') or 'schengenvisasupport.com' in href)
            stats['need_block_internal'] += internal
            stats['need_block_external'] += len(block_links) - internal

internal_content = stats['content_internal_rel'] + stats['content_internal_abs']

print('HTML_FILES', file_count)
print('PAGES_WITH_NEED_BLOCK', with_need_block)
print('ALL_LINKS_TOTAL', stats['all_total'])
print('ALL_INTERNAL_REL', stats['all_internal_rel'])
print('ALL_INTERNAL_ABS', stats['all_internal_abs'])
print('ALL_EXTERNAL', stats['all_external'])
print('CONTENT_LINKS_TOTAL', stats['content_total'])
print('CONTENT_INTERNAL_REL', stats['content_internal_rel'])
print('CONTENT_INTERNAL_ABS', stats['content_internal_abs'])
print('CONTENT_EXTERNAL', stats['content_external'])
print('NEED_BLOCK_LINKS_TOTAL', stats['need_block_links_total'])
print('NEED_BLOCK_INTERNAL', stats['need_block_internal'])
print('NEED_BLOCK_EXTERNAL', stats['need_block_external'])
print('AVG_CONTENT_INTERNAL_PER_PAGE', round(internal_content / file_count, 2) if file_count else 0)
