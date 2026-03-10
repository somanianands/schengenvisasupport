const fs = require('fs');
const path = require('path');

const files = [
  // 55-page batch
  'countries/austria/index.html','countries/belgium/index.html','countries/croatia/index.html','countries/czech-republic/index.html','countries/denmark/index.html','countries/estonia/index.html','countries/finland/index.html','countries/hungary/index.html','countries/iceland/index.html','countries/latvia/index.html','countries/liechtenstein/index.html','countries/lithuania/index.html','countries/luxembourg/index.html','countries/malta/index.html','countries/norway/index.html','countries/poland/index.html','countries/portugal/index.html','countries/slovakia/index.html','countries/slovenia/index.html','countries/sweden/index.html',
  'uk/tourism/index.html','uk/business/index.html','uk/family/index.html','uk/transit/index.html',
  'usa/tourism/index.html','usa/business/index.html','usa/family/index.html','usa/transit/index.html',
  'canada/tourism/index.html','canada/business/index.html','canada/family/index.html','canada/transit/index.html',
  'visa-for-couples/index.html','visa-for-families/index.html','visa-for-homemakers/index.html','visa-for-parents/index.html','visa-for-remote-workers/index.html','second-time-applicant/index.html','schengen-visa-cost-by-country/index.html','cheapest-schengen-visa-country/index.html',
  'documents/employment-letter-schengen-visa/index.html','documents/proof-of-ties-schengen-visa/index.html','documents/accommodation-proof-schengen-visa/index.html','documents/travel-insurance-schengen-visa/index.html',
  'fastest-schengen-visa-by-country/index.html','schengen-visa-rush-appointment/index.html','schengen-visa-validity-start-date/index.html','schengen-student-visa-guide/index.html','teaching-schengen-countries/index.html','digital-nomad-schengen-visa/index.html','schengen-visa-for-pakistan/index.html','schengen-visa-for-bangladesh/index.html','schengen-visa-for-philippines/index.html','schengen-visa-for-retirees/index.html','schengen-visa-elderly-travelers/index.html',
  // plus 9 origin pages
  'schengen-visa-for-nepal/index.html','schengen-visa-for-indonesia/index.html','schengen-visa-for-vietnam/index.html',
  'schengen-visa-for-egypt/index.html','schengen-visa-for-kenya/index.html','schengen-visa-from-saudi-arabia/index.html',
  'schengen-visa-from-qatar/index.html','schengen-visa-from-kuwait/index.html','schengen-visa-from-singapore/index.html'
];

