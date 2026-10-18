const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

const navPos = html.indexOf('<nav');
const openDiv = html.lastIndexOf('<div class="', navPos);
console.log('OPENING DIV BEFORE NAV:\n', html.substring(openDiv - 200, openDiv + 200));
