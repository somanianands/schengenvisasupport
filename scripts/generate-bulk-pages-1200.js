const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const today = '2026-03-09';

function titleCaseFromSlug(slug) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .replace('Czech Republic', 'Czech Republic')
    .replace('Usa', 'USA')
    .replace('Uk', 'UK');
}

function wordCount(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function baseHead({ title, description, canonical, ogImage }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="stylesheet" href="/css/main.css">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-16CJ2H74H1"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-16CJ2H74H1');</script>
</head>`;
}

function header() {
  return `<body>
<header>
  <div class="container">
    <div class="logo">
      <a href="/" style="display:inline-flex;align-items:center;gap:.75rem;text-decoration:none;">
        <img src="/images/logo.svg" alt="Schengen Visa Support" style="height:45px;width:45px;">
        <strong>Schengen Visa Support</strong>
      </a>
    </div>
    <nav>
      <ul>
        <li><a href="/visa-types/">Visa Types</a></li>
        <li><a href="/countries/">Countries</a></li>
        <li><a href="/documents/">Documents</a></li>
        <li><a href="/support/">Support</a></li>
        <li><a href="/blog/">Blog</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
    </nav>
    <button class="mobile-menu-toggle" aria-label="Menu" aria-expanded="false">☰</button>
  </div>
</header>`;
}

function footer() {
  return `<footer>
  <div class="container">
    <p style="text-align:center;">&copy; 2026 Schengen Visa Support. For educational guidance only. Always verify with official embassy or VFS/TLS sources.</p>
  </div>
</footer>
<script src="/js/main.js"></script>
</body>
</html>`;
}

function longCommonSections(params) {
  const {
    destination,
    applyFrom,
    dailyFunds,
    processing,
    specialNote,
    countryPath,
    extraInternal,
  } = params;

  return `
<section>
  <h2>Overview and Who This Guide Is For</h2>
  <p>This long-form guide is for applicants who want a realistic and document-first approach for a ${destination} Schengen visa application from ${applyFrom}. It is written for first-time and repeat applicants, including employed professionals, self-employed applicants, students, retirees, and sponsored travelers. The goal is simple: help you submit a clean file that matches your travel purpose, funding profile, and return-plan evidence.</p>
  <p>Many rejections happen because applicants focus only on forms and miss the consistency check that visa officers perform across itinerary, finances, ties to home country, and prior travel history. A strong file is coherent from start to finish. Your dates should align across flights and hotel bookings, your financial profile should support your plan, and your cover letter should explain the same story that your documents already prove.</p>
  <p>This page is intentionally detailed to reduce thin-content risk and to give you one place to review process, document quality checks, interview preparation, and rejection prevention. For official updates, always verify with embassy, consulate, or visa center notices in your jurisdiction.</p>
</section>

<section>
  <h2>Eligibility, Purpose, and Basic Rules</h2>
  <p>A short-stay Schengen visa generally allows up to 90 days in any rolling 180-day window. You should apply to the country where you will spend the most nights. If the stay is equal across multiple countries, apply to your first point of entry. This jurisdiction rule is one of the most common sources of avoidable refusal and should be resolved before appointment booking.</p>
  <p>You must also demonstrate genuine temporary intent. In practical terms, this means your employment, studies, business activity, family commitments, or property responsibilities indicate that you will return after your trip. Officers do not need one perfect document; they need a complete picture that makes sense.</p>
  <p>${specialNote}</p>
  <p>Biometrics are mandatory for most applicants and usually remain valid for a limited period depending on prior submissions and local rules. Even when biometrics are valid, consular authorities may still request attendance for clarification or additional documentation if the file has gaps.</p>
</section>

<section>
  <h2>Document Checklist With Quality Standards</h2>
  <p>Use this checklist as a quality framework, not just a list of file names. Each document should be current, legible, and internally consistent with your declared travel purpose.</p>
  <ul>
    <li>Application form signed and dated with no contradictory answers.</li>
    <li>Passport valid beyond return date with required blank pages.</li>
    <li>Recent photo matching Schengen photo specifications.</li>
    <li>Travel medical insurance valid for entire stay and Schengen-wide coverage.</li>
    <li>Flight booking or reservation aligned with itinerary dates.</li>
    <li>Accommodation proof for each destination segment.</li>
    <li>Bank statements showing stable balance and traceable inflow history.</li>
    <li>Employment proof, business proof, student letter, or retirement proof depending on profile.</li>
    <li>Cover letter that summarizes purpose, dates, funding source, and return ties.</li>
  </ul>
  <p>For funds, many applicants ask for a single number. A practical baseline for planning is around ${dailyFunds} per day, but officers review affordability in context. A clear savings pattern and realistic spend assumptions are stronger than last-minute deposits. If sponsored, include sponsor identity, relationship proof, and sponsor financial evidence with a signed sponsorship declaration.</p>
</section>

<section>
  <h2>Step-by-Step Application Workflow</h2>
  <ol>
    <li>Define route and purpose: tourism, business, family visit, event, or short training.</li>
    <li>Confirm correct jurisdiction and destination authority.</li>
    <li>Collect core documents and profile-specific evidence.</li>
    <li>Book appointment with appropriate center and keep proof of booking.</li>
    <li>Prepare a final consistency check packet before appointment day.</li>
    <li>Attend appointment on time with originals and copies where needed.</li>
    <li>Track status through official channel and respond quickly to requests.</li>
    <li>On decision, verify visa sticker details immediately.</li>
  </ol>
  <p>Expected processing in many cases is around ${processing}, but timelines vary with seasonality, local volumes, and whether further verification is needed. Do not make non-refundable commitments unless your risk tolerance is clear and your supplier terms allow changes.</p>
</section>

<section>
  <h2>Interview and Verification Preparation</h2>
  <p>Interviews are usually short and factual. Officers test consistency and credibility, not memorization. You should be ready to explain trip purpose, destination sequence, funding source, and reason for returning. Keep answers direct and avoid over-explaining. If you do not know an answer, state facts and refer to submitted documents.</p>
  <p>Common verification checks include employer authenticity, leave approval, sponsor relationship, prior refusal history, and itinerary feasibility. If any part of your profile is unusual, proactively explain it in the cover letter and support it with records.</p>
  <p>Applicants with prior refusals can still be approved with a corrected file. The best strategy is to map refusal grounds one by one, then submit focused evidence that addresses each ground. Do not refile the same package with cosmetic edits.</p>
</section>

<section>
  <h2>Common Refusal Triggers and How To Prevent Them</h2>
  <ul>
    <li>Purpose mismatch: itinerary, booking pattern, and letter do not align.</li>
    <li>Weak funds narrative: sudden credits and no spending logic.</li>
    <li>Insufficient ties: no clear reason to return after trip completion.</li>
    <li>Incomplete documents: missing pages, unsigned forms, outdated certificates.</li>
    <li>Risky travel design: multiple countries in very short duration with vague plan.</li>
    <li>Poor sponsor files: missing relationship and sponsor affordability proof.</li>
  </ul>
  <p>To reduce refusal risk, run a pre-submission audit two days before appointment. Compare every date, amount, and destination reference across your documents. A simple cross-check catches most avoidable problems.</p>
</section>

<section>
  <h2>After Approval: Practical Compliance</h2>
  <p>Check the visa validity period, number of entries, and maximum stay granted. Carry insurance and core documents during travel. At entry, border officers may still ask for accommodation and onward plan proof. Compliance during first entry supports stronger profile signals for future multi-entry requests.</p>
  <p>If travel plans change materially after visa issue, keep revised records and maintain a transparent trip history. Future applications benefit when your previous usage pattern looks consistent and lawful.</p>
</section>

<section>
  <h2>Useful Internal Resources</h2>
  <ul>
    <li><a href="/documents/">Documents hub</a></li>
    <li><a href="/processing-time/">Processing time guidance</a></li>
    <li><a href="/schengen-visa-fees/">Schengen fee overview</a></li>
    <li><a href="/visa-rejection-guide/">Rejection recovery guide</a></li>
    <li><a href="/appointment-booking/">Appointment booking guide</a></li>
    <li><a href="${countryPath}">Related destination page</a></li>
    ${extraInternal}
  </ul>
</section>

<section>
  <h2>FAQ</h2>
  <h3>How early should I apply?</h3>
  <p>Apply as early as your jurisdiction allows, generally several weeks before travel. Peak seasons require more buffer.</p>
  <h3>Do refundable bookings improve success?</h3>
  <p>They improve risk management and show planning quality, but approval still depends on full file consistency.</p>
  <h3>Is travel history mandatory?</h3>
  <p>No. First-time applicants can succeed with clear purpose, adequate funds, and strong ties.</p>
  <h3>Can I apply with a sponsor?</h3>
  <p>Yes, with complete sponsor documents, relationship proof, and an explanation of why sponsorship is needed.</p>
  <h3>What if processing exceeds expected timelines?</h3>
  <p>Use official tracking tools and avoid duplicate submissions unless authorities instruct otherwise.</p>
</section>`;
}

function buildPage({
  outputFile,
  title,
  description,
  canonical,
  ogImage,
  breadcrumbTitle,
  h1,
  intro,
  longSections,
}) {
  const html = `${baseHead({ title, description, canonical, ogImage })}
${header()}
<nav class="breadcrumb"><div class="container"><ol><li><a href="/">Home</a></li><li>${breadcrumbTitle}</li></ol></div></nav>
<main id="main-content">
  <div class="container">
    <div class="content-wrapper">
      <article class="main-content">
        <h1>${h1}</h1>
        <p class="meta"><time datetime="${today}">Updated: March 9, 2026</time> · Long-form guide</p>
        <div class="intro"><p>${intro}</p></div>
        <div class="important-box"><strong>Important:</strong> This is an educational guide. Official instructions from the embassy, consulate, VFS, or TLS for your jurisdiction take precedence.</div>
        ${longSections}
      </article>
    </div>
  </div>
</main>
${footer()}`;

  let finalHtml = html;
  while (wordCount(finalHtml) < 1200) {
    finalHtml = finalHtml.replace(
      '</article>',
      '<section><h2>Additional Practical Notes</h2><p>Before submission, prepare a one-page timeline listing appointment date, travel date, insurance coverage dates, hotel check-in range, and employer leave window. This simple internal checklist prevents date mismatch errors that are common in refusals. Keep digital copies of every document and retain courier receipts, payment proof, and appointment confirmations for audit and follow-up.</p><p>If your profile changed recently, such as job switch, salary change, or address update, provide supporting documents and explain the transition briefly in your cover letter. Transparency reduces ambiguity. A clear and verifiable file is stronger than a minimal file.</p></section></article>'
    );
  }

  ensureDirForFile(outputFile);
  fs.writeFileSync(outputFile, finalHtml);
}

const countryPages = [
  'austria', 'belgium', 'croatia', 'czech-republic', 'denmark', 'estonia', 'finland', 'hungary',
  'latvia', 'lithuania', 'luxembourg', 'malta', 'norway', 'poland', 'portugal', 'slovakia',
  'slovenia', 'sweden', 'iceland', 'liechtenstein'
];

countryPages.forEach((slug) => {
  const country = titleCaseFromSlug(slug);
  const outputFile = path.join(root, 'countries', slug, 'index.html');
  const canonical = `https://schengenvisasupport.com/countries/${slug}/`;
  buildPage({
    outputFile,
    title: `${country} Schengen Visa 2026 | Requirements, Documents, Processing`,
    description: `Complete ${country} Schengen visa guide for 2026 with requirements, documents, fees, processing expectations, and approval tips for stronger applications.`,
    canonical,
    ogImage: `https://schengenvisasupport.com/images/schengen_visa_${slug}.png`,
    breadcrumbTitle: `${country} Guide`,
    h1: `${country} Schengen Visa Guide 2026`,
    intro: `Planning a trip where ${country} is your main Schengen destination? This in-depth page explains the full visa workflow, document quality checks, and refusal prevention strategy so you can submit a complete and credible application file.`,
    longSections: longCommonSections({
      destination: country,
      applyFrom: 'your current country of residence',
      dailyFunds: 'EUR 70 to EUR 120 depending on profile and itinerary complexity',
      processing: '15 calendar days, with possible extension during peaks',
      specialNote: `${country} authorities generally evaluate purpose clarity and financial credibility together. If your itinerary includes multiple Schengen countries, show why ${country} is your main destination by nights and core activities.`,
      countryPath: '/countries/',
      extraInternal: '<li><a href="/which-country-easiest-schengen-visa/">Country selection guide</a></li>'
    })
  });
});

