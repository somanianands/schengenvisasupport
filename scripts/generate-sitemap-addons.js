const fs = require('fs');
const path = require('path');

// Sitemap entries for newly generated pages
const newPages = [
  // New country pages
  'austria', 'belgium', 'croatia', 'czech-republic', 'denmark', 'estonia', 'finland', 'hungary',
  'latvia', 'lithuania', 'luxembourg', 'malta', 'norway', 'poland', 'portugal', 'slovakia',
  'slovenia', 'sweden', 'iceland', 'liechtenstein'
].map(slug => ({
  url: `https://schengenvisasupport.com/countries/${slug}/`,
  priority: 0.8
}));

// UK regional pages
const ukRegions = ['tourism', 'business', 'family', 'transit'];
ukRegions.forEach(kind => {
  newPages.push({
    url: `https://schengenvisasupport.com/uk/${kind}/`,
    priority: 0.75
  });
});

// USA regional pages
const usaRegions = ['tourism', 'business', 'family', 'transit'];
usaRegions.forEach(kind => {
  newPages.push({
    url: `https://schengenvisasupport.com/usa/${kind}/`,
    priority: 0.75
  });
});

// Canada regional pages (new region)
const canadaRegions = ['tourism', 'business', 'family', 'transit'];
canadaRegions.forEach(kind => {
  newPages.push({
    url: `https://schengenvisasupport.com/canada/${kind}/`,
    priority: 0.75
  });
});

// Audience/intent pages
const audiencePages = [
  'visa-for-couples', 'visa-for-parents', 'visa-for-homemakers', 'visa-for-families',
  'visa-for-remote-workers', 'second-time-applicant', 'schengen-visa-cost-by-country',
  'cheapest-schengen-visa-country'
];
audiencePages.forEach(slug => {
  newPages.push({
    url: `https://schengenvisasupport.com/${slug}/`,
    priority: 0.7
  });
});

// Generate XML entries
const xmlEntries = newPages.map(page => 
  `  <url>
    <loc>${page.url}</loc>
    <lastmod>2026-03-09</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
  </url>`
).join('\n');

console.log(xmlEntries);
console.log('\nTotal new pages:', newPages.length);
