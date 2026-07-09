const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://127.0.0.1:8081/product-detail.html?slug=trung-ga-ta', { waitUntil: 'networkidle0' });
  
  const rootHtml = await page.evaluate(() => document.getElementById('product-root')?.innerHTML || 'NOT FOUND');
  console.log('product-root html length:', rootHtml.length);
  if (rootHtml === 'NOT FOUND' || rootHtml.length < 50) {
     console.log('rootHtml:', rootHtml);
  }

  await browser.close();
})();
