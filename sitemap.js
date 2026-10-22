// MC PERFUMES — خريطة الموقع لمحرك البحث: صفحة لكل عطر ظاهر (/p/<رقم العطر>) مع صورته.
// الرابط /sitemap-products.xml يُعاد توجيهه إلى هنا (vercel.json) ويتحدث تلقائيًا عند إضافة أي عطر.
export const config = { runtime: 'edge' };

const SB = 'https://ceqbaqkhzchrrrhpwsxk.supabase.co';
const KEY = 'sb_publishable_VQECPReRWmnKZKK7s6YLiQ_URuZMCdk'; // المفتاح العام نفسه الموجود داخل الموقع (آمن للنشر)
const SITE = 'https://www.mcperfumes.com';

const x = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

export default async function handler() {
  let rows = [];
  try {
    const r = await fetch(`${SB}/rest/v1/products?select=id,data`, { headers: { apikey: KEY } });
    if (r.ok) rows = await r.json();
  } catch (e) { /* تُعاد خريطة بالصفحة الرئيسية فقط */ }
  const urls = [`<url><loc>${SITE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`];
  for (const { id, data: d } of rows) {
    if (!d || d.visible === false || !id) continue;
    const img = (d.imgs && d.imgs[0]) || d.th;
    const lm = d.ts ? `<lastmod>${new Date(+d.ts).toISOString().slice(0, 10)}</lastmod>` : '';
    urls.push(`<url><loc>${SITE}/p/${x(id)}</loc>${lm}<changefreq>weekly</changefreq><priority>0.8</priority>` +
      (img ? `<image:image><image:loc>${x(img)}</image:loc><image:title>${x(d.name)}</image:title></image:image>` : '') + `</url>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' } });
}