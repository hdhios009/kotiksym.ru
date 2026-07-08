/**
 * Kotiksym unified lead form handler v2
 * Sole lead form submission handler for all pages.
 * Overrides duplicate Zero Block submissions.
 */
(function () {
  'use strict';

  var GAS_URL = 'https://script.google.com/macros/s/AKfycbxWCMJrj-TVPRNRhs9cxDoj99CHjknicaNPexk6ZXfw1Hi3BcAj-q9hnR2Tv0TaYOd-/exec';

  var PAGE_LABELS = {
    '/': 'Главная КотиксУМ',
    '/ne-ponimaet-tekst/': 'Не понимает текст',
    '/domashka-do-vechera/': 'Домашка до вечера',
    '/ne-mozhet-pereskazat/': 'Не может пересказать',
    '/chitaet-medlenno/': 'Медленно читает',
    '/zabyvaet-prochitannoe/': 'Забывает текст',
    '/boitsya-otvechat/': 'Боится отвечать',
    '/oshibki-po-nevnimatelnosti/': 'Ошибки по вниманию',
    '/skorochtenie-deti/': 'Скорочтение детям'
  };

  var isSubmitting = false;
  var SUBMIT_COOLDOWN = 7000; // ms

  function isValidRuPhone(value) {
    var d = (value || '').replace(/\D/g, '');
    return d.length === 11 && d[0] === '7';
  }

  function findInput(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  function collectFields() {
    var nameInput = findInput(['[name="name"]', 'input[placeholder*="Ваше имя"]', 'input[placeholder*="ваше имя"]']);
    var phoneInput = findInput(['[name="phone"]', 'input[inputMode="tel"]']);
    var ageInput = findInput(['[name="age"]', 'input[placeholder*="Возраст"]']);

    var name = (nameInput ? nameInput.value : '').trim();
    var phone = (phoneInput ? phoneInput.value : '').trim();
    var age = (ageInput ? ageInput.value : '').trim();
    var path = window.location.pathname;
    var label = PAGE_LABELS[path] || document.title || path;

    var _p = new URLSearchParams(window.location.search);
    var fields = {
      name: "'" + name,
      phone: "'" + phone,
      age: age || '',
      page_url: window.location.href || document.URL || '',
      page_path: path,
      page_title: document.title,
      page_label: label,
      lead_id: Date.now() + '_' + Math.random().toString(36).slice(2, 10),
      request_source: 'form_js_v2'
    };

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'].forEach(function (k) {
      var v = _p.get(k);
      if (v) fields[k] = v;
    });

    return fields;
  }

  function isFieldsValid(fields) {
    var rawName = (fields.name || '').replace(/^'/, '').trim();
    var rawPhone = (fields.phone || '').replace(/^'/, '').trim();
    if (rawName.length < 2) return false;
    if (!isValidRuPhone(rawPhone)) return false;
    return true;
  }

  function sendForm(fields) {
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
        inp.value = String(fields[k]);
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
    console.log('Kotiksym form submit:', JSON.stringify(fields));
    form.submit();

    setTimeout(function () {
      try { document.body.removeChild(form); } catch (e) {}
    }, 200);

    if (window.ym) {
      ym(110489022, 'reachGoal', 'lead_form_submit');
    }
  }

  function handleSubmit(originalEvent) {
    // Block double submissions
    if (isSubmitting) {
      console.log('Kotiksym form: already submitting, ignored');
      return;
    }

    // Prevent all other handlers from firing
    if (originalEvent) {
      originalEvent.preventDefault();
      originalEvent.stopPropagation();
      originalEvent.stopImmediatePropagation();
    }

    var fields = collectFields();

    if (!isFieldsValid(fields)) {
      alert('Заполните имя и телефон');
      return;
    }

    isSubmitting = true;
    sendForm(fields);

    // Reset cooldown
    setTimeout(function () {
      isSubmitting = false;
    }, SUBMIT_COOLDOWN);
  }

  // --- Bind to all possible click points ---

  // 1. Direct click on data-submit buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-submit], button[data-submit], .form-button, button[onClick*="onSubmit"]');
    if (!btn) return;
    handleSubmit(e);
  }, true); // capture phase

  // 2. Also intercept if Zero Block's React component dispatches submit
  // Override the component's onSubmit reference by patching state setter
  var _origSetState = null;
  var dcCheck = setInterval(function () {
    var dcScript = document.querySelector('script[data-dc-script]');
    if (!dcScript) return;
    // Check if the component has the state prop
    var comp = document.querySelector('x-dc');
    if (comp && comp.__dcComponent) {
      clearInterval(dcCheck);
    }
  }, 1000);

  console.log('Kotiksym form handler v2 loaded');
})();
