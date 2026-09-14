import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base = new URL('./', import.meta.url);
const data = JSON.parse(await readFile(new URL('data/cases.json', base), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const s = data.statistics;
if (!(s.reviewed >= s.checked && s.checked >= s.bids && s.bids >= s.deals && s.deals >= 0)) throw new Error('Statistics must be nested: reviewed >= checked >= bids >= deals');
function chart(c) {
  const steps=c.decision || [['Объект','Первичный отбор'],['Проверка','Права и обязательства'],['Решение',c.statusLabel]];
  return `<div class="decision-structure" aria-label="Структура решения">${steps.map(([label,value])=>`<div class="decision-line"><div><span>${esc(label)}</span><b>${esc(value)}</b></div></div>`).join('')}</div>`;
}
const rows = data.cases.map((c,i) => `<details class="case" data-status="${esc(c.status)}" ${i===0?'open':''}>
  <summary><span class="case-number">${esc(c.id)}</span><span><span class="case-name">${esc(c.title)}</span><span class="case-region">${esc(c.region)}</span></span><span class="case-status ${esc(c.status)}">${esc(c.statusLabel)}</span><span class="case-plus" aria-hidden="true"></span></summary>
  <div class="case-inner"><div class="case-copy">${c.paragraphs.map(p=>`<div><h4>${esc(p.heading)}</h4><p>${esc(p.text)}</p></div>`).join('')}</div><aside class="case-card" aria-label="Ключевые факты дела ${esc(c.id)}"><div class="case-card-top"><span>Логика решения</span><span>Мандат ${esc(c.mandate)}</span></div>${chart(c)}<dl class="case-facts">${c.facts.map(f=>`<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl><div class="seal ${esc(c.status)}">${esc(c.seal)}</div></aside></div>
</details>`).join('\n');
let html = await readFile(new URL('index.html', base), 'utf8');
html = html.replace(/<!-- CASES_START -->[\s\S]*?<!-- CASES_END -->/, `<!-- CASES_START -->\n${rows}\n<!-- CASES_END -->`);
html = html.replace(/<script id="register-data" type="application\/json">[\s\S]*?<\/script>\n?/g, '');
html = html.replace('</body>', `<script id="register-data" type="application/json">${JSON.stringify({demo:data.demo,snapshot:data.snapshot,statistics:s}).replace(/</g,'\\u003c')}</script>\n</body>`);
const statKeys = ['reviewed','checked','bids','deals'];
let pos = 0;
html = html.replace(/(<div class="sieve-stat">[\s\S]*?<b>)\d+(<\/b>)/g, (_,a,b) => `${a}${s[statKeys[pos++]]}${b}`);
html = html.replace(/(<span class="stat-value accent">)\d+<span> \/ \d+/,`$1${s.deals}<span> / ${s.reviewed}`);
const counts = {all:data.cases.length,deals:data.cases.filter(c=>['purchased','closed','active'].includes(c.status)).length,refused:data.cases.filter(c=>c.status==='refused').length,lost:data.cases.filter(c=>c.status==='lost').length};
for(const [key,n] of Object.entries(counts))html=html.replace(new RegExp(`(data-filter="${key}"[^>]*>[^<]*<span>)\\d+`),`$1${String(n).padStart(2,'0')}`);
html=html.replace(/<span class="demo-label">[^<]*<\/span>/,`<span class="demo-label">${data.demo?'Демонстрационный срез за 12 месяцев':`За 12 месяцев / срез на ${esc(data.snapshot || 'дату уточнения')}`}</span>`);
await writeFile(new URL('index.html',base),html);
console.log(`Built ${data.cases.length} cases into ${fileURLToPath(new URL('index.html',base))}`);