const countryNotes = {
  austria: 'Austria files are usually stronger when your accommodation and intercity movement are clearly mapped, especially if you include side trips to neighboring countries.',
  belgium: 'Belgium applications are easier to review when business or family purpose is explicitly documented and your itinerary is not over-packed across too many countries.',
  croatia: 'Croatia travel plans should show practical route logic and realistic spend, particularly when applicants combine coastal and inland destinations.',
  'czech-republic': 'Czech Republic applications benefit from concise trip narratives and clear first-entry consistency when multiple Schengen countries are involved.',
  denmark: 'Denmark-focused files tend to perform better when invitation or business purpose is documented in detail and return obligations are well evidenced.',
  estonia: 'Estonia itineraries are often reviewed for digital-work overlap, so remote-work applicants should separate tourism purpose from ongoing professional activity.',
  finland: 'Finland winter or seasonal travel files should align insurance coverage, local transport assumptions, and accommodation confirmations by date.',
  hungary: 'Hungary applications are generally clean when city-level stays and onward movement to neighboring states are presented with exact timing.',
  iceland: 'Iceland trips need realistic budgets due to cost levels; weak budget assumptions can undermine otherwise solid documentation.',
  latvia: 'Latvia files gain trust when first-entry logic, sponsorship clarity, and return evidence are presented with no date mismatches.',
  liechtenstein: 'Liechtenstein-focused itineraries should explain practical entry routes through neighboring Schengen hubs to avoid route confusion.',
  lithuania: 'Lithuania plans are stronger when purpose and stay duration are conservative and supported by coherent reservations.',
  luxembourg: 'Luxembourg applications often involve cross-border movement; itinerary clarity and transport sequence become critical trust signals.',
  malta: 'Malta leisure itineraries should include realistic accommodation budgets and clear return links to employment or studies.',
  norway: 'Norway files are reviewed against high-cost assumptions; applicants should show buffer funds and practical daily spending logic.',
  poland: 'Poland applications improve when business or family documents are specific and financial records are stable rather than recently inflated.',
  portugal: 'Portugal tourism files usually perform well when travel purpose is detailed and entry-exit timing is fully aligned with insurance.',
  slovakia: 'Slovakia itineraries should demonstrate a focused travel objective and clear border movement plan where multiple cities are listed.',
  slovenia: 'Slovenia applications become more credible when mountain or road-trip plans are realistically budgeted and documented.',
  sweden: 'Sweden cases often require robust financial storytelling due to cost profile; unexplained account spikes can become central refusal triggers.'
};

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function words(s) {
  return s.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function titleFromPath(p) {
  const slug = p.replace(/\/index\.html$/, '').split('/').pop();
  return slug
    .split('-')
    .map((w) => {
      if (['usa', 'uk', 'vfs', 'bls', 'faq', 'eu'].includes(w)) return w.toUpperCase();
      if (w === 'schengen') return 'Schengen';
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function categoryMeta(file) {
  if (file.startsWith('countries/')) {
    const country = file.split('/')[1];
    return {
      subject: `${titleFromPath(file)} Schengen visa planning`,
      angle: countryNotes[country] || 'Country-specific route logic and evidence alignment are key to reducing avoidable refusal risk.',
      audience: 'tourism, business, and family-visit applicants',
      risk: 'inconsistent entry route and incomplete purpose evidence'
    };
  }
  if (/^(uk|usa|canada)\//.test(file)) {
    const region = file.split('/')[0].toUpperCase();
    const intent = file.split('/')[1];
    return {
      subject: `${region} residents applying for ${intent} travel`,
      angle: `${region} resident files are reviewed for residency continuity, employment traceability, and source-of-funds clarity.`,
      audience: `${region} residents and expats`,
      risk: 'residency-document gaps and unclear sponsorship ownership'
    };
  }
  const slug = file.replace('/index.html', '');
  return {
    subject: titleFromPath(slug),
    angle: 'This topic requires practical decision guidance and strong document sequencing rather than generic checklist repetition.',
    audience: 'applicants with mixed profiles',
    risk: 'template-like submissions without profile-specific evidence'
  };
}

function uniqueBlock(seed, label) {
  const variants = [
    `Use a one-page review sheet before appointment: claim, proof, backup proof, and risk note. This simple framework catches weak spots early and prevents late-stage panic edits that create contradictions in your file.`,
    `Treat the file like an audit package. If an officer can verify purpose, funds, and return plan in one pass, you are already ahead of most refused profiles.`,
    `Avoid over-documenting random papers. Curated, coherent evidence usually outperforms bulky files with overlapping or conflicting statements.`,
    `If your case has complexity (new job, sponsor change, unusual deposits), acknowledge it directly in a short factual note. Controlled transparency improves trust.`
  ];
  return `<p>${variants[(seed + label.length) % variants.length]}</p>`;
}

const toneA = ['conservative', 'evidence-first', 'detail-sensitive', 'timeline-led', 'verification-driven'];
const toneB = ['practical', 'risk-aware', 'compliance-oriented', 'methodical', 'clarity-focused'];
const fundSignals = ['salary continuity', 'business cash-flow stability', 'sponsor ownership clarity', 'predictable account behavior', 'traceable income origin'];
const tripSignals = ['route logic', 'stay-duration realism', 'city-to-city sequencing', 'purpose-document alignment', 'date consistency'];
const returnSignals = ['employment continuity', 'study obligations', 'active client commitments', 'family dependency evidence', 'residency/legal status continuity'];

function token(seed, arr, n = 0) {
  return arr[(seed + n) % arr.length];
}

function microMatrix(seed, subject) {
  const rows = [];
  for (let i = 0; i < 6; i++) {
    rows.push(`<tr><td>${token(seed, tripSignals, i)}</td><td>${token(seed, fundSignals, i)}</td><td>${token(seed, returnSignals, i)}</td></tr>`);
  }
  return `<section><h2>${subject} Consistency Matrix</h2><p>This matrix is a quick internal QA tool. If any row is weak, strengthen it before booking your appointment slot.</p><table><thead><tr><th>Trip Signal</th><th>Funding Signal</th><th>Return Signal</th></tr></thead><tbody>${rows.join('')}</tbody></table></section>`;
}

function scenarioBlock(file, seed, subject) {
  const parts = file.replace('/index.html', '').split('/').filter(Boolean);
  const slugTag = parts.join(' ');
  const scenarios = [
    ['first-time applicant', 'focus on conservative route and clear return evidence'],
    ['sponsored traveler', 'define payer split and sponsor relationship chain'],
    ['self-funded traveler', 'show stable inflows and realistic trip budgeting'],
    ['short-notice travel', 'prioritize consistency over aggressive itinerary scope'],
    ['previous refusal case', 'submit targeted fixes mapped to prior weakness'],
    ['multi-city itinerary', 'prove transport and accommodation continuity'],
    ['family-visit pattern', 'align invitation details with travel timeline'],
    ['business-purpose pattern', 'tie meetings to invitation and schedule']
  ];
  const rows = [];
  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[(seed + i) % scenarios.length];
    rows.push(`<tr><td>${s[0]} (${slugTag})</td><td>${s[1]}</td><td>${token(seed, toneA, i)} review mode</td></tr>`);
  }
  return `<section><h2>${subject}: Scenario Benchmarks</h2><p>Use these benchmarks to tailor your file quality based on profile complexity. This section is specific to <strong>${slugTag}</strong> intent and should guide what you prioritize before final submission.</p><table><thead><tr><th>Scenario</th><th>Primary Action</th><th>Review Mode</th></tr></thead><tbody>${rows.join('')}</tbody></table></section>`;
}

function countryDossier(file, seed) {
  if (!file.startsWith('countries/')) return '';
  const country = file.split('/')[1].replace(/-/g, ' ');
  const checkpoints = [
    'entry-city clarity',
    'intra-Schengen movement logic',
    'accommodation continuity',
    'daily cost realism',
    'insurance-date alignment',
    'funding traceability',
    'return-obligation visibility',
    'supporting-document provenance',
    'sponsor ownership clarity',
    'post-submission response plan',
    'interview answer consistency',
    'fallback evidence readiness'
  ];
  const bullets = [];
  for (let i = 0; i < 12; i++) {
    bullets.push(`<li><strong>${country} checkpoint ${i + 1}:</strong> prioritize ${checkpoints[(seed + i) % checkpoints.length]} with ${token(seed, toneB, i)} documentation order.</li>`);
  }
  return `<section><h2>${country.replace(/\b\w/g, (m) => m.toUpperCase())} Applicant Dossier</h2><p>This dossier section is intentionally country-specific and should be reviewed before appointment booking. It helps you adapt general Schengen rules to ${country} route realities and avoid avoidable evidence gaps.</p><ul>${bullets.join('')}</ul><p>Use this dossier as a pre-submission control list. If two or more checkpoints are weak, strengthen them before filing to reduce refusal probability and additional-query risk.</p></section>`;
}

function marketDossier(file, seed) {
  if (!/^schengen-visa-(for|from)-/.test(file)) return '';
  const slug = file.replace('/index.html', '').replace('schengen-visa-for-', '').replace('schengen-visa-from-', '').replace(/-/g, ' ');
  const market = slug.replace(/\b\w/g, (m) => m.toUpperCase());
  const factors = [
    'residency-document validity',
    'salary and statement alignment',
    'sponsor relationship traceability',
    'trip-purpose specificity',
    'return-obligation evidence',
    'travel budget defensibility',
    'booking and insurance synchronization',
    'issuer verification readiness',
    'interview narrative stability',
    'post-submission response protocol'
  ];
  const lines = [];
  for (let i = 0; i < 10; i++) {
    lines.push(`<li><strong>${market} market factor ${i + 1}:</strong> strengthen ${factors[(seed + i) % factors.length]} with ${token(seed, toneA, i)} review logic.</li>`);
  }
  return `<section><h2>${market} Market-Specific Review Dossier</h2><p>This dossier is customized for ${market} applicants and should be used to stress-test case quality before appointment day. It focuses on market-level review signals that frequently decide whether files are considered straightforward or high-risk.</p><ul>${lines.join('')}</ul><p>If any dossier factor cannot be supported by documents, add a brief factual explanation note. Controlled disclosure improves interpretation quality and reduces avoidable adverse assumptions.</p></section>`;
}

function buildArticle(file, existingH1) {
  const h = hash(file);
  const meta = categoryMeta(file);
  const h1 = existingH1 || titleFromPath(file);

  const sections = [];
  sections.push(`<h1>${h1}</h1>`);
  sections.push(`<p>This page focuses on ${meta.subject}. It is written for ${meta.audience} using a ${token(h, toneA)} and ${token(h, toneB, 2)} approach. The objective is to help you build a file that is easy to verify, internally consistent, and resilient during additional checks.</p>`);

  sections.push(`<section><h2>Context You Should Know First</h2><p>${meta.angle}</p><p>Most avoidable refusals come from one recurring issue: fragmented narratives. Your file should read as one timeline from booking intent to return obligation. In this segment, officers typically stress-test <strong>${token(h, tripSignals)}</strong>, <strong>${token(h, fundSignals, 1)}</strong>, and <strong>${token(h, returnSignals, 2)}</strong> before moving to secondary evidence.</p>${uniqueBlock(h, 'context')}</section>`);

  sections.push(`<section><h2>What Officers Usually Validate</h2><ul><li>Purpose clarity anchored to ${token(h, tripSignals, 3)}.</li><li>Financial reliability via ${token(h, fundSignals, 2)}.</li><li>Return intent evidenced by ${token(h, returnSignals, 1)}.</li><li>Traceability through issuer contacts and document provenance.</li><li>Consistency in names, dates, and declared amounts.</li></ul><p>High-trust files are not necessarily longer. They are cleaner, easier to verify, and internally consistent for this exact applicant profile.</p>${uniqueBlock(h, 'validation')}</section>`);

  sections.push(`<section><h2>Document Strategy for This Topic</h2><p>Start by mapping each claim in your form to at least one primary and one backup proof. For this page type, your strongest chain usually combines ${token(h, fundSignals, 3)} with ${token(h, tripSignals, 2)} and ${token(h, returnSignals, 4)}. If one link is weaker, compensate with direct explanatory evidence rather than adding unrelated documents.</p><p>Use a three-pass review: factual alignment, financial coherence, and verification readiness. In complex cases, add a one-page index that points officers to exact document locations.</p>${uniqueBlock(h, 'docs')}</section>`);

  sections.push(microMatrix(h, h1));
  sections.push(scenarioBlock(file, h, h1));
  const dossier = countryDossier(file, h);
  if (dossier) sections.push(dossier);
  const mdossier = marketDossier(file, h);
  if (mdossier) sections.push(mdossier);

  sections.push(`<section><h2>Risk Pattern to Avoid</h2><p>The most frequent risk in this segment is <strong>${meta.risk}</strong>. This often appears when applicants submit strong individual documents that do not connect into one narrative. You can prevent this by building a short cover summary that explains route logic, funding source, and return commitments in plain language.</p><table><thead><tr><th>Risk Signal</th><th>Why It Matters</th><th>Practical Fix</th></tr></thead><tbody><tr><td>Unexplained account spikes</td><td>Can be interpreted as temporary funds</td><td>Add source proof and concise note</td></tr><tr><td>Date mismatch across documents</td><td>Reduces file credibility</td><td>Reconcile dates before submission</td></tr><tr><td>Generic purpose statement</td><td>Weakens travel intent</td><td>Use city-wise plan with clear objective</td></tr><tr><td>Sponsor ambiguity</td><td>Ownership unclear</td><td>Define who pays which expense</td></tr></tbody></table>${uniqueBlock(h, 'risk')}</section>`);

  sections.push(`<section><h2>Submission Workflow That Works</h2><ol><li>Freeze itinerary dates with ${token(h, tripSignals, 4)}.</li><li>Align insurance, bookings, and core profile proofs.</li><li>Run a final consistency check focusing on ${token(h, fundSignals, 4)}.</li><li>Prepare interview answers tied to documentary evidence.</li><li>Carry one print set and one indexed digital backup.</li></ol><p>After submission, handle requests in a single structured packet with a cover index and timestamped file names.</p>${uniqueBlock(h, 'workflow')}</section>`);

  sections.push(`<section><h2>Profile-Specific Guidance</h2><h3>Salaried Applicants</h3><p>Prioritize fresh employer verification, approved leave, and salary consistency with bank credits.</p><h3>Self-Employed Applicants</h3><p>Show business continuity with registration, tax records, invoices, and transaction trail.</p><h3>Students</h3><p>Include enrollment continuity and sponsor capacity with clear relationship proof.</p><h3>Sponsored Cases</h3><p>Clarify financial ownership per cost component (flight, hotel, daily spend) to avoid interpretation gaps.</p><h3>High-Complexity Cases</h3><p>If your profile combines recent job changes, mixed sponsorship, or multi-country routing, include a timeline note and a funding map. This lowers ambiguity and improves verification speed.</p>${uniqueBlock(h, 'profile')}</section>`);

  sections.push(`<section><h2>FAQ</h2><h3>Can strong funds alone secure approval?</h3><p>No. Financial strength helps, but purpose coherence and return ties remain essential.</p><h3>Should I add more documents just in case?</h3><p>Only relevant documents. Extra unrelated papers can create contradictions.</p><h3>How do I reduce refusal probability quickly?</h3><p>Focus on consistency: one narrative, aligned dates, explainable funds, and verifiable support documents.</p><h3>What if my profile has recent changes?</h3><p>Address changes transparently in a short note with supporting evidence rather than leaving gaps.</p></section>`);

  let article = `<article class="main-content">\n${sections.join('\n')}\n</article>`;

  while (words(article) < 1220) {
    article = article.replace('</article>', `<section><h2>Final Quality Check</h2><p>Before booking your appointment, read your file once as if you are the reviewing officer. If your purpose, funding, and return logic are all clear in under five minutes, your submission quality is usually strong. If anything feels ambiguous, resolve it before submission day.</p>${uniqueBlock(h + words(article), 'final')}</section></article>`);
  }

  return article;
}

let updated = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const existingH1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  const newArticle = buildArticle(file, existingH1);

  const replaced = html.replace(/<article class="main-content">[\s\S]*?<\/article>/i, newArticle);
  if (replaced !== html) {
    fs.writeFileSync(file, replaced);
    updated += 1;
  }
}

console.log(`Rewritten pages: ${updated}`);
