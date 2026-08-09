#!/usr/bin/env bash
# Builds all sandbox images. Run once after cloning, and any time a Dockerfile
# under backend/sandbox/ changes. Safe to re-run (Docker layer cache).
set -euo pipefail
cd "$(dirname "$0")"

build() {
  local lang=$1
  local tag="codecollab-sandbox-${lang}"
  echo "▶ Building $tag …"
  docker build -t "$tag" -f "Dockerfile.${lang}" .
}

build node
build python
build cpp
build go
build rust
build java

echo "✅ All sandbox images built."
docker images | grep codecollab-sandbox || true
