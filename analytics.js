/** Kotiksym — click events for Yandex Metrika (does not fire lead_form_submit). */
(function () {
  'use strict';
  if (window.__kotiksymAnalytics) return;
  window.__kotiksymAnalytics = true;

  var YM_ID = 110489022;
  var firedStart = false;

  function goal(name) {
    if (!name || typeof ym !== 'function') return;
    try {
      ym(YM_ID, 'reachGoal', name);
    } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest
      ? e.target.closest('a,button,[data-cta],[data-direction]')
      : null;
    if (!el) return;

    var href = (el.getAttribute('href') || '').trim();
    var cta = el.getAttribute('data-cta') || '';
    var dir = el.getAttribute('data-direction') || '';
    var isGift =
      cta === 'gift' ||
      href.indexOf('#gift') !== -1 ||
      href.indexOf('kotiksymgiftbot') !== -1;
    var isTel = href.indexOf('tel:') === 0;
    var isTelegram =
      !isGift &&
      (href.indexOf('t.me/') !== -1 || href.indexOf('telegram.me/') !== -1);
    var isMax = !isGift && href.indexOf('max.ru/') !== -1;
    var isMap =
      href.indexOf('yandex.ru/maps') !== -1 ||
      href.indexOf('yandex.ru/map-widget') !== -1;
    var isDiagnostic =
      cta === 'diagnostic' || href === '#form' || href.indexOf('#form') !== -1;

    if (isDiagnostic) goal('cta_diagnostic_click');
    if (isGift) goal('gift_click');
    if (dir === 'skorochtenie') goal('direction_skorochtenie_click');
    if (dir === 'school') goal('direction_school_click');
    if (dir === 'english') goal('direction_english_click');
    if (isTel) goal('phone_click');
    if (isTelegram) goal('telegram_click');
    if (isMax) goal('max_click');
    if (isMap) goal('map_click');
  });

  var formRoot = document.getElementById('form');
  if (formRoot) {
    formRoot.addEventListener(
      'focusin',
      function () {
        if (firedStart) return;
        firedStart = true;
        goal('lead_form_start');
      },
      true
    );
  }
})();
