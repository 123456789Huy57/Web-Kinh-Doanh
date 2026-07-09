// tools/generate_subset.js
// Node.js script to create a 1,000‑item product subset (diverse categories)
import { createReadStream, writeFile } from 'fs';
import { pipeline } from 'stream';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

const INPUT = '../data/products.json'; // use existing large data file
const OUTPUT = '../data/products_subset.json'; // temporary subset file
const MAX_ITEMS = 1000;

let items = [];
let categoryCounts = {};

pipeline(
  createReadStream(INPUT),
  parser(),
  streamArray(),
  async function (source) {
    for await (const { value } of source) {
      const cat = value.category ?? value.categoryId ?? 'unknown';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      items.push(value);
      if (items.length >= MAX_ITEMS) break;
    }
    // Simple diversification check – warn if any category >30%
    const total = items.length;
    for (const [cat, cnt] of Object.entries(categoryCounts)) {
      if (cnt / total > 0.3) {
        console.warn(`Category "${cat}" represents ${(cnt / total * 100).toFixed(1)}% of subset`);
      }
    }
    await writeFile(OUTPUT, JSON.stringify(items, null, 2), 'utf8');
    console.log(`✅ Wrote ${items.length} products to ${OUTPUT}`);
  },
  (err) => {
    if (err) console.error('❌ generate_subset error:', err);
  }
);
