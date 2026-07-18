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
  function pick(s) { for(var i=0;i<s.length;i++){var e=document.querySelector(s[i]);if(e)return e;}return null; }

  // ── Phone input setup ──
  var phoneErr = null;

  function setupPhoneMask() {
    var p = pick(['[name="phone"]','input[inputMode="tel"]']);
    if (!p) return;
    // Set attributes
    p.type = 'tel';
    p.inputMode = 'numeric';
    p.autocomplete = 'tel';
    p.placeholder = '+7 (___) ___-__-__';
    // Create error element
    phoneErr = document.createElement('div');
    phoneErr.style.cssText = 'color:#e53935;font-size:12px;line-height:1.3;margin-top:4px;display:none;';
    phoneErr.textContent = 'Введите номер полностью';
    p.parentNode.insertBefore(phoneErr, p.nextSibling);
    // Format on input
    p.addEventListener('input', function () {
      formatPhoneInput(p);
      if (phoneErr && phoneErr.style.display !== 'none') {
        var raw = (p.value||'').replace(/\D/g,'');
        if (raw.length === 11 && raw[0] === '7') {
          phoneErr.style.display = 'none';
        }
      }
    });
    // Handle paste
    p.addEventListener('paste', function (e) {
      var pasted = (e.clipboardData||window.clipboardData).getData('text');
      var digits = pasted.replace(/\D/g,'');
      if (digits.length > 0) {
        e.preventDefault();
        // 11 digits: 8XXX... → strip 8; 7XXX... → strip leading 7
        if (digits.length === 11 && digits[0] === '8') {
          digits = digits.slice(1);
        } else if (digits.length === 11 && digits[0] === '7') {
          digits = digits.slice(1);
        } else if (digits.length === 10) {
          // already just the 10 digits
        } else if (digits.length > 11) {
          digits = digits.slice(-10);
        }
        // For shorter pastes, keep as-is (formatPhoneInput will handle 8→7)
        if (digits.length > 10) digits = digits.slice(0, 10);
        var masked = maskPhone(digits);
        p.value = masked;
        setCaretPosition(p, masked.length);
        // Trigger input handler to run formatPhoneInput
        var evt = new Event('input', { bubbles: true });
        p.dispatchEvent(evt);
      }
    });
    // Focus: place caret after +7
    p.addEventListener('focus', function () {
      if (p.value === '' || p.value === '+7') {
        p.value = '+7 ';
        setCaretPosition(p, 3);
      } else {
        // Place after the last digit
        var raw = (p.value||'').replace(/\D/g,'');
        if (raw.length <= 1) {
          setCaretPosition(p, p.value.length);
        }
      }
    });
    // Keyboard: disallow deleting +7
    p.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace') {
        var sel = p.selectionStart;
        if (sel <= 3) {
          e.preventDefault();
          if (p.setSelectionRange) {
            p.setSelectionRange(3, 3);
          }
          return;
        }
      }
    });
  }

  function maskPhone(digits) {
    digits = digits.replace(/\D/g,'');
    if (digits.length > 10) digits = digits.slice(0, 10);
    var r = '+7 ';
    if (digits.length > 0) r += '(' + digits.slice(0, 3);
    if (digits.length > 3) r += ') ' + digits.slice(3, 6);
    if (digits.length > 6) r += '-' + digits.slice(6, 8);
    if (digits.length > 8) r += '-' + digits.slice(8, 10);
    return r;
  }

  function formatPhoneInput(p) {
    var raw = (p.value||'').replace(/\D/g,'');
    // Handle paste of full numbers with 8 or 7
    if (raw.length > 1) {
      if (raw[0] === '8') raw = '7' + raw.slice(1);
      if (raw.length > 1 && raw[0] === '7') raw = raw.slice(1);
    }
    var masked = maskPhone(raw);
    // Only update if changed (prevents cursor jump on simple backspace)
    if (masked !== p.value) {
      var oldLen = p.value.length;
      var oldPos = p.selectionStart;
      p.value = masked;
      // Try to keep cursor position
      var newLen = masked.length;
      if (oldPos >= oldLen - 1 || oldPos > newLen) {
        setCaretPosition(p, newLen);
      } else {
        // Adjust cursor: if char was added, move forward
        setCaretPosition(p, Math.min(oldPos + (newLen - oldLen) + 1, newLen));
      }
    }
  }

  function setCaretPosition(el, pos) {
    if (el.setSelectionRange) {
      setTimeout(function () { el.setSelectionRange(pos, pos); }, 0);
    }
  }

  // Strip formatting → raw +7XXXXXXXXXX
  function rawPhone(val) {
    var d = (val||'').replace(/\D/g,'');
    if (d.length < 2) return '';
    // Convert 8... to 7...
    if (d[0] === '8') d = '7' + d.slice(1);
    // If 10 digits not starting with 7, prepend country code
    if (d.length === 10 && d[0] !== '7') d = '7' + d;
    // Truncate to 11
    if (d.length > 11) d = d.slice(0, 11);
    return '+' + d;
  }

  function phoneOK(v) {
    var d = (v||'').replace(/\D/g,'');
    return d.length===11 && d[0]==='7';
  }

  // ── Collect form fields ──
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
    // Strip phone formatting, always send +7XXXXXXXXXX
    var phone = rawPhone(p?p.value:'');
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
    if(n)n.value='';if(p){p.value='';}if(a)a.value='';
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
    if(name.length < 2){
      if(phoneErr){phoneErr.style.display='none';}
      alert('Напишите, как вас зовут.');
      return;
    }
    if(!phoneOK(phone)){
      if(phoneErr){phoneErr.style.display='block';}
      return;
    }
    if(phoneErr){phoneErr.style.display='none';}
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
  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPhoneMask);
  } else {
    setupPhoneMask();
  }
  document.addEventListener('click', onClick);
  console.log('Kotiksym form v3 loaded');
})();
