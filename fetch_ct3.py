#!/usr/bin/env python3
import ssl, http.client, os, time

TOTAL = 89668
DATA = b"uuid=8de62c47-f335-42f6-909d-2d8f4b7fb7f5&platform_name=H5P&platform_version=1.35.0&h5p_version=1.24.0&disabled=0&local_id=build&type=local&core_api_version=1.24"
OUT = "/tmp/content-types-hub.json"

ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.maximum_version = ssl.TLSVersion.TLSv1_2
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

chunks = {}
chunk_size = 14000  # under 16KB per chunk

start = 0
while start < TOTAL:
    end = min(start + chunk_size - 1, TOTAL - 1)
    print(f"Requesting Range: bytes={start}-{end}")
    try:
        conn = http.client.HTTPSConnection("api.h5p.org", 443, context=ctx, timeout=25)
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": str(len(DATA)),
            "Range": f"bytes={start}-{end}"
        }
        conn.request("POST", "/v1/content-types", body=DATA, headers=headers)
        resp = conn.getresponse()
        print(f"  Status: {resp.status}, Content-Length: {resp.headers.get('Content-Length')}, Content-Range: {resp.headers.get('Content-Range')}")
        body = resp.read()
        print(f"  Got: {len(body)} bytes")
        chunks[start] = body
        conn.close()
    except Exception as e:
        print(f"  Error: {e}")
        # Fall back to timeout-based read
        try:
            conn = http.client.HTTPSConnection("api.h5p.org", 443, context=ctx, timeout=20)
            conn.request("POST", "/v1/content-types", body=DATA, headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": str(len(DATA)),
            })
            resp = conn.getresponse()
            body = b""
            while True:
                try:
                    chunk = resp.fp.read(1024)
                    if not chunk:
                        break
                    body += chunk
                    if len(body) >= end - start + 1:
                        break
                except:
                    break
            chunks[start] = body[start:end+1] if len(body) > start else body
            conn.close()
        except Exception as e2:
            print(f"  Fallback error: {e2}")
    start = end + 1
    time.sleep(0.5)

# Combine all chunks
result = b""
for key in sorted(chunks.keys()):
    result += chunks[key]

print(f"\nTotal assembled: {len(result)} bytes")
with open(OUT, "wb") as f:
    f.write(result)

# Validate
import json
try:
    d = json.loads(result)
    ct = d.get("contentTypes", [])
    print(f"Valid JSON: {len(ct)} content types")
except Exception as e:
    print(f"Invalid JSON: {str(e)[:100]}")
    # Try to recover partial JSON
    text = result.decode("utf-8", errors="replace")
    # Find last complete object
    last_brace = text.rfind('}},')
    if last_brace > 0:
        fixed = text[:last_brace+2] + "]}"
        try:
            d = json.loads(fixed)
            ct = d.get("contentTypes", [])
            print(f"Recovered partial JSON: {len(ct)} content types")
            with open(OUT, "w") as f:
                f.write(fixed)
        except Exception as e2:
            print(f"Recovery failed: {e2}")
