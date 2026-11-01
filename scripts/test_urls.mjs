import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage();
page.on('response', (res) => {
  if (res.status() === 429) {
    console.log('429 URL:', res.url());
  }
});
await page.goto('http://localhost:3000/portfolio/', { waitUntil: 'networkidle2' });
await browser.close();

