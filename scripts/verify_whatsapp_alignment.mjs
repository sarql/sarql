import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\paans\\.gemini\\antigravity\\brain\\24bbcc85-3717-438d-885a-eedb2f06a3ea';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();

  // 1. Packages page with floating contact speed dial open
  await page.goto('http://localhost:3000/packages/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const btn = document.querySelector('button[title*="Contact"]') || document.querySelector('button[aria-label*="contact"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'verify_whatsapp_widget_fix.png') });
  console.log('Saved verify_whatsapp_widget_fix.png');

  // 2. Contact page with direct WhatsApp links & button
  await page.goto('http://localhost:3000/contact/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'verify_whatsapp_contact_fix.png') });
  console.log('Saved verify_whatsapp_contact_fix.png');

  // 3. Calculator page with WhatsApp button
  await page.goto('http://localhost:3000/calculator/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    // Fill client info if needed
    const radio = document.querySelector('[class*="radioCard"]');
    if (radio) radio.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'verify_whatsapp_calc_fix.png') });
  console.log('Saved verify_whatsapp_calc_fix.png');

  await browser.close();
}

run().catch(console.error);

