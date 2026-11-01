import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const page = await browser.newPage();

  console.log('Navigating to calculator...');
  await page.goto('http://localhost:3000/calculator/', { waitUntil: 'networkidle2' });

  // Open modal via Edit Info or check if open
  await page.evaluate(() => {
    const editBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Edit Info'));
    if (editBtn) editBtn.click();
  });

  await new Promise(r => setTimeout(r, 600));

  const nameInput = await page.$('input[placeholder="e.g. Muhammed Ansar"]');
  const phoneInput = await page.$('input[placeholder="+91 98765 43210"]');

  if (nameInput) {
    // Clear and type
    await nameInput.click({ clickCount: 3 });
    await nameInput.type('Calc Live Ghost');
  }
  if (phoneInput) {
    await phoneInput.click({ clickCount: 3 });
    await phoneInput.type('9846112233');
  }

  console.log('Typed details. Waiting 2.2s for debounce capture...');
  await new Promise((r) => setTimeout(r, 2200));

  const savedLeads = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('sarql_leads') || '[]');
  });

  const foundLead = savedLeads.find(l => l.name === 'Calc Live Ghost');
  if (foundLead) {
    console.log('SUCCESS! Calculator partial lead captured:', foundLead);
  } else {
    console.log('All leads in CRM:', savedLeads);
    console.error('FAILED: Calculator partial lead was not captured.');
    process.exit(1);
  }

  await browser.close();
  console.log('TEST PASSED!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
