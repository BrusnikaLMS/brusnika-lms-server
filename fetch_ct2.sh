#!/bin/bash
URL="https://api.h5p.org/v1/content-types"
DATA="uuid=8de62c47-f335-42f6-909d-2d8f4b7fb7f5&platform_name=H5P&platform_version=1.35.0&h5p_version=1.24.0&disabled=0&local_id=build&type=local&core_api_version=1.24"
OUT="/tmp/content-types-hub.json"

# Try wget with POST data
wget --timeout=30 --tries=1 \
  --post-data="$DATA" \
  --no-check-certificate \
  -q -O "$OUT" \
  "$URL" 2>&1
echo "wget exit: $?"
SIZE=$(wc -c < "$OUT" 2>/dev/null || echo 0)
echo "Downloaded: $SIZE bytes"

# Validate
python3 -c "
import json, sys
try:
    d = json.load(open('$OUT'))
    ct = d.get('contentTypes', [])
    print('Valid JSON:', len(ct), 'content types')
except Exception as e:
    print('Invalid JSON:', str(e)[:100])
" 2>/dev/null
