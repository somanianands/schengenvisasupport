const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['.git', '.venv', 'node_modules']);

function walk(dirPath, htmlFiles = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(fullPath, htmlFiles);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.html')) continue;
    if (entry.name.startsWith('_')) continue;
    htmlFiles.push(fullPath);
  }
  return htmlFiles;
}

function linksForType(type) {
  const sets = {
    documents: [
      ['/documents/required-documents/', 'Need full document checklist?'],
      ['/documents/cover-letter/', 'Need a cover letter sample?'],
      ['/documents/travel-itinerary/', 'Need itinerary template?'],
      ['/documents/bank-statement/', 'Need bank statement format?'],
      ['/documents/flight-itinerary/', 'Need flight itinerary guide?'],
      ['/documents/hotel-booking/', 'Need hotel booking proof?'],
      ['/support/travel-insurance/', 'Need travel insurance help?'],
      ['/photo-requirements/', 'Need visa photo rules?'],
      ['/proof-of-ties-document/', 'Need proof-of-ties examples?'],
      ['/common-mistakes/', 'Need to avoid document mistakes?']
    ],
    countries: [
      ['/countries/', 'Need all destination country guides?'],
      ['/which-country-easiest-schengen-visa/', 'Need easiest-country comparison?'],
      ['/schengen-visa-success-rates/', 'Need approval rates by country?'],
      ['/fastest-schengen-visa-processing/', 'Need fastest processing countries?'],
      ['/processing-time/', 'Need country-wise processing time?'],
      ['/schengen-visa-fees/', 'Need fee differences by country?'],
      ['/documents/required-documents/', 'Need country-ready documents?'],
      ['/appointment-booking/', 'Need embassy appointment tips?'],
      ['/visa-rejection-guide/', 'Need rejection prevention guide?'],
      ['/blog/', 'Need country-specific blog explainers?']
    ],
    blog: [
      ['/first-time-applicant/', 'Need a beginner roadmap?'],
      ['/documents/required-documents/', 'Need complete documents checklist?'],
      ['/processing-time/', 'Need latest processing timelines?'],
      ['/schengen-visa-fees/', 'Need current visa fees?'],
      ['/visa-tracking/', 'Need to track application status?'],
      ['/visa-rejection-guide/', 'Need rejection recovery steps?'],
      ['/visa-types/', 'Need the right visa type first?'],
      ['/countries/', 'Need destination-specific rules?'],
      ['/support/', 'Need practical support options?'],
      ['/resources/', 'Need official embassy resources?']
    ],
    visaTypes: [
      ['/visa-types/', 'Need all visa categories overview?'],
      ['/visa-types/tourist/', 'Need tourist visa details?'],
      ['/visa-types/business/', 'Need business visa requirements?'],
      ['/visa-types/family-visit/', 'Need family visit visa guide?'],
      ['/visa-types/student/', 'Need student visa route?'],
      ['/visa-types/transit/', 'Need transit visa rules?'],
      ['/visa-types/long-stay/', 'Need long-stay visa basics?'],
      ['/multiple-entry-visa/', 'Need entry type explanation?'],
      ['/visa-validity/', 'Need 90/180 stay rule guidance?'],
      ['/documents/required-documents/', 'Need type-specific document list?']
    ],
    residence: [
      ['/schengen-visa-for-indians/', 'Need India-based application guide?'],
      ['/ireland-to-schengen/', 'Need Ireland resident process?'],
      ['/uk/', 'Need UK resident process?'],
      ['/usa/', 'Need USA resident process?'],
      ['/schengen-visa-from-dubai/', 'Need UAE/Dubai process?'],
      ['/appointment-booking/', 'Need local appointment guidance?'],
      ['/documents/required-documents/', 'Need residence-based document list?'],
      ['/processing-time/', 'Need local processing expectations?'],
      ['/visa-rejection-guide/', 'Need refusal risk reduction tips?'],
      ['/resources/embassy-links/', 'Need official embassy and VFS links?']
    ],
    support: [
      ['/support/', 'Need all support services?'],
      ['/support/flight-reservation/', 'Need flight reservation support?'],
      ['/support/hotel-booking/', 'Need hotel booking support?'],
      ['/support/travel-insurance/', 'Need travel insurance support?'],
      ['/documents/required-documents/', 'Need support-ready documents list?'],
      ['/appointment-booking/', 'Need appointment booking help?'],
      ['/visa-tracking/', 'Need tracking help?'],
      ['/processing-time/', 'Need processing expectations?'],
      ['/visa-rejection-guide/', 'Need rejection troubleshooting?'],
      ['/contact/', 'Need direct contact assistance?']
    ],
    default: [
      ['/first-time-applicant/', 'Need a first-time guide?'],
      ['/documents/required-documents/', 'Need complete document checklist?'],
      ['/support/flight-reservation/', 'Need flight reservation support?'],
      ['/support/hotel-booking/', 'Need hotel booking guidance?'],
      ['/support/travel-insurance/', 'Need insurance guidance?'],
      ['/appointment-booking/', 'Need appointment strategy?'],
      ['/visa-tracking/', 'Need to track your application?'],
      ['/processing-time/', 'Need current processing times?'],
      ['/schengen-visa-fees/', 'Need full visa fee details?'],
      ['/which-country-easiest-schengen-visa/', 'Need easiest-country comparison?']
    ]
  };

  return sets[type] || sets.default;
}

function typeForFile(relativePath) {
  const p = relativePath.replace(/\\/g, '/');

  if (p.startsWith('documents/')) return 'documents';
  if (p.startsWith('countries/')) return 'countries';
  if (p.startsWith('blog/')) return 'blog';
  if (p.startsWith('visa-types/')) return 'visaTypes';
  if (p.startsWith('support/') || p.startsWith('resources/')) return 'support';

  if (
    p.startsWith('india/') ||
    p.startsWith('uk/') ||
    p.startsWith('usa/') ||
    p.startsWith('ireland/') ||
    p.startsWith('ireland-to-schengen/') ||
    p.startsWith('schengen-visa-from-dubai/')
  ) return 'residence';

  return 'default';
}

function buildBlock(type) {
  const links = linksForType(type);
  const linkHtml = links
    .map(([href, label]) => `                            <a href="${href}">${label}</a>`)
    .join('\n');

  return `                    <section class="need-based-links-block" aria-label="Need-based internal links">\n                        <h2>Need Help With Something Specific?</h2>\n                        <div class="need-based-links-grid">\n${linkHtml}\n                        </div>\n                    </section>`;
}

function updatePage(filePath) {
  const rel = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const type = typeForFile(rel);
  const block = buildBlock(type);

  const original = fs.readFileSync(filePath, 'utf8');
  const regex = /\s*<section class="need-based-links-block"[\s\S]*?<\/section>/;

  if (!regex.test(original)) return false;

  const updated = original.replace(regex, `\n${block}`);
  if (updated === original) return false;

  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

const files = walk(rootDir);
let updatedCount = 0;
for (const file of files) {
  if (updatePage(file)) updatedCount += 1;
}

console.log(`Scanned HTML files: ${files.length}`);
console.log(`Contextual blocks updated: ${updatedCount}`);
