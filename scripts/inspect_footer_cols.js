const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

const footerPos = html.indexOf('<footer');
const endFooter = html.indexOf('</footer>', footerPos);
const footerContent = html.substring(footerPos, endFooter + 9);

// Find all headings or column titles in footer
const headings = footerContent.match(/<[^>]+class="[^"]*tw-type-[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi) || [];
console.log('--- ALL FOOTER ITEMS WITH TW-TYPE ---');
headings.slice(0, 30).forEach((h, i) => {
  const clean = h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log(`${i+1}: ${clean}`);
});
