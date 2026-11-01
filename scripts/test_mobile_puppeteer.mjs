import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTest() {
  console.log('Launching headless Chrome with mobile viewport...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  
  // Emulate iPhone 14 Pro
  await page.setViewport({
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    } else {
      console.log(`[Browser ${msg.type()}] ${msg.text()}`);
    }
  });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('Page loaded successfully.');

  // Test 1: Header hamburger menu
  console.log('\n--- Testing Mobile Hamburger Menu ---');
  const menuBtn = await page.$('header button[aria-label="Toggle navigation menu"]');
  if (menuBtn) {
    console.log('Found hamburger menu button. Tapping it...');
    await menuBtn.tap();
    await new Promise((r) => setTimeout(r, 600));

    const drawer = await page.$('div[class*="mobileDrawer"]');
    if (drawer) {
      console.log('SUCCESS: Mobile drawer opened!');
      const drawerLinks = await drawer.$$('a');
      console.log(`Found ${drawerLinks.length} links inside drawer.`);
    } else {
      console.log('FAILURE: Mobile drawer did not open on tap!');
    }
  } else {
    console.log('FAILURE: Hamburger button not found!');
  }

  // Test 2: Hero tabs
  console.log('\n--- Testing Hero Omnibox Tabs ---');
  const heroTabs = await page.$$('button[class*="tabItem"]');
  console.log(`Found ${heroTabs.length} hero tabs.`);
  if (heroTabs.length >= 2) {
    console.log('Tapping tab 2...');
    await heroTabs[1].tap();
    await new Promise((r) => setTimeout(r, 400));
    console.log('Tab 2 tapped.');
  }

  // Test 3: Live Projects Carousel
  console.log('\n--- Testing Projects Carousel on Mobile ---');
  const projectCards = await page.$$('article[class*="card"]');
  console.log(`Found ${projectCards.length} project cards.`);
  const projectActionLinks = await page.$$('a[class*="cardAction"]');
  console.log(`Found ${projectActionLinks.length} "Visit Live Website" links.`);
  if (projectActionLinks.length > 0) {
    const href = await page.evaluate((el) => el.getAttribute('href'), projectActionLinks[0]);
    console.log(`First project action link href: ${href}`);
  }

  // Test 4: Testimonials modal
  console.log('\n--- Testing Testimonials "Add Feedback" button ---');
  const feedbackBtn = await page.$('#testimonials button.btn-sales');
  if (feedbackBtn) {
    console.log('Found "Add Feedback" button. Tapping it...');
    await feedbackBtn.tap();
    await new Promise((r) => setTimeout(r, 600));

    const modal = await page.$('div[class*="modalCard"]');
    if (modal) {
      console.log('SUCCESS: Feedback modal opened!');
      const closeBtn = await page.$('button[aria-label="Close"]');
      if (closeBtn) {
        console.log('Tapping close button on modal...');
        await closeBtn.tap();
        await new Promise((r) => setTimeout(r, 400));
      }
    } else {
      console.log('FAILURE: Feedback modal did not open!');
    }
  } else {
    console.log('Notice: Could not find #testimonials button.btn-sales');
  }

  // Test 5: Check errors
  console.log('\n--- Error Summary ---');
  if (errors.length === 0) {
    console.log('ZERO JavaScript or console errors found on mobile!');
  } else {
    console.log(`Found ${errors.length} errors:`);
    errors.forEach((e) => console.log('  - ' + e));
  }

  await browser.close();
  console.log('\nTest completed.');
}

runTest().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});

