#!/usr/bin/env bash
set -euo pipefail
mkdir -p "$(dirname "$0")"
variant="${1:-1.5b}"
case "$variant" in 1.5b) repo=Qwen/Qwen2.5-1.5B-Instruct-GGUF; file=qwen2.5-1.5b-instruct-q4_k_m.gguf;; 3b) repo=Qwen/Qwen2.5-3B-Instruct-GGUF; file=qwen2.5-3b-instruct-q4_k_m.gguf;; *) echo 'Usage: download_llm.sh [1.5b|3b]' >&2; exit 1;; esac
huggingface-cli download "$repo" "$file" --local-dir "$(dirname "$0")" --local-dir-use-symlinks false
