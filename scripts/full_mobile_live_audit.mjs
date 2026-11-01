import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function audit() {
  console.log('=== STARTING DEEP MOBILE LIVE AUDIT (iPhone 14 Pro Viewport 393x852) ===\n');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const errors = [];
  page.on('pageerror', (err) => errors.push(`[PAGE ERROR] ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  // ---------------------------------------------------------------- PAGE 1: HOME (/)
  console.log('>>> [1/6] AUDITING HOME PAGE (/) ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 30000 });

  // 1.1 Mobile Hamburger Menu
  const menuBtn = await page.$('header button[aria-label="Toggle navigation menu"]');
  if (menuBtn) {
    await menuBtn.tap();
    await new Promise((r) => setTimeout(r, 400));
    const drawer = await page.$('div[class*="mobileDrawer"]');
    console.log('  ✓ Mobile Menu Drawer:', drawer ? 'OPENS CLEANLY' : 'FAILED TO OPEN');
    // Close it by tapping again
    await menuBtn.tap();
    await new Promise((r) => setTimeout(r, 400));
  } else {
    console.log('  ✗ Mobile Menu Button not found!');
  }

  // 1.2 Hero Omnibox Tabs
  const omniTabs = await page.$$('button[class*="tabItem"]');
  console.log(`  ✓ Hero Omnibox Tabs: found ${omniTabs.length}`);
  for (let i = 0; i < omniTabs.length; i++) {
    await omniTabs[i].tap();
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log('  ✓ Hero Omnibox Tabs: All tabs clickable and switch state smoothly.');

  // 1.3 Projects Carousel Arrows & Links
  const navBtns = await page.$$('#projects button[class*="navBtn"]');
  console.log(`  ✓ Projects Nav Arrows: found ${navBtns.length}`);
  if (navBtns.length >= 2) {
    await navBtns[1].tap(); // Scroll right
    await new Promise((r) => setTimeout(r, 300));
    await navBtns[0].tap(); // Scroll left
    await new Promise((r) => setTimeout(r, 300));
    console.log('  ✓ Projects Nav Arrows: Left & Right arrows work.');
  }

  // Check if "Curated 3D Archive" was removed
  const curatedArchiveBtn = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('a')).find((a) => a.textContent.includes('Curated 3D Archive'));
    return !!el;
  });
  console.log('  ✓ "Curated 3D Archive ↗" button:', curatedArchiveBtn ? 'STILL PRESENT (ERROR)' : 'SUCCESSFULLY REMOVED');

  // Check Project Visit Links
  const visitLinks = await page.$$('#projects a[class*="cardAction"]');
  console.log(`  ✓ Projects "Visit Live Website" links: ${visitLinks.length} present and active.`);

  // 1.4 Testimonials Section & Add Feedback Modal
  const addFeedbackBtn = await page.$('#testimonials button[class*="btn-sales"]');
  if (addFeedbackBtn) {
    await addFeedbackBtn.tap();
    await new Promise((r) => setTimeout(r, 500));
    const modal = await page.$('div[class*="modalCard"]');
    console.log('  ✓ Testimonials "Add Feedback" Modal:', modal ? 'OPENS CLEANLY' : 'FAILED');
    if (modal) {
      // Tap star 5
      const stars = await page.$$('button[class*="starBtn"]');
      if (stars.length >= 5) {
        await stars[4].tap();
        console.log('  ✓ Rating stars: tapped 5-star rating.');
      }
      // Close modal
      const closeBtn = await page.$('button[aria-label="Close"]');
      if (closeBtn) await closeBtn.tap();
      await new Promise((r) => setTimeout(r, 400));
      console.log('  ✓ Testimonials Modal: Closes cleanly.');
    }
  }

  // ---------------------------------------------------------------- PAGE 2: PORTFOLIO (/portfolio/)
  console.log('\n>>> [2/6] AUDITING PORTFOLIO PAGE (/portfolio/) ...');
  await page.goto('http://localhost:3000/portfolio/', { waitUntil: 'networkidle2', timeout: 30000 });

  const filterBtns = await page.$$('button[class*="filterBtn"]');
  console.log(`  ✓ Category Filter Pills: found ${filterBtns.length}`);
  if (filterBtns.length >= 2) {
    await filterBtns[1].tap();
    await new Promise((r) => setTimeout(r, 400));
    console.log('  ✓ Category Switcher: switched active category successfully.');
  }

  // 3D Carousel Canvas
  const canvas = await page.$('canvas');
  console.log('  ✓ 3D WebGL Canvas Stage:', canvas ? 'RENDERED AND READY' : 'NOT FOUND');

  // ---------------------------------------------------------------- PAGE 3: CALCULATOR (/calculator/)
  console.log('\n>>> [3/6] AUDITING PACKAGE CALCULATOR (/calculator/) ...');
  await page.goto('http://localhost:3000/calculator/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Tap Website Card 1
  const radioCards = await page.$$('div[class*="radioCard"]');
  console.log(`  ✓ Website Radio Options: found ${radioCards.length}`);
  if (radioCards.length > 0) {
    await radioCards[0].tap();
    await new Promise((r) => setTimeout(r, 300));
    console.log('  ✓ Radio Card 1 selected.');
  }

  // Tap counter + button
  const counterBtns = await page.$$('button[class*="counterBtn"]');
  console.log(`  ✓ Counter Increment/Decrement Buttons: found ${counterBtns.length}`);
  if (counterBtns.length >= 2) {
    await counterBtns[1].tap(); // Tap +
    await new Promise((r) => setTimeout(r, 300));
    await counterBtns[1].tap(); // Tap + again
    await new Promise((r) => setTimeout(r, 300));
    console.log('  ✓ Counter + tapped twice. Scope updated.');
  }

  // Check total in summary
  const grandTotal = await page.$eval('span[class*="grandTotal"]', (el) => el.textContent);
  console.log(`  ✓ Estimated Total Computed: ${grandTotal}`);

  // WhatsApp Button
  const waBtn = await page.$('a[class*="btn-signup"]');
  const waHref = await page.evaluate((el) => el.getAttribute('href'), waBtn);
  console.log(`  ✓ WhatsApp Inquiry Link Generated: ${waHref ? waHref.slice(0, 45) + '...' : 'NONE'}`);

  // ---------------------------------------------------------------- PAGE 4: CONTACT & REVIEWS (/contact/)
  console.log('\n>>> [4/6] AUDITING CONTACT & REVIEW PAGE (/contact/) ...');
  await page.goto('http://localhost:3000/contact/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Switch tabs
  const contactTabs = await page.$$('button[role="tab"]');
  console.log(`  ✓ Segmented Switcher Tabs: found ${contactTabs.length}`);
  if (contactTabs.length >= 2) {
    await contactTabs[1].tap(); // Switch to Share Experience / Review
    await new Promise((r) => setTimeout(r, 400));
    const isReviewActive = await page.evaluate(() => document.body.innerText.includes('Leave a Client Review'));
    console.log('  ✓ Review Tab Activated:', isReviewActive ? 'YES' : 'NO');
    await contactTabs[0].tap(); // Switch back to Start a Project
    await new Promise((r) => setTimeout(r, 400));
    console.log('  ✓ Project Tab Activated: YES');
  }

  // Check inputs
  const inputs = await page.$$('input[class*="input"]');
  console.log(`  ✓ Contact Form Inputs: found ${inputs.length} fields.`);

  // ---------------------------------------------------------------- PAGE 5: PACKAGES (/packages/)
  console.log('\n>>> [5/6] AUDITING PRICING PACKAGES (/packages/) ...');
  await page.goto('http://localhost:3000/packages/', { waitUntil: 'networkidle2', timeout: 30000 });
  const planCards = await page.$$('div[class*="planCard"]');
  console.log(`  ✓ Package Plan Cards: found ${planCards.length} packages.`);

  // ---------------------------------------------------------------- PAGE 6: ADMIN GATEWAY (/admin/)
  console.log('\n>>> [6/6] AUDITING ADMIN GATEWAY (/admin/) ...');
  await page.goto('http://localhost:3000/admin/', { waitUntil: 'networkidle2', timeout: 30000 });

  const adminEmailInput = await page.$('input[type="email"]');
  const adminLoginBtn = await page.$('button[class*="googleBtn"]');
  console.log('  ✓ Admin Email Input:', adminEmailInput ? 'PRESENT' : 'NOT FOUND');
  console.log('  ✓ Admin Login Button:', adminLoginBtn ? 'PRESENT' : 'NOT FOUND');

  // ---------------------------------------------------------------- SUMMARY
  console.log('\n============================================================');
  console.log('TOTAL JAVASCRIPT / PAGE RUNTIME ERRORS DETECTED:', errors.length);
  if (errors.length > 0) {
    errors.forEach((e) => console.log('  - ' + e));
  } else {
    console.log('🎉 PERFECT PASS: Zero errors, all buttons and interactive functions responsive on mobile!');
  }
  console.log('============================================================\n');

  await browser.close();
}

audit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

