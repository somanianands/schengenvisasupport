const fs = require('fs');

const newPages = [
  { url: '/documents/employment-letter-schengen-visa/', priority: '0.75', changefreq: 'monthly' },
  { url: '/documents/proof-of-ties-schengen-visa/', priority: '0.75', changefreq: 'monthly' },
  { url: '/documents/accommodation-proof-schengen-visa/', priority: '0.75', changefreq: 'monthly' },
  { url: '/documents/travel-insurance-schengen-visa/', priority: '0.75', changefreq: 'monthly' },
  { url: '/fastest-schengen-visa-by-country/', priority: '0.74', changefreq: 'monthly' },
  { url: '/schengen-visa-rush-appointment/', priority: '0.74', changefreq: 'monthly' },
  { url: '/schengen-visa-validity-start-date/', priority: '0.74', changefreq: 'monthly' },
  { url: '/schengen-student-visa-guide/', priority: '0.73', changefreq: 'monthly' },
  { url: '/teaching-schengen-countries/', priority: '0.73', changefreq: 'monthly' },
  { url: '/digital-nomad-schengen-visa/', priority: '0.72', changefreq: 'monthly' },
  { url: '/schengen-visa-for-pakistan/', priority: '0.72', changefreq: 'monthly' },
  { url: '/schengen-visa-for-bangladesh/', priority: '0.72', changefreq: 'monthly' },
  { url: '/schengen-visa-for-philippines/', priority: '0.72', changefreq: 'monthly' },
  { url: '/schengen-visa-for-retirees/', priority: '0.71', changefreq: 'monthly' },
  { url: '/schengen-visa-elderly-travelers/', priority: '0.71', changefreq: 'monthly' }
];

let output = '';
newPages.forEach(page => {
  output += `  <url>
    <loc>https://schengenvisasupport.com${page.url}</loc>
    <lastmod>2026-03-09</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
});

console.log(output);
