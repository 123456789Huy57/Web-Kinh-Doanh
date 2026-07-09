const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://127.0.0.1:8081/product-detail.html?slug=trung-ga-ta', { waitUntil: 'networkidle0' });
  
  const debug = await page.evaluate(async () => {
     return window.__DEBUG_PRODUCT_PAGE || 'NOT FOUND';
  });
  console.log('Debug result:', debug);
  await browser.close();
})();
