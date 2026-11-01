import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\paans\\.gemini\\antigravity\\brain\\24bbcc85-3717-438d-885a-eedb2f06a3ea';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 393,
    height: 852,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // 1. Home
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, 'mobile_1_home.png') });

  // 2. Open Hamburger Menu
  const menuBtn = await page.$('header button[aria-label="Toggle navigation menu"]');
  if (menuBtn) {
    await menuBtn.tap();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(outDir, 'mobile_2_menu.png') });
    await menuBtn.tap();
    await new Promise((r) => setTimeout(r, 400));
  }

  // 3. Scroll to Projects
  const projectsEl = await page.$('#projects');
  if (projectsEl) {
    await projectsEl.scrollIntoView();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(outDir, 'mobile_3_projects.png') });
  }

  // 4. Testimonials modal
  const addFeedbackBtn = await page.$('#testimonials button.btn-sales');
  if (addFeedbackBtn) {
    await addFeedbackBtn.scrollIntoView();
    await new Promise((r) => setTimeout(r, 300));
    await addFeedbackBtn.tap();
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outDir, 'mobile_4_feedback_modal.png') });
    const closeBtn = await page.$('button[aria-label="Close"]');
    if (closeBtn) await closeBtn.tap();
    await new Promise((r) => setTimeout(r, 300));
  }

  // 5. Portfolio
  await page.goto('http://localhost:3000/portfolio/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, 'mobile_5_portfolio.png') });

  // 6. Calculator
  await page.goto('http://localhost:3000/calculator/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, 'mobile_6_calculator.png') });

  // 7. Contact
  await page.goto('http://localhost:3000/contact/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, 'mobile_7_contact.png') });

  // 8. Admin Gateway
  await page.goto('http://localhost:3000/admin/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, 'mobile_8_admin.png') });

  console.log('All screenshots captured successfully in artifact directory!');
  await browser.close();
}

capture().catch(console.error);

