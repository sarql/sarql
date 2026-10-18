const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

const h1Pos = html.indexOf('<h1');
const start = html.lastIndexOf('<div class="block-el block-el-title', h1Pos);
const end = html.indexOf('</section>', h1Pos) !== -1 ? html.indexOf('</section>', h1Pos) : h1Pos + 2000;

console.log('--- EXACT HERO BLOCK HTML ---');
console.log(html.substring(start, start + 1200));

// Also let's inspect the font size / line height of h1 and h2
const css = fs.readFileSync('src/app/globals.css', 'utf8');
console.log('--- CHECK GLOBALS CSS WALDENBURG ---');
const fontMatches = css.match(/font-family:.*Waldenburg/gi);
console.log('Font matches in css:', fontMatches);
