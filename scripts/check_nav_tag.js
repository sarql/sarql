const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

const navPos = html.indexOf('class="nav-topbar-item"');
console.log('CONTAINER BEFORE NAV:\n', html.substring(navPos - 120, navPos + 50));
