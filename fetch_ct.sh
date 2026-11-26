#!/bin/bash
URL="https://api.h5p.org/v1/content-types"
DATA="uuid=8de62c47-f335-42f6-909d-2d8f4b7fb7f5&platform_name=H5P&platform_version=1.35.0&h5p_version=1.24.0&disabled=0&local_id=build&type=local&core_api_version=1.24"
OUT="/tmp/content-types-hub.json"

# Step 1: POST to get first chunk (will timeout at ~16KB)
curl -sf --max-time 25 -X POST "$URL" -d "$DATA" -o "$OUT" 2>/dev/null
SIZE=$(wc -c < "$OUT")
echo "Part1 POST: $SIZE bytes"

# Step 2: GET with Range to fetch remaining bytes
RANGE_OUT="/tmp/ct_range.bin"
curl -sf --max-time 25 -H "Range: bytes=${SIZE}-89668" -o "$RANGE_OUT" "$URL" 2>/dev/null
R_EXIT=$?
R_SIZE=$(wc -c < "$RANGE_OUT" 2>/dev/null || echo 0)
echo "Part2 GET Range $SIZE-89668: exit=$R_EXIT, got=$R_SIZE bytes"

if [ "$R_SIZE" -gt 0 ]; then
  cat "$RANGE_OUT" >> "$OUT"
  echo "Combined: $(wc -c < "$OUT") bytes"
else
  echo "Range request failed or returned 0 bytes"
fi

# Validate JSON
python3 -c "
import json, sys
try:
    d = json.load(open('$OUT'))
    ct = d.get('contentTypes', [])
    print(f'Valid JSON: {len(ct)} content types')
except Exception as e:
    print(f'Invalid JSON: {e}')
" 2>/dev/null || echo "python3 not available"
