(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const platformSteps=[
    {type:'Инвестиционный мандат',title:'Вы определяете рамки поиска.',tags:['Бюджет','География','Тип актива','Горизонт','Уровень риска'],note:'Отбор начинается с ваших критериев'},
    {type:'Поиск и анализ',title:'Мы проверяем возможности.',tags:['Документы','Юридическая история','Ограничения','Сценарий выхода'],note:'Отбор до предложения инвестору'},
    {type:'Отобранная возможность',title:'Вы принимаете решение.',tags:['Аналитические материалы','Ваш мандат','Самостоятельное решение'],note:'KRATNO INVEST — информационная поддержка'}
  ];
  $$('[data-platform-step]').forEach(button=>button.addEventListener('click',()=>{
    const i=Number(button.dataset.platformStep),step=platformSteps[i];
    $$('[data-platform-step]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    $('.platform-stage').dataset.active=String(i);$('#platform-document-type').textContent=step.type;$('#platform-document-number').textContent=`0${i+1} / 03`;$('#platform-document-title').textContent=step.title;$('#platform-document-note').textContent=step.note;
    $('#platform-tags').replaceChildren(...step.tags.map(t=>{const s=document.createElement('span');s.textContent=t;return s;}));
  }));
  const data = JSON.parse($('#register-data').textContent);
  const stats = data.statistics;
  const sieve = $('#sieve');
  const checked = new Set(Array.from({length:stats.checked},(_,i)=>Math.floor(i*stats.reviewed/stats.checked)));
  const checkedArray = [...checked];
  const bids = new Set(Array.from({length:stats.bids},(_,i)=>checkedArray[Math.floor(i*stats.checked/stats.bids)]));
  const bidsArray = [...bids];
  const deals = new Set(Array.from({length:stats.deals},(_,i)=>bidsArray[Math.floor(i*stats.bids/stats.deals)]));
  if(stats.reviewed < 100)sieve.hidden=true;
  else {
    sieve.style.gridTemplateColumns=`repeat(${stats.reviewed},minmax(0,1fr))`;
    const fragment=document.createDocumentFragment();
    for(let i=0;i<stats.reviewed;i++){const item=document.createElement('span');item.className=deals.has(i)?'deal':bids.has(i)?'bid':checked.has(i)?'checked':'';fragment.append(item);}
    sieve.append(fragment);
  }

  const menu=$('.menu-toggle'), nav=$('#navigation');
  function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open');}
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.topbar'))closeMenu();});

  $$('.case-filters button').forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.filter;
    $$('.case-filters button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    let count=0;
    $$('.case').forEach(c=>{const status=c.dataset.status;const show=value==='all'||(value==='deals'?['purchased','closed','active'].includes(status):status===value);c.hidden=!show;if(show)count++;});
    $('#filter-status').textContent=`Записей в реестре: ${count}`;
  }));

  const dialog=$('#info-dialog');
  const info={
    methodology:{title:'Как считаем отбор',content:'<p>Четыре вложенные группы: каждая следующая входит в предыдущую. Период — скользящие 12 месяцев, обновление — раз в квартал.</p><dl><div><dt>Просмотрено</dt><dd>Лот занесён во внутренний реестр с первичной оценкой цены и рынка.</dd></div><div><dt>Полная проверка</dt><dd>Запрошены выписки ЕГРН, изучены судебные дела и ФССП, рассчитана экономика с учётом скрытых обязанностей.</dd></div><div><dt>Заявка</dt><dd>Внесён задаток и подана заявка на площадке.</dd></div><div><dt>Сделка</dt><dd>Подписан договор и произведена оплата.</dd></div></dl><p>В этой дизайн-концепции показаны демонстрационные значения из исходного прототипа. Дата среза и фактические показатели ещё не подтверждены.</p>'},
    privacy:{title:'Персональные данные',content:'<p>Это демонстрационная версия сайта. Поля формы используются только для проверки интерфейса в вашем браузере. Контакты не отправляются и не сохраняются в хранилище браузера. Аналитические счётчики отключены.</p><p>До запуска приёма обращений компания должна разместить утверждённую политику с реквизитами оператора, целями и условиями обработки, сроками хранения и контактами для обращений. В этой версии такой документ не подменяется шаблонным текстом.</p><p>Из настроек сохраняется только ваш выбор cookies. Его можно изменить по ссылке «Настройки cookies» внизу страницы.</p>'},
    consent:{title:'Согласие на обработку',content:'<p>В демонстрационной форме отметка согласия проверяет состояние интерфейса. Передачи персональных данных не происходит.</p><p>Для действующего сайта здесь размещается отдельный утверждённый текст согласия с полными реквизитами оператора, перечнем данных, целями обработки, сроком действия и способом отзыва.</p>'}
  };
  $$('[data-dialog]').forEach(button=>button.addEventListener('click',()=>{const value=info[button.dataset.dialog];$('#dialog-title').textContent=value.title;$('#dialog-content').innerHTML=value.content;dialog.showModal();}));
  $('#dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});

  const routes={
    investor:{title:'За каждым делом —<br><span class="muted">документы.</span>',description:'Меморандумы, финансовые модели и документы по активам передаём после подписания соглашения о конфиденциальности.',button:'Запросить материалы',result:'Запрос материалов подготовлен.'},
    partner:{title:'Обсудим<br><span class="muted">периметр сделки.</span>',description:'Термшит, схема движения денег и разграничение ролей для платформ, банков и юридических фирм.',button:'Получить схему сделки',result:'Запрос схемы сделки подготовлен.'},
    seller:{title:'Посмотрим<br><span class="muted">на ваш актив.</span>',description:'Опишите объект, регион и текущий статус. Это поможет понять, входит ли актив в наш периметр проверки.',button:'Показать актив',result:'Обращение по активу подготовлено.'}
  };
  let current='investor';
  const form=$('#access-form'),result=$('#form-result'),send=$('#submit');
  const fields=['name','contact','asset','pd','qualified'];
  function clearErrors(){fields.forEach(id=>{$(`#${id}`).removeAttribute('aria-invalid');$(`#${id}-error`).textContent='';});result.hidden=true;}
  function setError(id,message){$(`#${id}`).setAttribute('aria-invalid','true');$(`#${id}-error`).textContent=message;}
  $('#qualified').required=true;
  $$('.routes button').forEach(button=>button.addEventListener('click',()=>{
    current=button.dataset.route;const r=routes[current];
    $$('.routes button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    $('#access-title').innerHTML=r.title;$('#access-text').textContent=r.description;send.textContent=r.button;
    $('#purpose').value=current;$('#qualification').hidden=current!=='investor';$('#qualified').required=current==='investor';
    $('.seller-field').hidden=current!=='seller';$('#asset').required=current==='seller';clearErrors();
  }));
  form.addEventListener('input',e=>{const id=e.target.id;if(fields.includes(id)){e.target.removeAttribute('aria-invalid');$(`#${id}-error`).textContent='';}result.hidden=true;});
  form.addEventListener('submit',async e=>{
    e.preventDefault();clearErrors();
    if($('#website').value)return;
    const name=$('#name').value.trim(),contact=$('#contact').value.trim(),asset=$('#asset').value.trim();
    const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const phone=/^\+?[\d\s()\-]+$/.test(contact)&&contact.replace(/\D/g,'').length>=10&&contact.replace(/\D/g,'').length<=15;
    if(name.length<2)setError('name','Укажите имя — не менее двух символов.');
    if(!email&&!phone)setError('contact','Укажите почту или телефон с кодом страны.');
    if(current==='seller'&&asset.length<10)setError('asset','Добавьте объект, регион и статус — от 10 символов.');
    if(!$('#pd').checked)setError('pd','Отметьте согласие на обработку данных.');
    if(current==='investor'&&!$('#qualified').checked)setError('qualified','Подтвердите статус для запроса материалов по выпускам.');
    const invalid=form.querySelector('[aria-invalid=true]');if(invalid){invalid.focus();return;}
    result.hidden=false;
    if(!form.dataset.endpoint){const title=document.createElement('strong');title.textContent=routes[current].result;const message=document.createElement('p');message.textContent='Проверка формы пройдена. Это демонстрация: данные не отправлены. Приём обращений станет доступен после подключения обработчика.';result.replaceChildren(title,message);result.focus();return;}
    send.disabled=true;send.textContent='Отправляем…';result.textContent='Отправляем обращение.';
    try{
      const endpoint=new URL(form.dataset.endpoint,location.href);if(endpoint.origin!==location.origin)throw new Error('Endpoint must be same-origin');
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,contact,asset:current==='seller'?asset:'',purpose:current,consent:true,qualified:current==='investor'&&$('#qualified').checked,website:''}),signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Request failed');
      const payload=await response.json();if(payload.accepted!==true)throw new Error('Not confirmed');
      result.textContent='Обращение принято. Ответ направим на указанный контакт.';form.reset();$('#purpose').value=current;
    }catch{result.textContent='Не удалось подтвердить отправку. Данные остались в форме — попробуйте ещё раз.';}
    finally{send.disabled=false;send.textContent=routes[current].button;result.focus();}
  });

  const cookie=$('#cookie');
  try{cookie.hidden=Boolean(localStorage.getItem('uksp-cookie-choice'));}catch{cookie.hidden=false;}
  $$('[data-cookie]').forEach(button=>button.addEventListener('click',()=>{try{localStorage.setItem('uksp-cookie-choice',button.dataset.cookie);}catch{}cookie.hidden=true;}));
  $('#cookie-settings').addEventListener('click',()=>{cookie.hidden=false;cookie.querySelector('button').focus();});

  let printState=[];
  window.addEventListener('beforeprint',()=>{printState=$$('.case').map(c=>({element:c,open:c.open,hidden:c.hidden}));printState.forEach(s=>{s.element.open=true;s.element.hidden=false;});});
  window.addEventListener('afterprint',()=>printState.forEach(s=>{s.element.open=s.open;s.element.hidden=s.hidden;}));
})();
