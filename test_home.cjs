const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://127.0.0.1:8081/index.html', { waitUntil: 'networkidle0' });
  
  const content = await page.evaluate(() => document.querySelector('.page-error')?.innerText || 'NO ERROR');
  console.log('Error block:', content);
  
  await browser.close();
})();
