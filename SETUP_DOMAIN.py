"""Set this portable portfolio's public URL before uploading it."""
from pathlib import Path
from urllib.parse import urlsplit
import re
import sys

root = Path(__file__).resolve().parent
if len(sys.argv) != 2:
    raise SystemExit('Usage: python3 SETUP_DOMAIN.py https://example.com[/portfolio]')
base = sys.argv[1].rstrip('/')
u = urlsplit(base)
if u.scheme not in ('https', 'http') or not u.netloc or u.query or u.fragment or u.username or u.password or any(c in base for c in '<>"\'\\ \n\r'):
    raise SystemExit('Enter a complete HTTP(S) URL without a query, credentials or fragment.')
index = (root / 'index.html').read_text(encoding='utf-8')
match = re.search(r'<link rel="canonical" href="([^"]+)">', index)
if not match:
    raise SystemExit('Canonical URL not found. No files changed.')
old = match.group(1).rstrip('/')
paths = ['index.html', 'en/index.html', 'robots.txt', 'sitemap.xml']
updated = [(root / path, (root / path).read_text(encoding='utf-8').replace(old, base)) for path in paths]
for path, text in updated:
    path.write_text(text, encoding='utf-8')
print('SEO URLs updated:', base)
print('Upload the full website folder to your hosting provider.')
