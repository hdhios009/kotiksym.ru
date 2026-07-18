/** Kotiksym — единый обработчик заявок (v4) */
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
  function pick(s) { for (var i = 0; i < s.length; i++) { var e = document.querySelector(s[i]); if (e) return e; } return null; }

  // ── Error display (field-scoped) ──
  function showFieldError(form, fieldName, message) {
    if (!form) return;
    var error = form.querySelector('[data-error-for="' + fieldName + '"]');
    var field = form.querySelector('[data-field="' + fieldName + '"]');
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
    if (field) {
      field.classList.toggle('has-error', Boolean(message));
    }
  }

  function clearAllFieldErrors(form) {
    showFieldError(form, 'name', '');
    showFieldError(form, 'phone', '');
    showFieldError(form, 'age', '');
  }

  function getFieldInput(form, fieldName) {
    var field = form.querySelector('[data-field="' + fieldName + '"]');
    if (!field) return null;
    return field.querySelector('input, select, textarea');
  }

  function isAgeRequired(form) {
    var ageInput = getFieldInput(form, 'age') || document.getElementById('f_age');
    if (!ageInput) return false;
    return ageInput.required || ageInput.getAttribute('aria-required') === 'true' || ageInput.hasAttribute('data-required');
  }

  // ── Form setup ──
  function setupForm() {
    var form = document.querySelector('[data-formgrid]');
    if (!form) return;

    var nameInput = getFieldInput(form, 'name') || document.getElementById('f_name');
    var phoneInput = getFieldInput(form, 'phone') || document.getElementById('f_phone');
    var ageInput = getFieldInput(form, 'age') || document.getElementById('f_age');

    if (nameInput) {
      nameInput.addEventListener('input', function () {
        showFieldError(form, 'name', '');
      });
    }
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        showFieldError(form, 'phone', '');
      });
      initPhoneMask(phoneInput);
    }
    if (ageInput) {
      ageInput.addEventListener('input', function () {
        showFieldError(form, 'age', '');
      });
    }
  }

  // ── Phone input mask ──
  function initPhoneMask(p) {
    p.type = 'tel';
    p.inputMode = 'numeric';
    p.autocomplete = 'tel';
    p.placeholder = '+7 (___) ___-__-__';
    p.addEventListener('input', function () {
      formatPhoneInput(p);
    });
    p.addEventListener('paste', function (e) {
      var pasted = (e.clipboardData || window.clipboardData).getData('text');
      var digits = pasted.replace(/\D/g, '');
      if (digits.length > 0) {
        e.preventDefault();
        if (digits.length === 11 && digits[0] === '8') {
          digits = digits.slice(1);
        } else if (digits.length === 11 && digits[0] === '7') {
          digits = digits.slice(1);
        } else if (digits.length === 10) {
          // keep
        } else if (digits.length > 11) {
          digits = digits.slice(-10);
        }
        if (digits.length > 10) digits = digits.slice(0, 10);
        var masked = maskPhone(digits);
        p.value = masked;
        setCaret(p, masked.length);
        var evt = new Event('input', { bubbles: true });
        p.dispatchEvent(evt);
      }
    });
    p.addEventListener('focus', function () {
      if (p.value === '' || p.value === '+7') {
        p.value = '+7 ';
        setCaret(p, 3);
      } else {
        var raw = (p.value || '').replace(/\D/g, '');
        if (raw.length <= 1) setCaret(p, p.value.length);
      }
    });
    p.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && p.selectionStart <= 3) {
        e.preventDefault();
        if (p.setSelectionRange) p.setSelectionRange(3, 3);
      }
    });
  }

  function maskPhone(digits) {
    digits = digits.replace(/\D/g, '');
    if (digits.length > 10) digits = digits.slice(0, 10);
    var r = '+7 ';
    if (digits.length > 0) r += '(' + digits.slice(0, 3);
    if (digits.length > 3) r += ') ' + digits.slice(3, 6);
    if (digits.length > 6) r += '-' + digits.slice(6, 8);
    if (digits.length > 8) r += '-' + digits.slice(8, 10);
    return r;
  }

  function formatPhoneInput(p) {
    var raw = (p.value || '').replace(/\D/g, '');
    if (raw.length > 1) {
      if (raw[0] === '8') raw = '7' + raw.slice(1);
      if (raw.length > 1 && raw[0] === '7') raw = raw.slice(1);
    }
    var masked = maskPhone(raw);
    if (masked !== p.value) {
      var oldLen = p.value.length;
      var oldPos = p.selectionStart;
      p.value = masked;
      var newLen = masked.length;
      if (oldPos >= oldLen - 1 || oldPos > newLen) {
        setCaret(p, newLen);
      } else {
        setCaret(p, Math.min(oldPos + (newLen - oldLen) + 1, newLen));
      }
    }
  }

  function setCaret(el, pos) {
    if (el.setSelectionRange) {
      setTimeout(function () { el.setSelectionRange(pos, pos); }, 0);
    }
  }

  function rawPhone(val) {
    var d = (val || '').replace(/\D/g, '');
    if (d.length < 2) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d.length === 10 && d[0] !== '7') d = '7' + d;
    if (d.length > 11) d = d.slice(0, 11);
    return '+' + d;
  }

  function phoneOK(v) {
    var d = (v || '').replace(/\D/g, '');
    return d.length === 11 && d[0] === '7';
  }

  // ── Collect form fields ──
  function collect() {
    var n = pick(['#f_name', '[name="Имя"]', '[name="name"]', 'input[placeholder*="Ваше имя"]', 'input[placeholder*="ваше имя"]']);
    var p = pick(['#f_phone', '[name="Телефон"]', '[name="phone"]', 'input[inputMode="tel"]']);
    var a = pick(['#f_age', '[name="Возраст ребёнка"]', '[name="age"]', 'input[placeholder*="Возраст"]']);
    var path = window.location.pathname;
    var href = location.href;
    var title = document.title;
    var label = LABELS[path] || title || path;
    var q = new URLSearchParams(location.search);
    var name = (n ? n.value : '').trim();
    var phone = rawPhone(p ? p.value : '');
    var age = (a ? a.value : '').trim() || '';
    var f = {
      name: name,
      phone: phone,
      age: age,
      page_url: href,
      page_path: path,
      page_title: title,
      page_label: label,
      'Имя': name,
      'Телефон': phone,
      'Возраст ребёнка': age,
      'Страница заявки': href,
      'Путь страницы': path,
      'Заголовок страницы': title,
      'Источник заявки': label,
      'Источник (referrer)': document.referrer || 'прямой заход',
      lead_id: Date.now() + '_' + Math.random().toString(36).slice(2, 10),
      request_source: 'form_js_v4'
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid']
      .forEach(function (k) { var v = q.get(k); if (v) f[k] = v; });
    return f;
  }

  function clearInputs() {
    var n = document.getElementById('f_name') || pick(['[name="Имя"]', '[name="name"]']);
    var p = document.getElementById('f_phone') || pick(['[name="Телефон"]', 'input[inputMode="tel"]']);
    var a = document.getElementById('f_age') || pick(['[name="Возраст ребёнка"]', 'input[placeholder*="Возраст"]']);
    if (n) n.value = '';
    if (p) p.value = '';
    if (a) a.value = '';
  }

  function send(fields, ok, fail) {
    var f = document.createElement('form');
    f.method = 'POST'; f.action = GAS; f.target = 'kf'; f.style.display = 'none';
    for (var k in fields) {
      if (!fields.hasOwnProperty(k)) continue;
      var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = String(fields[k]); f.appendChild(i);
    }
    var ifr = document.getElementById('kf');
    if (!ifr) { ifr = document.createElement('iframe'); ifr.id = 'kf'; ifr.name = 'kf'; ifr.style.display = 'none'; document.body.appendChild(ifr); }
    var done = false,
      timer = setTimeout(function () { if (!done) { done = true; fail('Сервер не отвечает. Попробуйте ещё раз.'); } }, TIMEOUT);
    ifr.onload = function () { if (!done) { done = true; clearTimeout(timer); ok(); } };
    document.body.appendChild(f); f.submit();
    setTimeout(function () { try { if (f.parentNode) f.parentNode.removeChild(f); } catch (e) {} }, 300);
  }

  function onClick(e) {
    var btn = e.target.closest('[data-submit]');
    if (!btn) return;
    e.preventDefault();
    if (busy) return;

    var form = document.querySelector('[data-formgrid]');
    var f = collect();
    var name = f['Имя'],
      phone = f['Телефон'],
      age = f['Возраст ребёнка'];

    clearAllFieldErrors(form);

    if (name.length < 2) {
      showFieldError(form, 'name', 'Введите имя');
      return;
    }
    if (!phoneOK(phone)) {
      showFieldError(form, 'phone', 'Введите номер полностью');
      return;
    }
    if (isAgeRequired(form) && !age) {
      showFieldError(form, 'age', 'Укажите возраст ребёнка');
      return;
    }

    var orig = btn.textContent;
    btn.textContent = 'Отправляем…';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    busy = true;
    send(f,
      function () {
        btn.textContent = orig;
        btn.disabled = false;
        btn.style.opacity = '1';
        busy = false;
        clearInputs();
        clearAllFieldErrors(form);
        var m = document.getElementById('successModal');
        if (m) m.style.display = 'grid';
        if (window.ym) ym(110489022, 'reachGoal', 'lead_form_submit');
      },
      function (msg) {
        btn.textContent = orig;
        btn.disabled = false;
        btn.style.opacity = '1';
        busy = false;
        if (msg) alert(msg);
      }
    );
    setTimeout(function () { busy = false; }, CD);
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupForm);
    } else {
      setupForm();
    }
  }
  init();
  document.addEventListener('click', onClick);
  console.log('Kotiksym form v4 loaded');
})();
