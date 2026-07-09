import { readFileSync } from 'fs';
const vouchers = JSON.parse(readFileSync('data/vouchers.json'));
const prioritized = ["WELCOME10", "FREESHIP", "SAVE30K", "PROTEIN20", "FRESH20", "NEWUSER20"];
const sorted = [...vouchers].sort((a, b) => {
  const ai = prioritized.indexOf(a.code);
  const bi = prioritized.indexOf(b.code);
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
});
console.log("Sorted length:", sorted.length);
try {
  const html = sorted.slice(0, 6).map((v) => {
    const discountLabel = v.discountType === "percent"
      ? ${v.discountValue}%
      : ${v.discountValue}d;
    return <div class="voucher-card" data-voucher-id=""></div>;
  }).join("");
  console.log("HTML length:", html.length);
} catch(e) {
  console.error(e);
}
