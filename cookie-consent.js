/** Cookie consent: blocks Yandex Metrika until the visitor opts in. */
(function () {
  'use strict';
  if (window.__pdCookieConsent) return;
  window.__pdCookieConsent = true;

  var script = document.currentScript;
  var YM_ID = parseInt((script && script.getAttribute('data-ym-id')) || '0', 10) || 0;
  var COOKIE_PAGE = (script && script.getAttribute('data-cookie-page')) || '/cookies/';
  var PRIVACY_PAGE = (script && script.getAttribute('data-privacy-page')) || '/privacy/';
  var ACCENT = (script && script.getAttribute('data-accent')) || '#3B4FE0';
  var KEY = 'pd_cookie_consent_v1';
  var metrikaLoaded = false;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.analytics !== 'boolean') return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function write(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        necessary: true,
        analytics: !!state.analytics,
        marketing: !!state.marketing,
        ts: Date.now()
      }));
    } catch (e) {}
  }

  function loadMetrika() {
    if (!YM_ID || metrikaLoaded) return;
    metrikaLoaded = true;
    var src = 'https://mc.yandex.ru/metrika/tag.js?id=' + YM_ID;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < e.scripts.length; j++) {
        if (e.scripts[j].src === r) return;
      }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', src, 'ym');
    ym(YM_ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }

  function cookieDomains() {
    var host, labels, list = [''], i;
    try { host = location.hostname.replace(/^www\./, ''); } catch (e) { return list; }
    if (!host || /^[\d.]+$/.test(host)) return list;
    labels = host.split('.');
    for (i = 0; i + 2 <= labels.length; i++) {
      list.push('; domain=.' + labels.slice(i).join('.'));
    }
    return list;
  }

  function clearYmCookies() {
    var parts = ('; ' + document.cookie).split('; ');
    var domains = cookieDomains();
    var i, j, name;
    for (i = 0; i < parts.length; i++) {
      name = parts[i].split('=')[0];
      if (!name) continue;
      if (name.indexOf('_ym') === 0 || name === 'yabs-sid' || name === 'yandexuid') {
        for (j = 0; j < domains.length; j++) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + domains[j];
        }
      }
    }
  }

  function apply(state, changed) {
    write(state);
    if (state.analytics) {
      loadMetrika();
    } else if (changed && metrikaLoaded) {
      clearYmCookies();
      location.reload();
    } else {
      clearYmCookies();
    }
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    var k;
    attrs = attrs || {};
    for (k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (k === 'css') node.style.cssText = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function btnStyle(filled) {
    return [
      'appearance:none;border:0;cursor:pointer;font:inherit;font-weight:700;font-size:14px;',
      'padding:11px 16px;border-radius:10px;line-height:1.2;',
      filled
        ? 'background:' + ACCENT + ';color:#fff;'
        : 'background:#fff;color:#1C1B29;border:1px solid #D8D0C4;'
    ].join('');
  }

  var overlay = null;

  function closeUi() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  function renderSettings(current) {
    closeUi();
    var analyticsOn = current ? !!current.analytics : false;
    var marketingOn = current ? !!current.marketing : false;
    var checkA;
    var checkM;

    overlay = el('div', {
      id: 'pd-cookie-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'pd-cookie-title',
      css: 'position:fixed;inset:0;z-index:2147483000;background:rgba(28,27,41,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px;box-sizing:border-box;'
    });

    var card = el('div', {
      css: 'width:min(560px,100%);background:#FFFDF9;color:#1C1B29;border:1px solid #E4D8C2;border-radius:18px;padding:22px 20px 18px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;box-sizing:border-box;'
    });

    card.appendChild(el('div', {
      id: 'pd-cookie-title',
      text: 'Настройки cookie',
      css: 'font-weight:800;font-size:18px;letter-spacing:-.02em;margin:0 0 8px;'
    }));
    card.appendChild(el('p', {
      css: 'margin:0 0 16px;font-size:14px;line-height:1.5;color:#5c5852;',
      html: 'Необходимые cookie нужны, чтобы отправить заявку. Аналитика и реклама включаются только с вашего согласия. Подробнее — на странице <a href="' + COOKIE_PAGE + '" style="color:' + ACCENT + '">информирования о файлах cookie</a> и в <a href="' + PRIVACY_PAGE + '" style="color:' + ACCENT + '">политике</a>.'
    }));

    function row(label, hint, checked, disabled) {
      var input = el('input', {
        type: 'checkbox',
        css: 'width:18px;height:18px;margin-top:2px;flex:0 0 auto;accent-color:' + ACCENT + ';'
      });
      input.checked = !!checked;
      input.disabled = !!disabled;
      var wrap = el('label', {
        css: 'display:flex;gap:10px;align-items:flex-start;padding:12px 0;border-top:1px solid #EFE6D4;cursor:' + (disabled ? 'default' : 'pointer') + ';'
      }, [
        input,
        el('span', {}, [
          el('strong', { text: label, css: 'display:block;font-size:14px;' }),
          el('span', { text: hint, css: 'display:block;margin-top:4px;font-size:13px;color:#6f6a64;line-height:1.45;' })
        ])
      ]);
      return { wrap: wrap, input: input };
    }

    var nec = row('Необходимые', 'Работа формы заявки и сохранение вашего выбора cookie. Всегда включены.', true, true);
    nec.input.checked = true;
    card.appendChild(nec.wrap);

    if (YM_ID) {
      checkA = row('Аналитические', 'Яндекс.Метрика: посещения, карта кликов и вебвизор. Без согласия счётчик не загружается.', analyticsOn, false);
      card.appendChild(checkA.wrap);
    } else {
      card.appendChild(row('Аналитические', 'На этом сайте аналитический счётчик не подключён.', false, true).wrap);
    }

    checkM = row('Рекламные', 'Рекламные и маркетинговые пиксели сейчас не используются. Переключатель оставлен на случай их появления.', marketingOn, false);
    card.appendChild(checkM.wrap);

    var actions = el('div', {
      css: 'display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:16px;'
    });
    var save = el('button', { type: 'button', text: 'Сохранить', css: btnStyle(true) });
    save.addEventListener('click', function () {
      apply({
        analytics: YM_ID ? !!(checkA && checkA.input.checked) : false,
        marketing: !!(checkM && checkM.input.checked)
      }, true);
      closeUi();
    });
    actions.appendChild(save);
    card.appendChild(actions);
    overlay.appendChild(card);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay && read()) closeUi();
    });
    document.body.appendChild(overlay);
  }

  function renderBanner() {
    closeUi();
    overlay = el('div', {
      id: 'pd-cookie-banner',
      role: 'dialog',
      'aria-live': 'polite',
      'aria-label': 'Согласие на файлы cookie',
      css: 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;padding:12px;box-sizing:border-box;pointer-events:none;'
    });
    var card = el('div', {
      css: 'pointer-events:auto;width:min(920px,100%);margin:0 auto;background:#1C1B29;color:#fff;border-radius:16px;padding:18px 18px 16px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;box-sizing:border-box;'
    });
    var copy = YM_ID
      ? 'Мы используем необходимые cookie, чтобы форма заявки работала. Яндекс.Метрику и рекламные скрипты подключаем только после согласия. Можно принять всё, оставить только необходимые или настроить отдельно.'
      : 'Мы используем необходимые cookie, чтобы форма заявки работала. Аналитические и рекламные скрипты на этом сайте сейчас не подключены. Подробности — в информировании о cookie.';
    card.appendChild(el('div', {
      text: 'Файлы cookie',
      css: 'font-weight:800;font-size:16px;margin:0 0 6px;'
    }));
    card.appendChild(el('p', {
      css: 'margin:0 0 14px;font-size:13.5px;line-height:1.5;color:rgba(255,255,255,.82);',
      html: copy + ' <a href="' + COOKIE_PAGE + '" style="color:#fff;text-decoration:underline;">Подробнее</a>'
    }));
    var actions = el('div', {
      css: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;'
    });
    var accept = el('button', { type: 'button', text: 'Принять', css: btnStyle(true) });
    var necessary = el('button', { type: 'button', text: 'Только необходимые', css: btnStyle(false) });
    var settings = el('button', { type: 'button', text: 'Настроить', css: btnStyle(false) });
    accept.addEventListener('click', function () {
      apply({ analytics: !!YM_ID, marketing: false }, false);
      closeUi();
    });
    necessary.addEventListener('click', function () {
      apply({ analytics: false, marketing: false }, false);
      closeUi();
    });
    settings.addEventListener('click', function () {
      renderSettings({ analytics: false, marketing: false });
    });
    actions.appendChild(accept);
    actions.appendChild(necessary);
    actions.appendChild(settings);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function openSettings() {
    renderSettings(read() || { analytics: false, marketing: false });
  }

  window.pdCookieConsent = {
    open: openSettings,
    get: read
  };

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
    if (!t) return;
    var href = (t.getAttribute('href') || '').trim();
    if (t.tagName === 'A' && href && href !== '#') return;
    e.preventDefault();
    openSettings();
  });

  var existing = read();
  if (existing && existing.analytics) {
    loadMetrika();
  } else {
    // Посетители, заходившие до появления баннера, могли получить cookie Метрики.
    clearYmCookies();
  }

  function bootUi() {
    if (!read()) renderBanner();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootUi);
  } else {
    bootUi();
  }
})();
