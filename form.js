/** Kotiksym — единый обработчик заявок (v5) */
(function () {
  'use strict';

  if (window.__kotiksymFormInit) return;
  window.__kotiksymFormInit = true;

  var GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycby87hWuo9uuhgNc2Lc16C_AnwFB9zVyvh5DTcOUhYVVMD_MaE2YvZtE1otrStmnxDyoJg/exec';
  var ATTR_KEY = 'kotiksym_attribution';
  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'gclid'];
  var TIMEOUT = 18000;
  var CD = 5000;
  var ERR_MSG = 'Не удалось отправить заявку. Попробуйте ещё раз.';
  var busy = false;
  var LABELS = {
    '/': 'Главная КотиксУМ',
    '/chitaet-medlenno/': 'Медленно читает',
    '/ne-ponimaet-tekst/': 'Не понимает текст',
    '/ne-mozhet-pereskazat/': 'Не может пересказать',
    '/domashka-do-vechera/': 'Домашка до вечера',
    '/zabyvaet-prochitannoe/': 'Забывает прочитанное',
    '/boitsya-otvechat/': 'Боится отвечать',
    '/oshibki-po-nevnimatelnosti/': 'Ошибки по невнимательности',
    '/skorochtenie-deti/': 'Скорочтение',
    '/podgotovka-k-shkole/': 'Подготовка к школе',
    '/angliyskiy-yazyk/': 'Английский язык',
    '/pamyat-i-vnimanie/': 'Память и внимание',
    '/logika-i-myshlenie/': 'Логика и мышление',
    '/kalligrafiya-gramotnost/': 'Каллиграфия и грамотность'
  };

  function pick(s) {
    for (var i = 0; i < s.length; i++) {
      var e = document.querySelector(s[i]);
      if (e) return e;
    }
    return null;
  }

  function normalizePath(pathname) {
    var path = pathname || '/';
    if (path === '/index.html') return '/';
    if (path.length > 1 && path.slice(-1) !== '/') path += '/';
    return path;
  }

  function pageName() {
    var path = normalizePath(window.location.pathname);
    return LABELS[path] || document.title || path;
  }

  function readStoredAttr() {
    try {
      var raw = sessionStorage.getItem(ATTR_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeStoredAttr(obj) {
    try {
      sessionStorage.setItem(ATTR_KEY, JSON.stringify(obj || {}));
    } catch (e) {}
  }

  function captureAttribution() {
    var q = new URLSearchParams(window.location.search);
    var stored = readStoredAttr();
    var next = {};
    var i, key, urlVal, storedVal;
    var hasNew = false;

    for (i = 0; i < ATTR_KEYS.length; i++) {
      key = ATTR_KEYS[i];
      urlVal = q.get(key);
      if (urlVal != null && String(urlVal).trim() !== '') {
        next[key] = String(urlVal);
        hasNew = true;
      }
    }

    if (hasNew) {
      for (i = 0; i < ATTR_KEYS.length; i++) {
        key = ATTR_KEYS[i];
        storedVal = stored[key];
        if (next[key] == null || next[key] === '') {
          next[key] = storedVal != null ? String(storedVal) : '';
        }
      }
      writeStoredAttr(next);
      return next;
    }

    for (i = 0; i < ATTR_KEYS.length; i++) {
      key = ATTR_KEYS[i];
      next[key] = stored[key] != null ? String(stored[key]) : '';
    }
    return next;
  }

  function resolveAttribution() {
    var q = new URLSearchParams(window.location.search);
    var stored = readStoredAttr();
    var out = {};
    var i, key, urlVal;
    for (i = 0; i < ATTR_KEYS.length; i++) {
      key = ATTR_KEYS[i];
      urlVal = q.get(key);
      if (urlVal != null && String(urlVal).trim() !== '') {
        out[key] = String(urlVal);
      } else if (stored[key] != null && String(stored[key]).trim() !== '') {
        out[key] = String(stored[key]);
      } else {
        out[key] = '';
      }
    }
    return out;
  }

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


  function getAgeBounds(ageInput) {
    if (!ageInput) return null;
    var minRaw = ageInput.getAttribute('min');
    var maxRaw = ageInput.getAttribute('max');
    if (minRaw == null && maxRaw == null) return null;
    var min = minRaw != null && minRaw !== '' ? parseInt(minRaw, 10) : null;
    var max = maxRaw != null && maxRaw !== '' ? parseInt(maxRaw, 10) : null;
    return {
      min: min != null && !isNaN(min) ? min : null,
      max: max != null && !isNaN(max) ? max : null
    };
  }

  function ageInRange(ageInput, age) {
    if (!age) return true;
    var n = parseInt(String(age).replace(/\D/g, ''), 10);
    if (isNaN(n)) return false;
    var bounds = getAgeBounds(ageInput);
    if (!bounds) return true;
    if (bounds.min != null && n < bounds.min) return false;
    if (bounds.max != null && n > bounds.max) return false;
    return true;
  }

  function isAgeRequired(form) {
    var ageInput = getFieldInput(form, 'age') || document.getElementById('f_age');
    if (!ageInput) return false;
    return ageInput.required || ageInput.getAttribute('aria-required') === 'true' || ageInput.hasAttribute('data-required');
  }

  function ensureHoneypot(form) {
    if (!form || form.querySelector('input[name="website"]')) return;
    var wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;';
    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'website';
    input.id = 'f_website';
    input.tabIndex = -1;
    input.autocomplete = 'off';
    input.setAttribute('autofill', 'off');
    input.value = '';
    wrap.appendChild(input);
    form.style.position = form.style.position || 'relative';
    form.appendChild(wrap);
  }

  // ── Form setup ──
  function setupForm() {
    var form = document.querySelector('[data-formgrid]');
    if (!form) return;

    ensureHoneypot(form);

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
        var cleaned = (ageInput.value || '').replace(/\D/g, '');
        if (cleaned !== ageInput.value) ageInput.value = cleaned;
        showFieldError(form, 'age', '');
      });
      ageInput.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
      });
    }
  }

  // ── Phone input mask ──
  // National 10 digits only (without country code). +7 is always the display prefix.
  function toNationalDigits(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits[0] === '7') digits = digits.slice(1);
    if (digits.length > 10) digits = digits.slice(0, 10);
    return digits;
  }

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
      var digits = toNationalDigits(pasted);
      if (digits.length > 0 || String(pasted || '').replace(/\D/g, '').length > 0) {
        e.preventDefault();
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
        var national = toNationalDigits(p.value);
        if (national.length === 0) setCaret(p, p.value.length);
      }
    });
    p.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && p.selectionStart <= 3 && p.selectionEnd <= 3) {
        e.preventDefault();
        if (p.setSelectionRange) p.setSelectionRange(3, 3);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 && !/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    });
  }

  function maskPhone(digits) {
    digits = toNationalDigits(digits);
    var r = '+7 ';
    if (digits.length > 0) r += '(' + digits.slice(0, 3);
    if (digits.length > 3) r += ') ' + digits.slice(3, 6);
    if (digits.length > 6) r += '-' + digits.slice(6, 8);
    if (digits.length > 8) r += '-' + digits.slice(8, 10);
    return r;
  }

  function formatPhoneInput(p) {
    var national = toNationalDigits(p.value);
    var masked = maskPhone(national);
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
    var national = toNationalDigits(val);
    if (!national) return '';
    return '+7' + national;
  }

  function phoneOK(v) {
    return toNationalDigits(v).length === 10;
  }

  function honeypotValue() {
    var hp = document.querySelector('#f_website, input[name="website"]');
    return hp ? String(hp.value || '') : '';
  }

  // ── Collect form fields ──
  function collect() {
    var n = pick(['#f_name', '[name="Имя"]', '[name="name"]', 'input[placeholder*="Ваше имя"]', 'input[placeholder*="ваше имя"]']);
    var p = pick(['#f_phone', '[name="Телефон"]', '[name="phone"]', 'input[inputMode="tel"]']);
    var a = pick(['#f_age', '[name="Возраст ребёнка"]', '[name="age"]', 'input[placeholder*="Возраст"]']);
    var attr = resolveAttribution();
    var name = (n ? n.value : '').trim();
    var phone = rawPhone(p ? p.value : '');
    var age = (a ? a.value : '').trim() || '';
    var f = {
      name: name,
      phone: phone,
      age: age,
      page_url: window.location.href,
      page_name: pageName(),
      referrer: document.referrer || '',
      utm_source: attr.utm_source || '',
      utm_medium: attr.utm_medium || '',
      utm_campaign: attr.utm_campaign || '',
      utm_content: attr.utm_content || '',
      utm_term: attr.utm_term || '',
      yclid: attr.yclid || '',
      gclid: attr.gclid || '',
      website: honeypotValue()
    };
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

  function setBusy(btn, on, origText) {
    if (!btn) return;
    if (on) {
      btn.textContent = 'Отправляем…';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      busy = true;
    } else {
      btn.textContent = origText;
      btn.disabled = false;
      btn.style.opacity = '1';
      busy = false;
    }
  }

  function send(fields) {
    var payload = new URLSearchParams();
    Object.keys(fields).forEach(function (k) {
      payload.set(k, fields[k] == null ? '' : String(fields[k]));
    });

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = null;
    var req = fetch(GAS_ENDPOINT, {
      method: 'POST',
      body: payload,
      signal: controller ? controller.signal : undefined
    });

    var timeoutPromise = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        if (controller) controller.abort();
        reject(new Error('timeout'));
      }, TIMEOUT);
    });

    return Promise.race([req, timeoutPromise]).then(function (res) {
      clearTimeout(timer);
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
        if (res.ok && data && data.ok === true) return data;
        // Readable non-ok JSON / unexpected body
        throw new Error('bad_response');
      });
    }).catch(function (err) {
      clearTimeout(timer);
      // Opaque / CORS-read failures are unlikely here (endpoint allows CORS),
      // but if POST reached the server and browser blocks body, treat network-only failures as error.
      throw err;
    });
  }

  function onClick(e) {
    var btn = e.target.closest('[data-submit]');
    if (!btn) return;
    e.preventDefault();
    if (busy) return;

    var form = document.querySelector('[data-formgrid]');
    var f = collect();
    var name = f.name;
    var phone = f.phone;
    var age = f.age;

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
    var ageInput = getFieldInput(form, 'age') || document.getElementById('f_age');
    if (age && !ageInRange(ageInput, age)) {
      var bounds = getAgeBounds(ageInput) || {};
      var min = bounds.min != null ? bounds.min : 4;
      var max = bounds.max != null ? bounds.max : 16;
      showFieldError(form, 'age', 'Возраст ребёнка — от ' + min + ' до ' + max + ' лет');
      return;
    }

    var orig = btn.textContent;
    setBusy(btn, true, orig);

    send(f).then(function () {
      clearInputs();
      clearAllFieldErrors(form);
      var m = document.getElementById('successModal');
      if (m) m.style.display = 'grid';
      if (window.ym) ym(110489022, 'reachGoal', 'lead_form_submit');
      // Keep momentary lock against instant resubmit; then restore button.
      setTimeout(function () {
        setBusy(btn, false, orig);
      }, CD);
    }).catch(function () {
      setBusy(btn, false, orig);
      alert(ERR_MSG);
    });
  }

  function init() {
    captureAttribution();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupForm);
    } else {
      setupForm();
    }
  }

  init();
  document.addEventListener('click', onClick);

  // Test/debug hook (no UI impact)
  window.__kotiksymForm = {
    GAS_ENDPOINT: GAS_ENDPOINT,
    LABELS: LABELS,
    collect: collect,
    captureAttribution: captureAttribution,
    resolveAttribution: resolveAttribution,
    pageName: pageName,
    normalizePath: normalizePath,
    ATTR_KEY: ATTR_KEY
  };

  console.log('Kotiksym form v5 loaded');
})();
