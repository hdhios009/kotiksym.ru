/*
 * Колесо скидок на первый абонемент.
 * Результат хранится в браузере: обновление страницы его не сбрасывает,
 * повторно крутить нельзя. Если окно закрыли без спина — остаётся скидка 10%.
 */
(() => {
  const config = {
    deadline: '2099-11-30T23:59:59+03:00',
    showAfterMs: 900,
    showAfterScroll: 0.45,
    unspunDiscount: 10,
    storageKey: 'kotiksum_wheel_v1'
  };
  const values = [10, 5, 15, 7, 10, 12, 5, 10, 7, 15];
  const deadline = Date.parse(config.deadline);
  const active = () => Date.now() <= deadline;
  const dialog = document.getElementById('kg-dialog');
  const gift = document.querySelector('[data-kg-gift]');
  const giftValue = gift && gift.querySelector('[data-kg-gift-value]');
  const giftLabel = gift && gift.querySelector('.kg-gift-label-text');
  const form = document.getElementById('form');
  if (!active() || !dialog || typeof dialog.showModal !== 'function' || !form || !gift) return;

  const root = document.documentElement;
  const rotor = dialog.querySelector('.kg-rotor');
  const spinView = dialog.querySelector('[data-kg-spin-view]');
  const resultView = dialog.querySelector('[data-kg-result-view]');
  const spin = dialog.querySelector('[data-kg-spin]');
  const hub = dialog.querySelector('[data-kg-hub]');
  const resultValue = dialog.querySelector('[data-kg-result-value]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let spinTimer;
  let revealTimer;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(config.storageKey) || 'null') || {};
      const prize = values.includes(saved.prize) || saved.prize === config.unspunDiscount ? saved.prize : null;
      if (!prize) {
        if (saved.phase === 'open' || saved.shown) {
          return { phase: 'deferred', prize: config.unspunDiscount, index: null };
        }
        return { phase: 'fresh', prize: null, index: null };
      }
      const index = Number.isInteger(saved.index) && values[saved.index] === prize ? saved.index : values.indexOf(prize);
      const phase = saved.phase === 'accepted' || saved.sent ? 'accepted' : 'deferred';
      return { phase, prize, index: index >= 0 ? index : null };
    } catch (e) {
      return { phase: 'fresh', prize: null, index: null };
    }
  }

  const state = load();

  function save() {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify({
        phase: state.phase,
        prize: state.prize,
        index: state.index,
        shown: state.phase !== 'fresh',
        sent: state.phase === 'accepted'
      }));
    } catch (e) {}
  }

  function refreshGift() {
    const visible = active() && state.phase === 'deferred' && Boolean(state.prize);
    gift.hidden = !visible;
    root.classList.toggle('kg-deferred', visible);
    if (!visible) return;
    giftValue.textContent = '−' + state.prize + '%';
    if (giftLabel) giftLabel.textContent = 'Получить скидку';
    gift.setAttribute('aria-label', 'Получить скидку ' + state.prize + '%');
  }

  function applyDiscount() {
    if (!state.prize) return;
    const grid = form.querySelector('[data-formgrid]') || form;
    let discount = form.querySelector('input[name="Скидка"]');
    if (!discount) {
      discount = document.createElement('input');
      discount.type = 'hidden';
      discount.name = 'Скидка';
      discount.id = 'f_discount';
      discount.setAttribute('data-kg-discount', '');
      grid.appendChild(discount);
    }
    discount.value = state.prize + '% на первый абонемент (колесо)';
    let note = form.querySelector('[data-kg-discount-note]');
    if (!note) {
      note = document.createElement('p');
      note.className = 'kg-discount-note';
      note.setAttribute('data-kg-discount-note', '');
      form.insertBefore(note, form.firstChild);
    }
    note.textContent = 'Скидка ' + state.prize + '%';
  }

  function clearDiscount() {
    form.querySelector('[data-kg-discount]')?.remove();
    form.querySelector('[data-kg-discount-note]')?.remove();
  }

  function goToForm() {
    if (!active() || !state.prize) return;
    if (state.phase !== 'accepted') state.phase = 'deferred';
    save();
    applyDiscount();
    refreshGift();
    if (dialog.open) dialog.close();
    form.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
  }

  function closeOffer() {
    if (!dialog.open) return;
    if (state.phase === 'open' && !state.prize) state.prize = config.unspunDiscount;
    if (state.phase !== 'accepted') state.phase = 'deferred';
    save();
    applyDiscount();
    refreshGift();
    dialog.close();
  }

  function open(titleId) {
    dialog.setAttribute('aria-labelledby', titleId);
    if (!dialog.open) dialog.showModal();
    root.classList.add('kg-open');
    const title = document.getElementById(titleId);
    if (title) title.focus({ preventScroll: true });
  }

  function finalAngle() {
    if (state.index == null || state.index < 0) return 0;
    return (360 - state.index * (360 / values.length)) % 360;
  }

  function showResult() {
    if (!active() || !state.prize) return;
    if (state.phase !== 'accepted') state.phase = 'deferred';
    save();
    applyDiscount();
    if (state.index != null && state.index >= 0) {
      rotor.style.transform = 'rotate(' + finalAngle() + 'deg)';
    }
    hub.disabled = true;
    spin.disabled = true;
    resultValue.textContent = state.prize + '%';
    spinView.hidden = true;
    resultView.hidden = false;
    open('kg-result-title');
  }

  function spinWheel() {
    if (!active() || state.phase !== 'open' || state.prize) return;
    state.index = Math.floor(Math.random() * values.length);
    state.prize = values[state.index];
    state.phase = 'pending';
    save();
    spin.disabled = true;
    hub.disabled = true;
    spin.textContent = 'Крутим…';
    rotor.style.transform = 'rotate(' + ((reducedMotion.matches ? 0 : 2160) + finalAngle()) + 'deg)';
    spinTimer = setTimeout(() => {
      if (dialog.open) showResult();
    }, reducedMotion.matches ? 170 : 4750);
  }

  spin.addEventListener('click', spinWheel);
  hub.addEventListener('click', spinWheel);
  dialog.querySelector('.kg-close').addEventListener('click', closeOffer);
  dialog.querySelector('[data-kg-later]').addEventListener('click', closeOffer);
  dialog.querySelector('[data-kg-accept]').addEventListener('click', goToForm);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeOffer();
  });
  dialog.addEventListener('close', () => {
    clearTimeout(spinTimer);
    root.classList.remove('kg-open');
  });
  gift.addEventListener('click', event => {
    event.preventDefault();
    goToForm();
  });
  document.addEventListener('kotiksym-lead-sent', () => {
    if (!state.prize) return;
    state.phase = 'accepted';
    save();
    applyDiscount();
    refreshGift();
  });

  function reveal() {
    clearTimeout(revealTimer);
    window.removeEventListener('scroll', onScroll);
    if (!active() || state.phase !== 'fresh') return;
    state.phase = 'open';
    save();
    spinView.hidden = false;
    resultView.hidden = true;
    hub.disabled = false;
    spin.disabled = false;
    open('kg-spin-title');
  }

  function onScroll() {
    const distance = root.scrollHeight - window.innerHeight;
    if (distance > 0 && window.scrollY / distance >= config.showAfterScroll) reveal();
  }

  refreshGift();
  if (state.prize) applyDiscount();
  if (state.phase === 'fresh') {
    window.addEventListener('scroll', onScroll, { passive: true });
    revealTimer = setTimeout(reveal, config.showAfterMs);
  }

  const remaining = deadline - Date.now() + 1;
  if (remaining > 0 && remaining < 2147483647) {
    setTimeout(() => {
      if (dialog.open) dialog.close();
      state.phase = 'accepted';
      refreshGift();
      clearDiscount();
    }, remaining);
  }

  window.kotiksumWheelReset = () => {
    try { localStorage.removeItem(config.storageKey); } catch (e) {}
  };
})();
