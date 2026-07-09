const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  page.on('response', response => {
      if (!response.ok()) console.log('RESPONSE 404:', response.url());
  });

  await page.goto('http://127.0.0.1:8081/product-detail.html?slug=trung-ga-ta', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