const residentPages = [
  {
    region: 'uk',
    kind: 'tourism',
    label: 'Tourist Visa From UK',
    intro: 'This page is for UK residents planning tourism travel to the Schengen area and wanting a complete preparation framework before booking appointments.',
  },
  {
    region: 'uk',
    kind: 'business',
    label: 'Business Visa From UK',
    intro: 'This page helps UK-based professionals prepare short-stay Schengen business visa files with invitation, employer proof, and trip-purpose alignment.',
  },
  {
    region: 'uk',
    kind: 'family',
    label: 'Family Visit Visa From UK',
    intro: 'This page explains Schengen family visit applications from the UK with host documents, relationship proof, and sponsorship quality checks.',
  },
  {
    region: 'uk',
    kind: 'transit',
    label: 'Transit Visa From UK',
    intro: 'This page clarifies airport and short transit visa requirements for UK residents, including route logic and supporting evidence expectations.',
  },
  {
    region: 'usa',
    kind: 'tourism',
    label: 'Tourist Visa From USA',
    intro: 'This long-form guide supports US residents preparing Schengen tourist visa applications with clear funding, itinerary, and return-ties evidence.',
  },
  {
    region: 'usa',
    kind: 'business',
    label: 'Business Visa From USA',
    intro: 'This page is for US-based business travelers applying for short Schengen trips with invitations, conference proof, and employer support letters.',
  },
  {
    region: 'usa',
    kind: 'family',
    label: 'Family Visit Visa From USA',
    intro: 'This page details how US residents can prepare a robust Schengen family visit application, including sponsor and host document standards.',
  },
  {
    region: 'usa',
    kind: 'transit',
    label: 'Transit Visa From USA',
    intro: 'This page explains Schengen transit routes from the USA, when transit visas are needed, and how to document onward travel correctly.',
  },
  {
    region: 'canada',
    kind: 'tourism',
    label: 'Tourist Visa From Canada',
    intro: 'This guide helps Canada residents apply for Schengen tourism visas with strong documentation, clean timelines, and practical compliance checks.',
  },
  {
    region: 'canada',
    kind: 'business',
    label: 'Business Visa From Canada',
    intro: 'This page supports business visa preparation from Canada, including corporate letters, invitation design, and trip-value explanation.',
  },
  {
    region: 'canada',
    kind: 'family',
    label: 'Family Visit Visa From Canada',
    intro: 'This page explains family-visit Schengen visa files from Canada, with focus on relationship evidence and sponsor affordability.',
  },
  {
    region: 'canada',
    kind: 'transit',
    label: 'Transit Visa From Canada',
    intro: 'This page covers Schengen transit applications from Canada with route eligibility, timing, and documentary proof requirements.',
  }
];

