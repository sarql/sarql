import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\paans\\.gemini\\antigravity\\brain\\24bbcc85-3717-438d-885a-eedb2f06a3ea';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 393, height: 852, isMobile: true, hasTouch: true },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/calculator/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 600));

  // Check if client modal is present
  const startBtn = await page.$('button[type="submit"]');
  if (startBtn) {
    const nameInput = await page.$('input[placeholder="e.g. Muhammed Ansar"]');
    if (nameInput) await nameInput.type('Ansar Test');
    const phoneInput = await page.$('input[placeholder="+91 98765 43210"]');
    if (phoneInput) await phoneInput.type('9876543210');
    await startBtn.click();
    await new Promise((r) => setTimeout(r, 800));
  }

  // Click on the first radioCard (Basic Website)
  const clicked = await page.evaluate(() => {
    const card = document.querySelector('[class*="radioCard"]');
    if (card) {
      card.click();
      return true;
    }
    return false;
  });
  console.log('Radio card clicked:', clicked);

  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'calc_mobile_minimized_real.png') });
  console.log('Saved calc_mobile_minimized_real.png');

  // Click on mobile expand button
  const expandClicked = await page.evaluate(() => {
    const btn = document.querySelector('[class*="mobileExpandBtn"]');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Expand button clicked:', expandClicked);

  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'calc_mobile_expanded_real.png') });
  console.log('Saved calc_mobile_expanded_real.png');

  await browser.close();
}

run().catch(console.error);

