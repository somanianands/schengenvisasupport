from pathlib import Path
import glob
import re
import json
import html

BASE = "https://schengenvisasupport.com"
IMG_URL = f"{BASE}/images/share-card.png"
LOGO_URL = f"{BASE}/images/logo.svg"
DEFAULT_DATE = "2026-03-05"


def update_file(path: Path) -> bool:
    content = path.read_text(encoding="utf-8", errors="ignore")
    original = content

    title_match = re.search(r"<title>(.*?)</title>", content, re.I | re.S)
    title = html.unescape(title_match.group(1).strip()) if title_match else path.parent.name.replace("-", " ").title()

    desc_match = re.search(r"<meta\s+name=[\"\']description[\"\']\s+content=[\"\'](.*?)[\"\']\s*/?>", content, re.I | re.S)
    if not desc_match:
        desc_match = re.search(r"<meta\s+property=[\"\']og:description[\"\']\s+content=[\"\'](.*?)[\"\']\s*/?>", content, re.I | re.S)
    description = html.unescape(" ".join(desc_match.group(1).split())) if desc_match else title

    canonical_match = re.search(r"<link\s+rel=[\"\']canonical[\"\']\s+href=[\"\'](.*?)[\"\']\s*/?>", content, re.I | re.S)
    canonical = canonical_match.group(1).strip() if canonical_match else f"{BASE}/{path.parent.as_posix().strip('/')}/"

    published_match = re.search(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"', content)
    modified_match = re.search(r'"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"', content)
    date_published = published_match.group(1) if published_match else DEFAULT_DATE
    date_modified = modified_match.group(1) if modified_match else date_published

    if 'name="robots" content="max-image-preview:large"' not in content and "name='robots' content='max-image-preview:large'" not in content:
        viewport = re.search(r"<meta\s+name=[\"\']viewport[\"\']\s+content=[\"\'].*?[\"\']\s*/?>", content, re.I)
        robots_line = "\n    <meta name=\"robots\" content=\"max-image-preview:large\">"
        if viewport:
            content = content[:viewport.end()] + robots_line + content[viewport.end():]
        else:
            content = content.replace("<head>", "<head>" + robots_line, 1)

    if not re.search(r"og:image", content, re.I):
        og_block = (
            f"\n    <meta property=\"og:image\" content=\"{IMG_URL}\">"
            f"\n    <meta property=\"og:image:secure_url\" content=\"{IMG_URL}\">"
            f"\n    <meta property=\"og:image:type\" content=\"image/png\">"
            f"\n    <meta property=\"og:image:width\" content=\"1200\">"
            f"\n    <meta property=\"og:image:height\" content=\"630\">"
            f"\n    <meta property=\"og:image:alt\" content=\"{html.escape(title, quote=True)}\">"
        )
        og_type = re.search(r"<meta\s+property=[\"\']og:type[\"\']\s+content=[\"\'].*?[\"\']\s*/?>", content, re.I)
        if og_type:
            content = content[:og_type.end()] + og_block + content[og_type.end():]
        else:
            content = content.replace("</head>", og_block + "\n</head>", 1)

    if not re.search(r"twitter:image", content, re.I):
        twitter_block = (
            f"\n    <meta name=\"twitter:image\" content=\"{IMG_URL}\">"
            f"\n    <meta name=\"twitter:image:alt\" content=\"{html.escape(title, quote=True)}\">"
        )
        twitter_card = re.search(r"<meta\s+name=[\"\']twitter:card[\"\']\s+content=[\"\'].*?[\"\']\s*/?>", content, re.I)
        if twitter_card:
            content = content[:twitter_card.end()] + twitter_block + content[twitter_card.end():]
        else:
            content = content.replace("</head>", twitter_block + "\n</head>", 1)

    has_main_image = bool(re.search(r"<main[\s\S]*?<img\s", content, re.I))
    if not has_main_image:
        h1 = re.search(r"(<h1[^>]*>.*?</h1>)", content, re.I | re.S)
        if h1:
            featured = (
                "\n                <figure class=\"featured-image\" style=\"margin:1rem 0 1.25rem;\">"
                f"\n                    <img src=\"/images/share-card.png\" alt=\"{html.escape(title, quote=True)}\" width=\"1200\" height=\"630\" loading=\"eager\" decoding=\"async\" style=\"width:100%;height:auto;border-radius:8px;\">"
                "\n                </figure>"
            )
            content = content[:h1.end()] + featured + content[h1.end():]

    if 'id="blogposting-schema"' not in content:
        schema = {
            "@context": "https://schema.org",
            "@type": ["Article", "BlogPosting"],
            "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
            "headline": title,
            "description": description,
            "image": [IMG_URL],
            "author": {"@type": "Organization", "name": "Schengen Visa Support Editorial Team"},
            "publisher": {
                "@type": "Organization",
                "name": "Schengen Visa Support",
                "logo": {"@type": "ImageObject", "url": LOGO_URL}
            },
            "datePublished": date_published,
            "dateModified": date_modified,
        }
        schema_line = "\n    <script type=\"application/ld+json\" id=\"blogposting-schema\">" + json.dumps(schema, separators=(",", ":")) + "</script>\n"
        content = content.replace("</head>", schema_line + "</head>", 1)

    if content != original:
        path.write_text(content, encoding="utf-8")
        return True
    return False


def main() -> None:
    files = [Path(p) for p in sorted(glob.glob("blog/*/index.html"))]
    updated = 0
    for file_path in files:
        if update_file(file_path):
            updated += 1
    print(f"UPDATED={updated} TOTAL={len(files)}")


if __name__ == "__main__":
    main()
