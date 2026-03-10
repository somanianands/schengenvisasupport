const fs = require('fs');

const files = [
  'countries/austria/index.html','countries/belgium/index.html','countries/croatia/index.html','countries/czech-republic/index.html','countries/denmark/index.html','countries/estonia/index.html','countries/finland/index.html','countries/hungary/index.html','countries/iceland/index.html','countries/latvia/index.html','countries/liechtenstein/index.html','countries/lithuania/index.html','countries/luxembourg/index.html','countries/malta/index.html','countries/norway/index.html','countries/poland/index.html','countries/portugal/index.html','countries/slovakia/index.html','countries/slovenia/index.html','countries/sweden/index.html',
  'uk/tourism/index.html','uk/business/index.html','uk/family/index.html','uk/transit/index.html',
  'usa/tourism/index.html','usa/business/index.html','usa/family/index.html','usa/transit/index.html',
  'canada/tourism/index.html','canada/business/index.html','canada/family/index.html','canada/transit/index.html',
  'visa-for-couples/index.html','visa-for-families/index.html','visa-for-homemakers/index.html','visa-for-parents/index.html','visa-for-remote-workers/index.html','second-time-applicant/index.html','schengen-visa-cost-by-country/index.html','cheapest-schengen-visa-country/index.html',
  'documents/employment-letter-schengen-visa/index.html','documents/proof-of-ties-schengen-visa/index.html','documents/accommodation-proof-schengen-visa/index.html','documents/travel-insurance-schengen-visa/index.html',
  'fastest-schengen-visa-by-country/index.html','schengen-visa-rush-appointment/index.html','schengen-visa-validity-start-date/index.html','schengen-student-visa-guide/index.html','teaching-schengen-countries/index.html','digital-nomad-schengen-visa/index.html','schengen-visa-for-pakistan/index.html','schengen-visa-for-bangladesh/index.html','schengen-visa-for-philippines/index.html','schengen-visa-for-retirees/index.html','schengen-visa-elderly-travelers/index.html',
  'schengen-visa-for-nepal/index.html','schengen-visa-for-indonesia/index.html','schengen-visa-for-vietnam/index.html',
  'schengen-visa-for-egypt/index.html','schengen-visa-for-kenya/index.html','schengen-visa-from-saudi-arabia/index.html',
  'schengen-visa-from-qatar/index.html','schengen-visa-from-kuwait/index.html','schengen-visa-from-singapore/index.html'
].filter((f) => fs.existsSync(f));

function cleanText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function words(text) {
  return text.split(/\s+/).filter(Boolean);
}

function shingles(arr, k = 5) {
  const set = new Set();
  for (let i = 0; i <= arr.length - k; i++) {
    set.add(arr.slice(i, i + k).join(' '));
  }
  return set;
}

function jaccard(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

const data = files.map((f) => {
  const txt = cleanText(fs.readFileSync(f, 'utf8'));
  const w = words(txt);
  return { file: f, wordCount: w.length, shingles: shingles(w, 5) };
});

let maxPair = null;
for (let i = 0; i < data.length; i++) {
  for (let j = i + 1; j < data.length; j++) {
    const sim = jaccard(data[i].shingles, data[j].shingles);
    if (!maxPair || sim > maxPair.sim) {
      maxPair = { a: data[i].file, b: data[j].file, sim };
    }
  }
}

const lowWord = data.filter((d) => d.wordCount < 1200).map((d) => `${d.wordCount}\t${d.file}`);

console.log(`Pages audited: ${data.length}`);
console.log(`Lowest similarity quality marker (max pairwise Jaccard over 5-grams): ${(maxPair.sim * 100).toFixed(2)}%`);
console.log(`Most similar pair: ${maxPair.a} <> ${maxPair.b}`);
console.log(`Pages below 1200 words: ${lowWord.length}`);
if (lowWord.length) console.log(lowWord.join('\n'));
