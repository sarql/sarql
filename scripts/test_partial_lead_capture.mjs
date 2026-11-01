import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  const page = await browser.newPage();
  
  // Track requests sent out to Google Sheets webhook
  const interceptedRequests = [];
  page.on('request', (req) => {
    if (req.url().includes('script.google.com')) {
      interceptedRequests.push({
        method: req.method(),
        postData: req.postData(),
      });
    }
  });

  console.log('Navigating to contact page...');
  await page.goto('http://localhost:3000/contact/', { waitUntil: 'networkidle2' });

  // Type into fields without submitting
  const nameInput = await page.$('input[placeholder="e.g. Muhammed Ansar"]');
  const phoneInput = await page.$('input[placeholder="+91 98765 43210"]');
  const companyInput = await page.$('input[placeholder="e.g. Acme Innovations"]');

  if (nameInput) await nameInput.type('Test Ghost Visitor');
  if (phoneInput) await phoneInput.type('9988776655');
  if (companyInput) await companyInput.type('Ghost Enterprises');

  console.log('Typed details. Waiting for 2s debounce auto-capture...');
  await new Promise((r) => setTimeout(r, 2200));

  // Check localStorage for the captured lead
  const savedLeads = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('sarql_leads') || '[]');
  });

  console.log('Saved Leads in CRM:', JSON.stringify(savedLeads, null, 2));

  const foundLead = savedLeads.find(l => l.name === 'Test Ghost Visitor');
  if (foundLead) {
    console.log('SUCCESS! Partial lead auto-captured into CRM:', foundLead);
  } else {
    console.error('FAILED: Partial lead was not captured.');
    process.exit(1);
  }

  console.log('Intercepted Google Sheets Webhook requests count:', interceptedRequests.length);
  if (interceptedRequests.length > 0) {
    console.log('Webhook payload dispatched:', interceptedRequests[0]);
  }

  await browser.close();
  console.log('TEST PASSED SUCCESSFULLY!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

