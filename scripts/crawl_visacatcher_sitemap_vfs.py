import json
import re
import xml.etree.ElementTree as ET
from collections import defaultdict
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

SITEMAP_URL = "https://visacatcher.bot/sitemap.xml"
UA = "Mozilla/5.0 (compatible; SitemapVFSCrawler/1.0)"


def fetch_text(url: str, timeout: int = 20):
    req = Request(url, headers={"User-Agent": UA})
    with urlopen(req, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="ignore"), response.headers.get("Content-Type", "")


def parse_sitemap_xml(xml_text: str):
    root = ET.fromstring(xml_text)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    sitemap_nodes = root.findall("sm:sitemap/sm:loc", ns)
    if sitemap_nodes:
        return "sitemapindex", [node.text.strip() for node in sitemap_nodes if node.text]

    url_nodes = root.findall("sm:url/sm:loc", ns)
    return "urlset", [node.text.strip() for node in url_nodes if node.text]


def collect_urlset_urls(sitemap_url: str):
    xml_text, _ = fetch_text(sitemap_url)
    kind, entries = parse_sitemap_xml(xml_text)

    if kind == "urlset":
        return entries

    urls = []
    for child_sitemap in entries:
        try:
            child_xml, _ = fetch_text(child_sitemap)
            child_kind, child_entries = parse_sitemap_xml(child_xml)
            if child_kind == "urlset":
                urls.extend(child_entries)
        except Exception:
            continue
    return urls


def extract_vfs_links(html: str):
    href_re = re.compile(r'href=["\']([^"\']+)["\']', re.I)
    out = []
    for href in href_re.findall(html):
        if href.startswith("https://visa.vfsglobal.com/"):
            out.append(href)
    return sorted(set(out))


def main():
    page_urls = collect_urlset_urls(SITEMAP_URL)
    page_urls = [u for u in page_urls if urlparse(u).netloc == "visacatcher.bot"]

    page_to_vfs = defaultdict(list)
    all_vfs = set()
    errors = {}

    for page in page_urls:
        try:
            html, ctype = fetch_text(page)
            if "text/html" not in ctype and "<html" not in html.lower():
                continue
            vfs_links = extract_vfs_links(html)
            if vfs_links:
                page_to_vfs[page] = vfs_links
                all_vfs.update(vfs_links)
        except (HTTPError, URLError, TimeoutError, Exception) as err:
            errors[page] = str(err)

    report = {
        "sitemap_url": SITEMAP_URL,
        "pages_in_sitemap": len(page_urls),
        "pages_with_vfs_links": len(page_to_vfs),
        "unique_vfs_links": len(all_vfs),
        "vfs_links": sorted(all_vfs),
        "page_to_vfs": dict(sorted(page_to_vfs.items())),
        "errors": errors,
    }

    with open("VISACATCHER_SITEMAP_VFS_LINKS.json", "w", encoding="utf-8") as jf:
        json.dump(report, jf, indent=2, ensure_ascii=False)

    with open("VISACATCHER_SITEMAP_VFS_LINKS.md", "w", encoding="utf-8") as mf:
        mf.write("# Visacatcher Sitemap VFS Link Report\n\n")
        mf.write(f"- Sitemap: {SITEMAP_URL}\n")
        mf.write(f"- Pages in sitemap: {len(page_urls)}\n")
        mf.write(f"- Pages with VFS links: {len(page_to_vfs)}\n")
        mf.write(f"- Unique VFS links: {len(all_vfs)}\n")
        mf.write(f"- Fetch errors: {len(errors)}\n\n")

        mf.write("## Unique VFS Links\n")
        for link in sorted(all_vfs):
            mf.write(f"- {link}\n")
        if not all_vfs:
            mf.write("- None\n")

        mf.write("\n## Pages Containing VFS Links\n")
        for page, links in sorted(page_to_vfs.items()):
            mf.write(f"\n### {page}\n")
            for link in links:
                mf.write(f"- {link}\n")
        if not page_to_vfs:
            mf.write("- None\n")

        if errors:
            mf.write("\n## Errors\n")
            for page, err in sorted(errors.items()):
                mf.write(f"- {page} -> {err}\n")

    print(f"PAGES_IN_SITEMAP={len(page_urls)}")
    print(f"PAGES_WITH_VFS={len(page_to_vfs)}")
    print(f"UNIQUE_VFS_LINKS={len(all_vfs)}")
    print("REPORT=VISACATCHER_SITEMAP_VFS_LINKS.md")
    print("JSON=VISACATCHER_SITEMAP_VFS_LINKS.json")


if __name__ == "__main__":
    main()
