const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

const pos = html.indexOf('tw-rounded-t-3xl');
if (pos !== -1) {
  console.log('--- FOUND ROUNDED T 3XL ---');
  console.log(html.substring(pos - 100, pos + 800));
}
