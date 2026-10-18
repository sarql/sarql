const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

const navPos = html.indexOf('<nav');
console.log('--- 600 chars before <nav ---');
console.log(html.substring(navPos - 600, navPos));
