#!/bin/bash
# Usage: ./test_pipeline.sh /path/to/folder/of/images
SECRET="Imadeaverylongrandomstringhere-bchjbcudhwqihdoiwhd"

for img in "$1"/*; do
  echo "=== $img ==="
  curl -s -X POST "http://localhost:8000/detect/analyze-image?image_path=$img" \
    -H "X-Internal-Secret: $SECRET" | python3 -m json.tool
  echo ""
done