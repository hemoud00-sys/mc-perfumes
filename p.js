// MC PERFUMES — معاينة رابط العطر عند مشاركته (فيسبوك، واتساب، تيليجرام…)
// الرابط /p/<رقم العطر> يُعاد توجيهه إلى هنا (vercel.json)، فنرسل صفحة الموقع نفسها
// بعد وضع اسم العطر وسعره وصورته في وسوم المعاينة (og). الزائر يرى الموقع عاديًا ويفتح العطر مباشرة.
export const config = { runtime: 'edge' };

const SB = 'https://ceqbaqkhzchrrrhpwsxk.supabase.co';
const KEY = 'sb_publishable_VQECPReRWmnKZKK7s6YLiQ_URuZMCdk'; // المفتاح العام نفسه الموجود داخل الموقع (آمن للنشر)

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req) {
  const u = new URL(req.url);
  const id = (u.searchParams.get('id') || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  let html;
  try {
    const page = await fetch(u.origin + '/index.html');
    if (!page.ok) throw new Error('index ' + page.status);
    html = await page.text();
  } catch (e) {
    return Response.redirect(u.origin + '/#p/' + id, 302);
  }
  if (id) {
    try {
      const r = await fetch(`${SB}/rest/v1/products?id=eq.${id}&select=data`, { headers: { apikey: KEY } });
      const row = r.ok ? (await r.json())[0] : null, d = row && row.data;
      if (d && d.visible !== false) {
        const img = (d.imgs && d.imgs[0]) || d.th || '';
        const s = (d.sizes || []).find(z => +z.price > 0) || {};
        const title = `${d.name} | MC للعطور`;
        const desc = [d.brand, s.ml ? s.ml + ' مل' : '', s.price ? Number(s.price).toLocaleString('en-US') + ' أوقية' : '']
          .filter(Boolean).join(' · ') + ' — عطر أصلي 100٪ والتوصيل مجاني';
        const url = `${u.origin}/p/${id}`;
        const set = (re, val) => { html = html.replace(re, (m, a, b) => a + val + b); };
        set(/(<title>)[^<]*(<\/title>)/, esc(title));
        set(/(<meta name="description" content=")[^"]*(")/, esc(desc));
        set(/(<meta property="og:title" content=")[^"]*(")/, esc(title));
        set(/(<meta property="og:description" content=")[^"]*(")/, esc(desc));
        set(/(<meta property="og:url" content=")[^"]*(")/, esc(url));
        set(/(<link rel="canonical" href=")[^"]*(")/, esc(url));
        const ld = { '@context': 'https://schema.org', '@type': 'Product', name: d.name, image: img ? [img] : undefined,
          description: d.desc || desc, brand: d.brand ? { '@type': 'Brand', name: d.brand } : undefined, url,
          offers: (d.sizes || []).filter(z => +z.price > 0).map(z => ({ '@type': 'Offer', name: (z.ml || '') + ' ml', price: String(+z.price),
            priceCurrency: 'MRU', availability: +z.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder', url,
            seller: { '@id': 'https://www.mcperfumes.com/#store' } })) };
        html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script></head>`);
        if (img) {
          set(/(<meta property="og:image" content=")[^"]*(")/, esc(img));
          html = html.replace('<meta name="twitter:card" content="summary">',
            `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(img)}"><meta property="og:image:alt" content="${esc(d.name)}">`);
        }
      }
    } catch (e) { /* عند أي خطأ تُعرض معاينة الموقع العادية */ }
  }
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400' }
  });
}