residentPages.forEach((item) => {
  const regionUpper = item.region.toUpperCase();
  const outputFile = path.join(root, item.region, item.kind, 'index.html');
  const canonical = `https://schengenvisasupport.com/${item.region}/${item.kind}/`;
  buildPage({
    outputFile,
    title: `Schengen ${item.label} 2026 | Complete Preparation Guide`,
    description: `Detailed Schengen ${item.kind} visa guide for applicants from the ${regionUpper}. Requirements, documents, processing workflow, and rejection prevention steps.`,
    canonical,
    ogImage: `https://schengenvisasupport.com/images/schengen_visa_${item.region}-${item.kind}.png`,
    breadcrumbTitle: `${regionUpper} ${titleCaseFromSlug(item.kind)}`,
    h1: `Schengen ${item.label} 2026`,
    intro: item.intro,
    longSections: longCommonSections({
      destination: 'the Schengen area',
      applyFrom: regionUpper,
      dailyFunds: 'EUR 70 to EUR 120 equivalent per day depending on destination and profile',
      processing: 'about 15 calendar days in standard periods',
      specialNote: `Applicants from ${regionUpper} should pay close attention to legal residence proof, local visa-center jurisdiction, and destination-specific booking channels because these vary by member state.`,
      countryPath: '/countries/',
      extraInternal: `<li><a href="/${item.region}/">${regionUpper} visa-center hub</a></li>`
    })
  });
});

