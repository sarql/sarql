import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testAdmin() {
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
  page.on('pageerror', (err) => errors.push(`Page Error: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`Console Error: ${msg.text()}`);
  });

  console.log('Navigating to http://localhost:3000/admin/ ...');
  await page.goto('http://localhost:3000/admin/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Check Gatekeeper
  const emailInput = await page.$('input[type="email"]');
  const submitBtn = await page.$('button[type="submit"]');

  console.log('Email input exists?', !!emailInput);
  console.log('Submit button exists?', !!submitBtn);

  if (emailInput && submitBtn) {
    console.log('Typing team.sarql@gmail.com into email input...');
    await emailInput.type('team.sarql@gmail.com');
    console.log('Tapping Send One-Time Login Code button...');
    await submitBtn.tap();
    await new Promise((r) => setTimeout(r, 1500));

    // Check if OTP step appeared or error
    const otpInput = await page.$('input[class*="otpInput"]');
    console.log('OTP input appeared?', !!otpInput);

    const errorMsg = await page.$('div[class*="authAlertError"]');
    if (errorMsg) {
      const text = await page.evaluate((el) => el.textContent, errorMsg);
      console.log('Auth alert on page:', text);
    }
  }

  // Now let's test if already logged in by setting localStorage:
  console.log('\nTesting logged-in admin dashboard on mobile...');
  await page.evaluate(() => {
    localStorage.setItem('sarql_admin_user', JSON.stringify({ email: 'team.sarql@gmail.com', name: 'SARQL' }));
  });
  await page.reload({ waitUntil: 'networkidle2' });

  // Check admin dashboard tabs
  const tabBtns = await page.$$('button[class*="tabBtn"]');
  console.log(`Found ${tabBtns.length} admin dashboard tabs:`);
  for (const btn of tabBtns) {
    const text = await page.evaluate((el) => el.textContent, btn);
    console.log(`  - Tab: ${text.trim()}`);
  }

  // Check Settings / Access Control tab
  if (tabBtns.length >= 4) {
    console.log('Tapping Settings tab (Tab 4)...');
    await tabBtns[3].tap();
    await new Promise((r) => setTimeout(r, 600));

    const whitelistCard = await page.evaluate(() => {
      return document.body.innerText.includes('Authorized Gmail Whitelist');
    });
    console.log('Authorized Gmail Whitelist visible?', whitelistCard);
  }

  // Check CRM tab
  if (tabBtns.length >= 2) {
    console.log('Tapping CRM tab (Tab 2)...');
    await tabBtns[1].tap();
    await new Promise((r) => setTimeout(r, 600));

    const subTabs = await page.$$('button[class*="subTabBtn"]');
    console.log(`Found ${subTabs.length} CRM sub-tabs.`);
  }

  // Check Drive / Portfolio tab
  if (tabBtns.length >= 3) {
    console.log('Tapping Portfolio / Drive tab (Tab 3)...');
    await tabBtns[2].tap();
    await new Promise((r) => setTimeout(r, 600));

    const categoryList = await page.evaluate(() => {
      return document.body.innerText.includes('Active Categories');
    });
    console.log('Active Categories visible?', categoryList);
  }

  console.log('\n--- Error Summary for Admin ---');
  if (errors.length === 0) {
    console.log('ZERO errors on Admin on mobile!');
  } else {
    console.log(`Found ${errors.length} errors:`);
    errors.forEach((e) => console.log('  - ' + e));
  }

  await browser.close();
}

testAdmin().catch(console.error);
