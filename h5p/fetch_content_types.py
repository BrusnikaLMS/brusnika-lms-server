import ssl
import http.client
import json
import sys

DATA = (
    b"uuid=00000000-0000-0000-0000-000000000000&platform_name=H5P"
    b"&platform_version=1.35.0&h5p_version=1.24.0&disabled=0"
    b"&local_id=build&type=local&core_api_version=1.24"
)
TOTAL = 89668
CHUNK = 14000

ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.maximum_version = ssl.TLSVersion.TLSv1_2
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

result = b""
s = 0
while s < TOTAL:
    e = min(s + CHUNK - 1, TOTAL - 1)
    conn = http.client.HTTPSConnection("api.h5p.org", 443, context=ctx, timeout=30)
    conn.request(
        "POST",
        "/v1/content-types",
        body=DATA,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": str(len(DATA)),
            "Range": "bytes=%d-%d" % (s, e),
        },
    )
    r = conn.getresponse()
    body = r.read()
    result += body
    conn.close()
    sys.stderr.write("bytes %d-%d: got %d\n" % (s, e, len(body)))
    s = e + 1

with open("static/content-types-hub.json", "wb") as f:
    f.write(result)

d = json.loads(result)
print("OK: %d content types" % len(d["contentTypes"]))
