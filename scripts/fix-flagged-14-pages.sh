#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

pages=(
  "documents/proof-of-ties-schengen-visa/index.html"
  "documents/travel-insurance-schengen-visa/index.html"
  "fastest-schengen-visa-by-country/index.html"
  "schengen-visa-rush-appointment/index.html"
  "documents/accommodation-proof-schengen-visa/index.html"
  "schengen-student-visa-guide/index.html"
  "digital-nomad-schengen-visa/index.html"
  "schengen-visa-for-bangladesh/index.html"
  "teaching-schengen-countries/index.html"
  "schengen-visa-for-pakistan/index.html"
  "schengen-visa-for-philippines/index.html"
  "schengen-visa-validity-start-date/index.html"
  "schengen-visa-elderly-travelers/index.html"
  "schengen-visa-for-retirees/index.html"
)

for file in "${pages[@]}"; do
  [[ -f "$file" ]] || continue

  # Align stylesheet to site standard.
  sed -i '' 's|/css/style.css|/css/main.css|g' "$file"

  # Replace repeated filler sections with one practical, non-repetitive section.
  perl -0777 -i -pe 's|(?:\s*<section><h2>Additional Practical Notes</h2>\s*<p>Staying informed about the latest visa procedures and requirements is crucial\. Regular updates to policies can affect your application timeline and required documentation\. Consult official resources and consider professional advice for complex cases\.</p>\s*</section>)+|\n<section>\n<h2>Final Preparation Checklist Before Submission</h2>\n<p>Before your appointment, review your entire file as one narrative: travel purpose, finances, employment or business ties, and return intent should all match across documents. Ensure date consistency between itinerary, insurance, leave approvals, and bookings. Keep printed and digital copies of critical documents, and avoid last-minute edits that create inconsistencies. A coherent, verifiable file is often the deciding factor between smooth approval and avoidable delays.</p>\n</section>|gs' "$file"
done

echo "Fixed pages: ${#pages[@]}"
