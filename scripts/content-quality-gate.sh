#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Usage:
#   scripts/content-quality-gate.sh path1 path2 ...
#   cat filelist.txt | scripts/content-quality-gate.sh

FILES=()
if [[ $# -eq 0 ]]; then
  while IFS= read -r line; do
    [[ -n "$line" ]] && FILES+=("$line")
  done
else
  FILES=("$@")
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No input files provided."
  exit 1
fi

echo "=== CONTENT QUALITY GATE ==="
printf "%-70s | %-6s | %-5s | %-5s | %-5s | %-8s\n" "file" "words" "meta" "canon" "h1" "status"
printf '%s\n' "--------------------------------------------------------------------------------------------------------------------------------"

fail_count=0

for f in "${FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    printf "%-70s | %-6s | %-5s | %-5s | %-5s | %-8s\n" "$f" "-" "-" "-" "-" "MISSING"
    fail_count=$((fail_count+1))
    continue
  fi

  words=$(wc -w < "$f" | tr -d ' ')
  has_meta=$(grep -ic '<meta name="description"' "$f" || true)
  has_canon=$(grep -ic '<link rel="canonical"' "$f" || true)
  has_h1=$(grep -ic '<h1' "$f" || true)

  # Hard quality blockers
  repeated_additional=$( (grep -o "Additional Practical Notes" "$f" 2>/dev/null || true) | wc -l | tr -d ' ')
  lorem_hits=$(grep -Eic 'lorem ipsum|dummy text|placeholder' "$f" || true)
  todo_hits=$(grep -Eic 'TODO|TBD|XXX' "$f" || true)

  status="PASS"
  if [[ "$words" -lt 1200 ]] || [[ "$has_meta" -eq 0 ]] || [[ "$has_canon" -eq 0 ]] || [[ "$has_h1" -eq 0 ]] || [[ "$repeated_additional" -ge 2 ]] || [[ "$lorem_hits" -gt 0 ]] || [[ "$todo_hits" -gt 0 ]]; then
    status="FAIL"
    fail_count=$((fail_count+1))
  fi

  printf "%-70s | %-6s | %-5s | %-5s | %-5s | %-8s\n" "$f" "$words" "$has_meta" "$has_canon" "$has_h1" "$status"
done

echo
if [[ "$fail_count" -gt 0 ]]; then
  echo "Result: FAILED ($fail_count pages need fixes)"
  exit 2
fi

echo "Result: PASSED (all pages meet baseline quality gate)"
