/**
 * Kotiksym unified lead form handler
 * Loaded on all 9 pages via <script src="form.js"></script>
 * Works alongside the Zero Block component, adding a second listener.
 */
(function () {
  'use strict';

  var GAS_URL = 'https://script.google.com/macros/s/AKfycbxWCMJrj-TVPRNRhs9cxDoj99CHjknicaNPexk6ZXfw1Hi3BcAj-q9hnR2Tv0TaYOd-/exec';

  var PAGE_LABELS = {
    '/': 'Главная страница',
    '/chitaet-medlenno/': 'Читает медленно',
    '/ne-ponimaet-tekst/': 'Не понимает текст',
    '/ne-mozhet-pereskazat/': 'Не может пересказать',
    '/domashka-do-vechera/': 'Домашка до вечера',
    '/zabyvaet-prochitannoe/': 'Забывает прочитанное',
    '/boitsya-otvechat/': 'Боится отвечать',
    '/oshibki-po-nevnimatelnosti/': 'Ошибки по невнимательности',
    '/skorochtenie-deti/': 'Скорочтение для детей'
  };

  function isValidRuPhone(value) {
    var d = (value || '').replace(/\D/g, '');
    return d.length === 11 && d[0] === '7';
  }

  function getFormFields() {
    var nameInput = document.querySelector('[name="name"], input[placeholder*="Ваше имя"], input[placeholder*="ваше имя"]');
    var phoneInput = document.querySelector('[name="phone"], input[inputMode="tel"]');
    var ageInput = document.querySelector('[name="age"], input[placeholder*="Возраст"]');

    var name = (nameInput ? nameInput.value : '').trim();
    var phone = (phoneInput ? phoneInput.value : '').trim();
    var age = (ageInput ? ageInput.value : '').trim();

    return { name: name, phone: phone, age: age };
  }

  function sendForm(name, phone, age) {
    var path = window.location.pathname;
    var fields = {
      name: "'" + name,
      phone: "'" + phone,
      age: age || '',
      page_url: window.location.href,
      page_path: path,
      page_title: document.title,
      page_label: PAGE_LABELS[path] || document.title || path
    };

    var _p = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'].forEach(function (k) {
      var v = _p.get(k);
      if (v) fields[k] = v;
    });

    console.log('Kotiksym form send:', JSON.stringify(fields));

    // Build hidden form + iframe
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = GAS_URL;
    form.target = 'kotiksym_form_iframe';
    form.style.display = 'none';

    for (var k in fields) {
      if (fields.hasOwnProperty(k)) {
        var inp = document.createElement('input');
        inp.type = 'hidden';
        inp.name = k;
        inp.value = fields[k];
        form.appendChild(inp);
      }
    }

    var ifr = document.getElementById('kotiksym_form_iframe');
    if (!ifr) {
      ifr = document.createElement('iframe');
      ifr.id = 'kotiksym_form_iframe';
      ifr.name = 'kotiksym_form_iframe';
      ifr.style.display = 'none';
      document.body.appendChild(ifr);
    }

    document.body.appendChild(form);
    form.submit();
    setTimeout(function () {
      try { document.body.removeChild(form); } catch (e) {}
    }, 200);

    // Fire Metrika goal
    if (window.ym) {
      ym(110489022, 'reachGoal', 'lead_form_submit');
    }
  }

  // Watch for click on submit button every 500ms (light polling to catch Zero Block button)
  // Also listen for React state changes.
  var lastSubmitTime = 0;

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-submit], button:has(> [data-submit]), button[onClick*="onSubmit"]');
    if (!btn) return;

    // Debounce — allow only once per 3 seconds
    var now = Date.now();
    if (now - lastSubmitTime < 3000) return;

    // Small delay to let Zero Block validation run first
    setTimeout(function () {
      var f = getFormFields();
      if (f.name.length < 2) {
        alert('Заполните имя и телефон');
        return;
      }
      if (!isValidRuPhone(f.phone)) {
        alert('Заполните имя и телефон');
        return;
      }
      sendForm(f.name, f.phone, f.age);
      lastSubmitTime = Date.now();
    }, 300);
  });

  console.log('Kotiksym form handler loaded');
})();
