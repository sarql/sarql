const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

// Find all occurrences of Waldenburg in @media or root
const mediaWaldenburg = html.match(/@media[^{]+\{[^}]*--tw-font-size-6xl[^}]+\}/gi) || [];
console.log('Media for 6xl:', mediaWaldenburg);

// Let's inspect block-el-title HTML completely
const titleMatch = html.match(/<div class="block-el block-el-title block-in-view">([\s\S]*?)<\/div>\s*<div class="tracker-contextual-nav/i);
if (titleMatch) {
  console.log('--- FULL TITLE BLOCK HTML ---');
  console.log(titleMatch[1]);
}
