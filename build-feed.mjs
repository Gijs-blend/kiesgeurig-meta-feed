// Bouwt een Meta-catalogusfeed (CSV) uit de openbare Shopify products.json van kiesgeurig.nl.
// ID-formaat shopify_ZZ_<productId>_<variantId> = gelijk aan content_ids van de Meta-pixel
// (custom pixel "GTM" in Shopify) en aan Merchant Center.
import { writeFileSync, mkdirSync } from 'node:fs';

const SHOP = 'https://kiesgeurig.nl';
const OUT = 'docs/meta-feed.csv';
const MIN_PRODUCTS = 1000; // vangnet: bij een kapotte fetch de oude feed niet overschrijven

async function fetchPage(page) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`${SHOP}/products.json?limit=250&page=${page}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Blend Meta feed)' }
    });
    if (res.ok) return (await res.json()).products;
    await new Promise(r => setTimeout(r, 2000 * attempt));
  }
  throw new Error(`products.json pagina ${page} faalt`);
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<(br|\/p|\/li|\/h\d)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&euro;/g, 'EUR')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ').trim();
}

function csv(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const money = n => Number(n).toFixed(2) + ' EUR';

const products = [];
for (let page = 1; page < 200; page++) {
  const batch = await fetchPage(page);
  if (!batch.length) break;
  products.push(...batch);
}
if (products.length < MIN_PRODUCTS) throw new Error(`Maar ${products.length} producten, feed niet bijgewerkt`);

const cols = ['id', 'item_group_id', 'title', 'description', 'availability', 'condition', 'price',
  'sale_price', 'link', 'image_link', 'additional_image_link', 'brand', 'product_type'];
const rows = [cols.join(',')];
let variants = 0, skipped = 0;

for (const p of products) {
  const desc = stripHtml(p.body_html).slice(0, 5000) || p.title;
  const imgs = (p.images || []).map(i => i.src);
  for (const v of p.variants || []) {
    const image = (v.featured_image && v.featured_image.src) || imgs[0];
    const price = Number(v.price);
    if (!image || !(price > 0)) { skipped++; continue; }
    const cap = Number(v.compare_at_price);
    const onSale = cap > price;
    const title = v.title && v.title !== 'Default Title' ? `${p.title} - ${v.title}` : p.title;
    rows.push([
      `shopify_ZZ_${p.id}_${v.id}`,
      `shopify_ZZ_${p.id}`,
      title.slice(0, 200),
      desc,
      v.available ? 'in stock' : 'out of stock',
      'new',
      money(onSale ? cap : price),
      onSale ? money(price) : '',
      `${SHOP}/products/${p.handle}?variant=${v.id}`,
      image,
      imgs.filter(i => i !== image).slice(0, 10).join(','),
      p.vendor || 'Kiesgeurig',
      p.product_type || ''
    ].map(csv).join(','));
    variants++;
  }
}

mkdirSync('docs', { recursive: true });
writeFileSync(OUT, rows.join('\n') + '\n');
console.log(`${products.length} producten, ${variants} varianten in feed, ${skipped} overgeslagen (geen afbeelding of prijs 0)`);
