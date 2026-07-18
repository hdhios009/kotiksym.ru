/** Kotiksym — единый обработчик заявок (v3) */
(function () {
  'use strict';
  var GAS = 'https://script.google.com/macros/s/AKfycbxWCMJrj-TVPRNRhs9cxDoj99CHjknicaNPexk6ZXfw1Hi3BcAj-q9hnR2Tv0TaYOd-/exec';
  var TIMEOUT = 18000;
  var CD = 5000;
  var busy = false;
  var LABELS = {
    '/': 'Главная КотиксУМ',
    '/ne-ponimaet-tekst/': 'Не понимает текст',
    '/domashka-do-vechera/': 'Домашка до вечера',
    '/ne-mozhet-pereskazat/': 'Не может пересказать',
    '/chitaet-medlenno/': 'Медленно читает',
    '/zabyvaet-prochitannoe/': 'Забывает текст',
    '/boitsya-otvechat/': 'Боится отвечать',
    '/oshibki-po-nevnimatelnosti/': 'Ошибки по вниманию',
    '/skorochtenie-deti/': 'Скорочтение детям',
    '/angliyskiy-yazyk/': 'Английский для детей',
    '/podgotovka-k-shkole/': 'Подготовка к школе',
    '/pamyat-i-vnimanie/': 'Память и внимание',
    '/logika-i-myshlenie/': 'Логика и мышление',
    '/kalligrafiya-gramotnost/': 'Каллиграфия и грамотность'
  };
  function phoneOK(v) { var d = (v||'').replace(/\D/g,''); return d.length===11 && d[0]==='7'; }
  function pick(s) { for(var i=0;i<s.length;i++){var e=document.querySelector(s[i]);if(e)return e;}return null; }
  function collect() {
    var n = pick(['[name="name"]','input[placeholder*="Ваше имя"]','input[placeholder*="ваше имя"]']);
    var p = pick(['[name="phone"]','input[inputMode="tel"]']);
    var a = pick(['[name="age"]','input[placeholder*="Возраст"]']);
    var path = window.location.pathname;
    var href = location.href;
    var title = document.title;
    var label = LABELS[path]||title||path;
    var q = new URLSearchParams(location.search);
    var name = (n?n.value:'').trim();
    var phone = (p?p.value:'').trim();
    var age = (a?a.value:'').trim()||'';
    var f = {
      // English fields
      name: name,
      phone: phone,
      age: age,
      page_url: href,
      page_path: path,
      page_title: title,
      page_label: label,
      // Russian fields
      'Имя': name,
      'Телефон': phone,
      'Возраст ребёнка': age,
      'Страница заявки': href,
      'Путь страницы': path,
      'Заголовок страницы': title,
      'Источник заявки': label,
      'Источник (referrer)': document.referrer||'прямой заход',
      // Metadata
      lead_id: Date.now()+'_'+Math.random().toString(36).slice(2,10),
      request_source: 'form_js_v3'
    };
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid']
      .forEach(function(k){var v=q.get(k);if(v)f[k]=v;});
    return f;
  }
  function clearInputs() {
    var n = document.getElementById('f_name')||pick(['[name="name"]']);
    var p = document.getElementById('f_phone')||pick(['input[inputMode="tel"]']);
    var a = document.getElementById('f_age')||pick(['input[placeholder*="Возраст"]']);
    if(n)n.value='';if(p)p.value='';if(a)a.value='';
  }
  function send(fields, ok, fail) {
    var form = document.createElement('form');
    form.method='POST';form.action=GAS;form.target='kf';form.style.display='none';
    for(var k in fields){if(!fields.hasOwnProperty(k))continue;
      var i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(fields[k]);form.appendChild(i);}
    var ifr=document.getElementById('kf');
    if(!ifr){ifr=document.createElement('iframe');ifr.id='kf';ifr.name='kf';ifr.style.display='none';document.body.appendChild(ifr);}
    var done=false, timer=setTimeout(function(){if(!done){done=true;fail('Сервер не отвечает. Попробуйте ещё раз.');}},TIMEOUT);
    ifr.onload=function(){if(!done){done=true;clearTimeout(timer);ok();}};
    document.body.appendChild(form);form.submit();
    setTimeout(function(){try{if(form.parentNode)form.parentNode.removeChild(form);}catch(e){}},300);
  }
  function onClick(e) {
    var btn = e.target.closest('[data-submit]');
    if(!btn) return;
    e.preventDefault();
    if(busy) return;
    var f = collect();
    var name = f['Имя'], phone = f['Телефон'];
    if(name.length < 2){alert('Напишите, как вас зовут.');return;}
    if(!phoneOK(phone)){alert('Введите российский номер: +7 и 10 цифр, например +7 (968) 455-18-00.');return;}
    var orig=btn.textContent; btn.textContent='Отправляем…'; btn.disabled=true; btn.style.opacity='0.7';
    busy=true;
    send(f,
      function(){btn.textContent=orig;btn.disabled=false;btn.style.opacity='1';busy=false;
        clearInputs();
        var m=document.getElementById('successModal');if(m)m.style.display='grid';
        if(window.ym)ym(110489022,'reachGoal','lead_form_submit');},
      function(msg){btn.textContent=orig;btn.disabled=false;btn.style.opacity='1';busy=false;
        if(msg)alert(msg);}
    );
    setTimeout(function(){busy=false;}, CD);
  }
  document.addEventListener('click', onClick);
  console.log('Kotiksym form v3 loaded');
})();
