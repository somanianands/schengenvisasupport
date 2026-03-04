const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const SKIP_DIRS = new Set(['.git', '.venv', 'node_modules']);
const SKIP_PREFIX = '_';

const blockForArticle = `

                    <section class="need-based-links-block" aria-label="Need-based internal links">
                        <h2>Need Help With Something Specific?</h2>
                        <div class="need-based-links-grid">
                            <a href="/documents/required-documents/">Need document checklist?</a>
                            <a href="/support/flight-reservation/">Need flight reservation help?</a>
                            <a href="/support/hotel-booking/">Need hotel booking guidance?</a>
                            <a href="/support/travel-insurance/">Need travel insurance support?</a>
                            <a href="/appointment-booking/">Need embassy appointment tips?</a>
                            <a href="/visa-tracking/">Need to track application status?</a>
                            <a href="/processing-time/">Need current processing times?</a>
                            <a href="/schengen-visa-fees/">Need visa fee breakdown?</a>
                            <a href="/visa-rejection-guide/">Need rejection recovery help?</a>
                            <a href="/which-country-easiest-schengen-visa/">Need easiest-country comparison?</a>
                        </div>
                    </section>`;

const blockForMain = `

        <section class="need-based-links-block" aria-label="Need-based internal links">
            <h2>Need Help With Something Specific?</h2>
            <div class="need-based-links-grid">
                <a href="/documents/required-documents/">Need document checklist?</a>
                <a href="/support/flight-reservation/">Need flight reservation help?</a>
                <a href="/support/hotel-booking/">Need hotel booking guidance?</a>
                <a href="/support/travel-insurance/">Need travel insurance support?</a>
                <a href="/appointment-booking/">Need embassy appointment tips?</a>
                <a href="/visa-tracking/">Need to track application status?</a>
                <a href="/processing-time/">Need current processing times?</a>
                <a href="/schengen-visa-fees/">Need visa fee breakdown?</a>
                <a href="/visa-rejection-guide/">Need rejection recovery help?</a>
                <a href="/which-country-easiest-schengen-visa/">Need easiest-country comparison?</a>
            </div>
        </section>`;

function walk(dirPath, htmlFiles = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.well-known') {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      walk(fullPath, htmlFiles);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.endsWith('.html')) {
      continue;
    }

    if (entry.name.startsWith(SKIP_PREFIX)) {
      continue;
    }

    htmlFiles.push(fullPath);
  }

  return htmlFiles;
}

function addNeedBasedBlock(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('need-based-links-block')) {
    return false;
  }

  if (content.includes('</article>')) {
    content = content.replace('</article>', `${blockForArticle}\n                </article>`);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  if (content.includes('</main>')) {
    content = content.replace('</main>', `${blockForMain}\n    </main>`);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

const files = walk(rootDir);
let updated = 0;

for (const file of files) {
  const changed = addNeedBasedBlock(file);
  if (changed) {
    updated += 1;
  }
}

console.log(`Scanned HTML files: ${files.length}`);
console.log(`Updated files: ${updated}`);
