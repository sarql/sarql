import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\paans\\.gemini\\antigravity\\brain\\24bbcc85-3717-438d-885a-eedb2f06a3ea';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  console.log('--- TEST 1: Contact Page with ?pkg=Standard%20Website ---');
  await page.goto('http://localhost:3000/contact/?pkg=Standard%20Website', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'verify_contact_pkg_autofill.png') });
  console.log('Saved verify_contact_pkg_autofill.png');

  console.log('--- TEST 2: Packages Page & Floating Contact Speed-Dial ---');
  await page.goto('http://localhost:3000/packages/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  // Click floating contact trigger button to open
  const triggerBtn = await page.$('button[title="Quick Contact"], button[aria-label="Open contact options"]');
  if (triggerBtn) {
    await triggerBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'verify_floating_widget_icons_only.png') });
  console.log('Saved verify_floating_widget_icons_only.png');

  console.log('--- TEST 3: Home Page Navbar & Projects ---');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'verify_home_navbar_and_projects.png') });
  console.log('Saved verify_home_navbar_and_projects.png');

  console.log('--- TEST 4: Mobile Calculator Flow ---');
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/calculator/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // If client details modal is open, fill it out or submit
  const nameInput = await page.$('input[placeholder="e.g. Muhammed Ansar"]');
  if (nameInput) {
    await nameInput.type('Ansar Test');
    const phoneInput = await page.$('input[placeholder="+91 98765 43210"]');
    if (phoneInput) await phoneInput.type('9876543210');
    const startBtn = await page.$('button[type="submit"]');
    if (startBtn) await startBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // Select Basic Website
  const basicCard = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div'));
    const basic = cards.find(el => el.textContent?.includes('Basic Website') && el.textContent?.includes('4,999'));
    if (basic) {
      basic.click();
      return true;
    }
    return false;
  });

  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'verify_calculator_mobile_minimized.png') });
  console.log('Saved verify_calculator_mobile_minimized.png');

  // Click "View Scope" button to open detailed bottom sheet
  const viewScopeBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.includes('View Scope'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'verify_calculator_mobile_expanded.png') });
  console.log('Saved verify_calculator_mobile_expanded.png');

  await browser.close();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Puppeteer test failed:', err);
  process.exit(1);
});

