#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

cat > /tmp/generated_55.txt << 'EOF'
countries/austria/index.html
countries/belgium/index.html
countries/croatia/index.html
countries/czech-republic/index.html
countries/denmark/index.html
countries/estonia/index.html
countries/finland/index.html
countries/hungary/index.html
countries/iceland/index.html
countries/latvia/index.html
countries/liechtenstein/index.html
countries/lithuania/index.html
countries/luxembourg/index.html
countries/malta/index.html
countries/norway/index.html
countries/poland/index.html
countries/portugal/index.html
countries/slovakia/index.html
countries/slovenia/index.html
countries/sweden/index.html
uk/tourism/index.html
uk/business/index.html
uk/family/index.html
uk/transit/index.html
usa/tourism/index.html
usa/business/index.html
usa/family/index.html
usa/transit/index.html
canada/tourism/index.html
canada/business/index.html
canada/family/index.html
canada/transit/index.html
visa-for-couples/index.html
visa-for-families/index.html
visa-for-homemakers/index.html
visa-for-parents/index.html
visa-for-remote-workers/index.html
second-time-applicant/index.html
schengen-visa-cost-by-country/index.html
cheapest-schengen-visa-country/index.html
documents/employment-letter-schengen-visa/index.html
documents/proof-of-ties-schengen-visa/index.html
documents/accommodation-proof-schengen-visa/index.html
documents/travel-insurance-schengen-visa/index.html
fastest-schengen-visa-by-country/index.html
schengen-visa-rush-appointment/index.html
schengen-visa-validity-start-date/index.html
schengen-student-visa-guide/index.html
teaching-schengen-countries/index.html
digital-nomad-schengen-visa/index.html
schengen-visa-for-pakistan/index.html
schengen-visa-for-bangladesh/index.html
schengen-visa-for-philippines/index.html
schengen-visa-for-retirees/index.html
schengen-visa-elderly-travelers/index.html
EOF

printf "file|exists|words|additional_notes_count|css_main|css_style\n" > /tmp/generated_55_audit.csv

while IFS= read -r f; do
  if [[ -f "$f" ]]; then
    words=$(wc -w < "$f" | tr -d ' ')
    add_notes=$( (grep -o "Additional Practical Notes" "$f" 2>/dev/null || true) | wc -l | tr -d ' ' )
    css_main=$(grep -c '/css/main.css' "$f" 2>/dev/null || true)
    css_style=$(grep -c '/css/style.css' "$f" 2>/dev/null || true)
    printf "%s|yes|%s|%s|%s|%s\n" "$f" "$words" "$add_notes" "$css_main" "$css_style" >> /tmp/generated_55_audit.csv
  else
    printf "%s|no|0|0|0|0\n" "$f" >> /tmp/generated_55_audit.csv
  fi
done < /tmp/generated_55.txt

echo "=== SUMMARY ==="
echo "Total expected: $(wc -l < /tmp/generated_55.txt | tr -d ' ')"
echo "Missing files: $(awk -F'|' 'NR>1 && $2=="no" {c++} END{print c+0}' /tmp/generated_55_audit.csv)"
echo "Below 1200 words: $(awk -F'|' 'NR>1 && $3<1200 {c++} END{print c+0}' /tmp/generated_55_audit.csv)"
echo "Repeated filler (Additional Practical Notes >=2): $(awk -F'|' 'NR>1 && $4>=2 {c++} END{print c+0}' /tmp/generated_55_audit.csv)"
echo "Uses /css/style.css: $(awk -F'|' 'NR>1 && $6>0 {c++} END{print c+0}' /tmp/generated_55_audit.csv)"
echo "Uses /css/main.css: $(awk -F'|' 'NR>1 && $5>0 {c++} END{print c+0}' /tmp/generated_55_audit.csv)"

echo
echo "=== PAGES WITH REPEATED FILLER (top 30) ==="
awk -F'|' 'NR>1 && $4>=2 {print $4"x|"$3" words|"$1}' /tmp/generated_55_audit.csv | sort -t'|' -k1,1nr | head -30

echo
echo "=== PAGES BELOW 1200 WORDS ==="
awk -F'|' 'NR>1 && $3<1200 {print $3" words|"$1}' /tmp/generated_55_audit.csv
