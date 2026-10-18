const fs = require('fs');
const html = fs.readFileSync('refrence/elevenlabs.io/index.html', 'utf8');

const rules = [
  'tw-type-6xl',
  'tw-type-base',
  'tw-text-balance',
  'tw-text-pretty',
  'tw-table',
  'tw-order-last'
];

rules.forEach(r => {
  const reg = new RegExp('\\.' + r.replace(/[:\[\]\/]/g, '\\$&') + '\\s*\\{([^}]+)\\}', 'i');
  const m = html.match(reg);
  console.log(r, '=>', m ? m[0] : 'not found');
});
