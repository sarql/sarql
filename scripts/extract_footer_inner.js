const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

const footerPos = html.indexOf('<footer');
console.log('--- FOOTER INNER HTML ---');
console.log(html.substring(footerPos, footerPos + 3500));
