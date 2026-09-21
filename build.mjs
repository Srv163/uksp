import {readFile, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = new URL('./', import.meta.url);
const data = JSON.parse(await readFile(new URL('data/projects.json', base), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = (value, digits=2) => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:digits}).format(value);
const date = value => new Intl.DateTimeFormat('ru-RU',{timeZone:'UTC'}).format(new Date(value));
const days = project => (Date.parse(project.saleDate)-Date.parse(project.purchaseDate))/86400000;
const dayWord = value => value%100>=11&&value%100<=14?'дней':value%10===1?'день':value%10>=2&&value%10<=4?'дня':'дней';
assert.equal(data.projects.length,3,'The approved selection contains three projects');
for (const [i,p] of data.projects.entries()) {
  assert.equal(p.status,'realized');
  assert.ok(p.purchasePrice>0 && p.salePrice>0);
  assert.ok(Number.isInteger(days(p)) && days(p)>0);
  if(i) assert.ok(data.projects[i-1].salePrice>=p.salePrice,'Projects must be sorted by sale price');
}
const rows = data.projects.map(p=>`<article class="project" aria-labelledby="project-${esc(p.id)}">
  <div class="project-top"><span class="project-number">${esc(p.id)}</span><span class="project-category">${esc(p.category)}</span><span class="project-status"><i aria-hidden="true"></i>Реализован</span></div>
  <div class="project-main"><div class="project-title"><h3 id="project-${esc(p.id)}">${esc(p.title)}</h3><p>${date(p.purchaseDate)} <span aria-hidden="true">—</span> ${date(p.saleDate)}</p></div><div class="project-purchase"><span>Стоимость приобретения</span><strong>${number(p.purchasePrice/1e6)}<small>млн ₽</small></strong></div><div class="project-sale"><span>Цена продажи, без НДС</span><strong>${number(p.salePrice/1e6)}<small>млн ₽</small></strong></div></div>
  <details class="project-details"><summary><span>Даты и суммы сделки</span><span class="project-duration">${days(p)} ${dayWord(days(p))} владения</span><span class="project-expand" aria-hidden="true">+</span></summary><div class="project-detail-grid"><div><span>Полная оплата</span><time datetime="${esc(p.purchaseDate)}">${date(p.purchaseDate)}</time><b>${number(p.purchasePrice)} ₽</b></div><div><span>Продажа</span><time datetime="${esc(p.saleDate)}">${date(p.saleDate)}</time><b>${number(p.salePrice)} ₽ <small>без НДС</small></b></div><p>Срок владения — от даты полной оплаты до даты продажи. Суммы в заголовке округлены до сотых миллиона.</p></div></details>
</article>`).join('\n');
const section = `<section id="cases" class="section cases-section portfolio-section">
    <div class="wrap">
      <div class="section-heading"><p class="section-index">02 / Реализованные проекты</p><h2>От приобретения<br><em>к реализации.</em></h2><p class="section-description">Три крупнейших реализованных проекта по цене продажи.<br>Из портфолио 2023–2026.</p></div>
      <div class="portfolio-topline"><span>Избранные проекты / 01—03</span><span>Стоимость приобретения и цена продажи</span></div>
      <div id="registry" class="project-list">${rows}</div>
      <div class="registry-bottom"><p>Цена продажи указана без НДС. Суммы не являются показателями чистой прибыли.</p><button class="plain-link" data-dialog="methodology" type="button">О показателях</button><a class="text-link" href="#access">Обсудить проект <span class="link-line" aria-hidden="true"></span></a></div>
    </div>
  </section>`;
let html = await readFile(new URL('index.html',base),'utf8');
assert.match(html,/<section id="cases"/);
html = html.replace(/<section id="cases"[\s\S]*?<\/section>/,section);
html = html.replace(/<script id="register-data" type="application\/json">[\s\S]*?<\/script>\n?/g,'');
html = html.replace('>Методика отбора</button>','>О показателях</button>');
html = html.replace('Дизайн-концепция / данные не подтверждены','Дизайн-концепция / Портфолио 2023–2026');
await writeFile(new URL('index.html',base),html);
console.log(`Built ${data.projects.length} approved projects: ${data.projects.map(p=>`${p.title} (${days(p)} days)`).join(', ')}`);