const audiencePages = [
  { slug: 'visa-for-couples', h1: 'Schengen Visa for Couples 2026' },
  { slug: 'visa-for-parents', h1: 'Schengen Visa for Parents 2026' },
  { slug: 'visa-for-homemakers', h1: 'Schengen Visa for Homemakers 2026' },
  { slug: 'visa-for-families', h1: 'Schengen Visa for Families 2026' },
  { slug: 'visa-for-remote-workers', h1: 'Schengen Visa for Remote Workers 2026' },
  { slug: 'second-time-applicant', h1: 'Second-Time Schengen Applicant Guide 2026' },
  { slug: 'schengen-visa-cost-by-country', h1: 'Schengen Visa Cost by Country 2026' },
  { slug: 'cheapest-schengen-visa-country', h1: 'Cheapest Schengen Visa Country Guide 2026' }
];

audiencePages.forEach((item) => {
  const titleName = titleCaseFromSlug(item.slug);
  const outputFile = path.join(root, item.slug, 'index.html');
  const canonical = `https://schengenvisasupport.com/${item.slug}/`;
  buildPage({
    outputFile,
    title: `${item.h1} | Full Requirements and Strategy`,
    description: `Detailed ${titleName} guide with documents, processing strategy, financial planning, and refusal prevention for 2026 applicants.`,
    canonical,
    ogImage: `https://schengenvisasupport.com/images/schengen_visa_${item.slug}.png`,
    breadcrumbTitle: titleName,
    h1: item.h1,
    intro: `This page is designed for applicants specifically searching for ${titleName.toLowerCase()} guidance and includes a full-length, practical process that prioritizes document quality and approval readiness.`,
    longSections: longCommonSections({
      destination: 'your selected Schengen destination',
      applyFrom: 'your country of residence',
      dailyFunds: 'destination-adjusted daily baseline with additional safety buffer',
      processing: 'approximately 15 days, with possible peaks and verification delays',
      specialNote: `For ${titleName.toLowerCase()}, context matters. Officers evaluate whether your declared scenario is supported by objective evidence and a coherent timeline.`,
      countryPath: '/countries/',
      extraInternal: '<li><a href="/faq/">Frequently asked questions hub</a></li>'
    })
  });
});

console.log('Generated pages:', countryPages.length + residentPages.length + audiencePages.length);
