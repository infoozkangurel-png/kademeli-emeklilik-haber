exports.handler = async function () {
  const queries = [
    '"kademeli emeklilik"',
    '"kademeli emeklilik" TBMM',
    '"kademeli emeklilik" EMADDER',
    '"2000 sonrası" emeklilik'
  ];
  const all = [];
  for (const q of queries) {
    const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(q) + '&hl=tr&gl=TR&ceid=TR:tr';
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) continue;
      const xml = await res.text();
      const blocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const b of blocks) {
        const val = (tag) => {
          const m = b.match(new RegExp('<' + tag + '>(.*?)</' + tag + '>', 's'));
          return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>') : '';
        };
        const title = val('title');
        const link = val('link');
        const pub = val('pubDate');
        const source = val('source') || 'Google Haberler';
        if (!title || !link) continue;
        const low = title.toLocaleLowerCase('tr');
        const type = /(tbmm|bakan|sgk|resmî|resmi|meclis)/i.test(source + ' ' + title) ? 'official' : 'news';
        all.push({ title, url: link, source, date: pub ? new Date(pub).toLocaleDateString('tr-TR') : '', type, desc: 'Haber akışından alındı. İçeriğin ve iddiaların doğruluğu için kaynak haberi ve resmî kayıtları kontrol edin.' });
      }
    } catch (_) {}
  }
  const seen = new Set();
  const items = all.filter(x => { if (seen.has(x.url)) return false; seen.add(x.url); return true; })
    .sort((a,b) => new Date(b.date.split('.').reverse().join('-')) - new Date(a.date.split('.').reverse().join('-')))
    .slice(0, 35);
  return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' }, body: JSON.stringify({ items }) };
};
