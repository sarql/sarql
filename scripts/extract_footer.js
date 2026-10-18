const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

const footer = html.match(/<footer[^>]*>[\s\S]*?<\/footer>/i);
if (footer) {
  console.log('--- FOOTER HTML EXTRACT ---');
  console.log(footer[0].substring(0, 1000));
}
