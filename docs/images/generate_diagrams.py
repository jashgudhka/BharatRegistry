import base64
import zlib
import urllib.request
import glob
import os

for mmd_file in glob.glob("docs/images/*.mmd"):
    with open(mmd_file, "r") as f:
        text = f.read()

    # Kroki encoding: deflate + base64 url-safe
    compressed = zlib.compress(text.encode('utf-8'), 9)
    encoded = base64.urlsafe_b64encode(compressed).decode('ascii')
    
    url = f"https://kroki.io/mermaid/png/{encoded}"
    png_file = mmd_file.replace(".mmd", ".png")
    print(f"Generating {png_file}...")
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(png_file, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        print("Success!")
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
