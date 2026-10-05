/**
 * Окно «Заявка отправлена» с подарком. Общее для всех сайтов.
 * Настройка — атрибутами на своём теге script:
 *   data-gift-url      — ссылка на подарок (обязательна, иначе кнопки не будет);
 *   data-channel-url   — ссылка на канал (без неё вторая кнопка не выводится);
 *   data-channel-label — подпись второй кнопки;
 *   data-accent        — основной цвет;
 *   data-logo          — картинка в шапке окна;
 *   data-title         — заголовок;
 *   data-text          — текст под заголовком.
 */
(function () {
  'use strict';

  if (window.KotiksymGift) return;

  var script = document.currentScript || (function () {
    var all = document.getElementsByTagName('script');
    return all[all.length - 1];
  })();

  function attr(name, fallback) {
    var v = script && script.getAttribute(name);
    return v == null || v === '' ? fallback : v;
  }

  var GIFT_URL = attr('data-gift-url', '');
  var CHANNEL_URL = attr('data-channel-url', '');
  var CHANNEL_LABEL = attr('data-channel-label', 'Перейти в наш канал');
  var GIFT_LABEL = attr('data-gift-label', 'Забрать подарок');
  var ACCENT = attr('data-accent', '#3B4FE0');
  var LOGO = attr('data-logo', '');
  var TITLE = attr('data-title', 'Заявка отправлена');
  var TEXT = attr('data-text', 'Мы свяжемся с вами по указанному номеру. А подарок можно забрать прямо сейчас.');

  var MODAL_ID = 'successModal';
  var root = null;
  var card = null;
  var lastFocus = null;
  var prevOverflow = '';

  function el(tag, style, text) {
    var node = document.createElement(tag);
    if (style) node.setAttribute('style', style);
    if (text != null) node.textContent = text;
    return node;
  }

  /** Внешняя ссылка-кнопка. */
  function linkButton(href, label, style, cta) {
    var a = el('a', style, label);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    if (cta) a.setAttribute('data-cta', cta);
    return a;
  }

  function build() {
    root = el('div', [
      'display:none',
      'position:fixed',
      'inset:0',
      'z-index:2147483000',
      'background:rgba(27,25,54,.55)',
      '-webkit-backdrop-filter:blur(3px)',
      'backdrop-filter:blur(3px)',
      'place-items:center',
      'padding:20px',
      'overflow:auto'
    ].join(';'));
    root.id = MODAL_ID;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', TITLE);

    card = el('div', [
      'position:relative',
      'width:min(430px,100%)',
      'box-sizing:border-box',
      'background:#fff',
      'border-radius:22px',
      'padding:34px 28px 26px',
      'text-align:center',
      'box-shadow:0 30px 80px rgba(27,25,54,.38)',
      'font-family:inherit'
    ].join(';'));

    var close = el('button', [
      'position:absolute',
      'top:12px',
      'right:12px',
      'width:34px',
      'height:34px',
      'border:0',
      'border-radius:10px',
      'background:#F2F2F5',
      'color:#6f6a64',
      'cursor:pointer',
      'font-size:17px',
      'line-height:1',
      'display:grid',
      'place-items:center'
    ].join(';'), '\u2715');
    close.type = 'button';
    close.setAttribute('aria-label', 'Закрыть');
    close.addEventListener('click', hide);
    card.appendChild(close);

    if (LOGO) {
      var logo = document.createElement('img');
      logo.src = LOGO;
      logo.alt = '';
      logo.setAttribute('style', 'width:72px;height:72px;border-radius:18px;object-fit:contain;background:#fff;border:1px solid #ECECF1;padding:7px;margin:0 auto 16px;display:block');
      card.appendChild(logo);
    }

    var badge = el('div', [
      'display:inline-block',
      'padding:6px 13px',
      'border-radius:999px',
      'background:#EAF6EF',
      'color:#1F7A54',
      'font-size:13px',
      'font-weight:600',
      'margin-bottom:13px'
    ].join(';'), 'Заявка отправлена');
    card.appendChild(badge);

    var h = el('h3', [
      'font-weight:700',
      'font-size:23px',
      'line-height:1.2',
      'letter-spacing:-.02em',
      'margin:0 0 10px',
      'color:#1B1936'
    ].join(';'), TITLE);
    card.appendChild(h);

    var p = el('p', [
      'font-size:15px',
      'line-height:1.55',
      'color:#6f6a64',
      'margin:0 0 22px'
    ].join(';'), TEXT);
    card.appendChild(p);

    var actions = el('div', 'display:grid;gap:10px');

    var baseButton = [
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'gap:8px',
      'width:100%',
      'box-sizing:border-box',
      'padding:15px 16px',
      'border-radius:13px',
      'font-weight:700',
      'font-size:16px',
      'text-decoration:none',
      'cursor:pointer'
    ].join(';');

    if (GIFT_URL) {
      actions.appendChild(linkButton(
        GIFT_URL,
        '\uD83C\uDF81 ' + GIFT_LABEL,
        baseButton + ';color:#fff;background:' + ACCENT + ';box-shadow:0 12px 26px rgba(27,25,54,.22)',
        'gift'
      ));
    }

    if (CHANNEL_URL) {
      actions.appendChild(linkButton(
        CHANNEL_URL,
        CHANNEL_LABEL,
        baseButton + ';color:' + ACCENT + ';background:#fff;border:1.5px solid ' + ACCENT,
        'channel'
      ));
    }

    card.appendChild(actions);

    var later = el('button', [
      'margin-top:12px',
      'background:none',
      'border:0',
      'color:#9b9590',
      'font:inherit',
      'font-size:14px',
      'cursor:pointer',
      'text-decoration:underline',
      'text-underline-offset:2px'
    ].join(';'), 'Позже');
    later.type = 'button';
    later.addEventListener('click', hide);
    card.appendChild(later);

    root.appendChild(card);

    root.addEventListener('click', function (e) {
      if (e.target === root) hide();
    });

    document.body.appendChild(root);
  }

  function onKeydown(e) {
    if (e.key === 'Escape' || e.keyCode === 27) hide();
  }

  /** Старое окно из разметки страницы, если оно где-то осталось. */
  function dropLegacy() {
    var nodes = document.querySelectorAll('#' + MODAL_ID);
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] !== root && nodes[i].parentNode) {
        nodes[i].parentNode.removeChild(nodes[i]);
      }
    }
  }

  function ensure() {
    if (!document.body) return false;
    dropLegacy();
    if (!root || !root.parentNode) build();
    return true;
  }

  function show() {
    if (!ensure()) {
      document.addEventListener('DOMContentLoaded', show, { once: true });
      return;
    }
    lastFocus = document.activeElement;
    root.style.display = 'grid';
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);
    var first = card.querySelector('a, button');
    if (first && first.focus) {
      try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
    }
  }

  function hide() {
    if (!root) return;
    root.style.display = 'none';
    document.body.style.overflow = prevOverflow;
    document.removeEventListener('keydown', onKeydown);
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  window.KotiksymGift = {
    show: show,
    hide: hide,
    giftUrl: GIFT_URL,
    channelUrl: CHANNEL_URL
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensure);
  } else {
    ensure();
  }
})();
