"""Check frontend rendering"""
import urllib.request

r = urllib.request.urlopen("http://localhost:5175/login")
html = r.read().decode("utf-8")
print("Status:", r.status)
print("Content-Type:", r.headers.get("Content-Type"))
print()

if "root" in html:
    import re
    scripts = re.findall(r'<script[^>]*src="([^"]+)"', html)
    print("Scripts found:", len(scripts))
    for s in scripts[:5]:
        print("  ", s)
    mount = re.search(r'<div[^>]+id="root"', html)
    print("Mount point:", mount.group(0) if mount else "NOT FOUND")
    print("HTML length:", len(html))
else:
    print("First 500 chars:", html[:500])
