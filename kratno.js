/* kratno.js — только для kratno.html.
   Копии фрагментов app.js @ f48dad4 (Srv163/uksp): platformSteps и шаги (строки 5–15), меню (16–21),
   окна privacy/consent (23–31, тексты 26–27), cookie (77–80), печать (82–84, здесь — для FAQ). При правке этих мест в app.js — синхронизировать.
   Сеть не используется. Значения формы нигде не сохраняются (так обещает окно «Персональные данные»). */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* 1. Документ маршрута — данные дословно app.js:5–15; обработчик — по образцу app.js, с проверкой узлов */
  const platformSteps=[
    {type:'Инвестиционный мандат',title:'Вы определяете рамки поиска.',tags:['Бюджет','География','Тип актива','Горизонт','Уровень риска'],note:'Отбор начинается с ваших критериев'},
    {type:'Поиск и анализ',title:'Мы проверяем возможности.',tags:['Документы','Юридическая история','Ограничения','Сценарий выхода'],note:'Отбор до предложения инвестору'},
    {type:'Отобранная возможность',title:'Вы принимаете решение.',tags:['Аналитические материалы','Ваш мандат','Самостоятельное решение'],note:'KRATNO INVEST — информационная поддержка'}
  ];
  const stage=$('.platform-stage');
  const docType=$('#platform-document-type'),docNumber=$('#platform-document-number'),docTitle=$('#platform-document-title'),docNote=$('#platform-document-note'),docTags=$('#platform-tags');
  if(stage&&docType&&docNumber&&docTitle&&docNote&&docTags){
    $$('[data-platform-step]').forEach(button=>button.addEventListener('click',()=>{
      const i=Number(button.dataset.platformStep),step=platformSteps[i];if(!step)return;
      $$('[data-platform-step]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      stage.dataset.active=String(i);
      docType.textContent=step.type;
      docNumber.textContent=`0${i+1} / 03`;
      docTitle.textContent=step.title;
      docNote.textContent=step.note;
      docTags.replaceChildren(...step.tags.map(t=>{const s=document.createElement('span');s.textContent=t;return s;}));
    }));
  }

  /* 2. Меню — app.js:16–21 */
  const menu=$('.menu-toggle'),nav=$('#navigation');
  if(menu&&nav){
    const closeMenu=()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open');};
    menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
    nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
    document.addEventListener('click',e=>{if(!e.target.closest('.topbar'))closeMenu();});
  }

  /* 3. Окна — app.js:23–31; тексты дословно app.js:26–27; ключа methodology нет (цифр на странице нет) */
  const dialog=$('#info-dialog'),dialogTitle=$('#dialog-title'),dialogContent=$('#dialog-content');
  const info={
    privacy:{title:'Персональные данные',content:'<p>Это демонстрационная версия сайта. Поля формы используются только для проверки интерфейса в вашем браузере. Контакты не отправляются и не сохраняются в хранилище браузера. Аналитические счётчики отключены.</p><p>До запуска приёма обращений компания должна разместить утверждённую политику с реквизитами оператора, целями и условиями обработки, сроками хранения и контактами для обращений. В этой версии такой документ не подменяется шаблонным текстом.</p><p>Из настроек сохраняется только ваш выбор cookies. Его можно изменить по ссылке «Настройки cookies» внизу страницы.</p>'},
    consent:{title:'Согласие на обработку',content:'<p>В демонстрационной форме отметка согласия проверяет состояние интерфейса. Передачи персональных данных не происходит.</p><p>Для действующего сайта здесь размещается отдельный утверждённый текст согласия с полными реквизитами оператора, перечнем данных, целями обработки, сроком действия и способом отзыва.</p>'}
  };
  if(dialog&&dialogTitle&&dialogContent&&typeof dialog.showModal==='function'){
    $$('[data-dialog]').forEach(button=>button.addEventListener('click',()=>{const value=info[button.dataset.dialog];if(!value)return;dialogTitle.textContent=value.title;dialogContent.innerHTML=value.content;dialog.showModal();}));
    const close=$('#dialog-close');if(close)close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
  }

  /* 4. Заявка — демо. Проверки и тексты ошибок — как у живой формы заявки на kratnoinvest.ru */
  const form=$('#apply-form');
  if(form){
    const submit=$('#k-submit'),result=$('#k-result');
    if(submit)submit.disabled=false;
    const EMAIL_RE=/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;
    const val=id=>{const el=$(`#${id}`);return el?el.value.trim():'';};
    const checked=name=>$$(`#apply-form input[name="${name}"]:checked`).map(i=>i.parentElement.textContent.trim());
    const setError=(id,msg)=>{const el=$(`#${id}`),err=$(`#${id}-error`);if(el)el.setAttribute('aria-invalid','true');if(err)err.textContent=msg;};
    const clearErrors=()=>{['k-name','k-contact','k-email','k-consent'].forEach(id=>{const el=$(`#${id}`),err=$(`#${id}-error`);if(el)el.removeAttribute('aria-invalid');if(err)err.textContent='';});if(result){result.hidden=true;result.replaceChildren();}};
    form.addEventListener('input',e=>{const t=e.target;if(t&&t.id){t.removeAttribute('aria-invalid');const err=$(`#${t.id}-error`);if(err)err.textContent='';}if(result)result.hidden=true;});
    form.addEventListener('submit',e=>{
      e.preventDefault();clearErrors();
      if(val('k-website'))return;
      const name=val('k-name'),contact=val('k-contact'),email=val('k-email');
      if(name.length<2)setError('k-name','Укажите имя');
      if(!contact)setError('k-contact','Оставьте Telegram или телефон');
      if(!EMAIL_RE.test(email))setError('k-email','Проверьте адрес электронной почты');
      const consent=$('#k-consent');if(!consent||!consent.checked)setError('k-consent','Нужно согласие на обработку персональных данных');
      const invalid=form.querySelector('[aria-invalid="true"]');if(invalid){invalid.focus();return;}
      if(!result)return;
      const title=document.createElement('strong');title.textContent='Заявка подготовлена.';
      const message=document.createElement('p');message.textContent='Проверка формы пройдена. Это демонстрация: данные не отправлены. Приём обращений станет доступен после подключения обработчика.';
      const caption=document.createElement('p');caption.textContent='Что вы указали:';
      const list=document.createElement('dl');list.className='k-summary';
      const row=(label,value)=>{if(!value)return;const d=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;d.append(dt,dd);list.append(d);};
      row('Контакты',[contact,email].join(' · '));
      row('Капитал на сделку',checked('capital_range').join(', '));
      row('Статус',checked('investor_type').join(', '));
      row('Активы',checked('asset_types').join(', '));
      row('География',[...checked('geography'),val('k-regions')].filter(Boolean).join(', '));
      row('Сделок в год',checked('deals_per_year').join(', '));
      result.replaceChildren(title,message,caption,list);result.hidden=false;result.focus();
    });
  }

  /* 5. Cookie — app.js:77–80; тот же ключ: выбор общий с главной (один origin) */
  const cookie=$('#cookie');
  if(cookie){
    try{cookie.hidden=Boolean(localStorage.getItem('uksp-cookie-choice'));}catch{cookie.hidden=false;}
    $$('[data-cookie]').forEach(button=>button.addEventListener('click',()=>{try{localStorage.setItem('uksp-cookie-choice',button.dataset.cookie);}catch{}cookie.hidden=true;}));
    const settings=$('#cookie-settings');if(settings)settings.addEventListener('click',()=>{cookie.hidden=false;const b=cookie.querySelector('button');if(b)b.focus();});
  }

  /* 6. Печать: раскрыть ответы FAQ (в них оговорки), потом вернуть как было — по образцу app.js:82–84.
     details[name] — группа «открыт один»: без снятия name браузер оставит открытым только последний ответ. */
  let printState=[];
  window.addEventListener('beforeprint',()=>{printState=$$('.k-faq details').map(d=>({element:d,open:d.open,name:d.getAttribute('name')}));printState.forEach(s=>{s.element.removeAttribute('name');s.element.open=true;});});
  window.addEventListener('afterprint',()=>{printState.forEach(s=>{s.element.open=s.open;});printState.forEach(s=>{if(s.name!==null)s.element.setAttribute('name',s.name);});printState=[];});
})();
