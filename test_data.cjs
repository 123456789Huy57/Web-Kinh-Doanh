const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:8081/product-detail.html?slug=trung-ga-ta', { waitUntil: 'networkidle0' });
  
  const test = await page.evaluate(async () => {
     const resp = await fetch('./data/products.json');
     const data = await resp.json();
     const product = data.find(p => p.slug === 'trung-ga-ta');
     return {
        total: data.length,
        hasSlugField: 'slug' in data[0],
        foundProduct: !!product,
        firstSlug: data[0].slug
     };
  });
  console.log('Test result:', test);
  await browser.close();
})();
