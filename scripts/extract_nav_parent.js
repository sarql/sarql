const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

const navItemPos = html.indexOf('class="nav-topbar-item"');
console.log('--- NAV TOPBAR ITEM PARENT ---');
console.log(html.substring(navItemPos - 500, navItemPos));
