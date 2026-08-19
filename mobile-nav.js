/* Compact accessible mobile navigation — shared by all pages.
   Uses event delegation so it survives support.js DOM rewrites. */
(function () {
  "use strict";

  function btn() {
    return document.querySelector("[data-nav-burger]");
  }
  function panel() {
    return document.querySelector("[data-mobile-nav]");
  }

  function isOpen() {
    var b = btn();
    return !!(b && b.getAttribute("aria-expanded") === "true");
  }

  function setOpen(next) {
    var b = btn();
    var p = panel();
    if (!b || !p) return;
    var open = !!next;
    b.setAttribute("aria-expanded", open ? "true" : "false");
    b.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    p.classList.toggle("is-open", open);
    if (open) p.removeAttribute("hidden");
    else p.setAttribute("hidden", "");
    document.documentElement.classList.toggle("nav-open", open);
  }

  function syncClosed() {
    var b = btn();
    var p = panel();
    if (!b || !p) return;
    if (b.getAttribute("aria-expanded") == null) {
      setOpen(false);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncClosed);
  } else {
    syncClosed();
  }
  // Re-sync after frameworks/hydration rewrite the header.
  window.addEventListener("load", syncClosed);
  setTimeout(syncClosed, 0);
  setTimeout(syncClosed, 300);

  document.addEventListener("click", function (e) {
    var b = btn();
    var p = panel();
    if (!b || !p) return;

    if (e.target.closest("[data-nav-burger]")) {
      e.preventDefault();
      setOpen(!isOpen());
      return;
    }

    if (e.target.closest("[data-mobile-nav] a")) {
      setOpen(false);
      return;
    }

    if (isOpen() && !p.contains(e.target) && !b.contains(e.target)) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) {
      setOpen(false);
      var b = btn();
      if (b) b.focus();
    }
  });
})();

/* Desktop keeps details open so 1100+ layout stays unchanged.
   On narrow viewports we close extra proof; no new Metrika events. */
(function () {
  "use strict";
  var desktopMq = window.matchMedia("(min-width: 1100px)");
  var phoneMq = window.matchMedia("(max-width: 768px)");

  function sync() {
    var desktop = desktopMq.matches;
    var phone = phoneMq.matches;
    document.querySelectorAll("details.mobile-details").forEach(function (d) {
      if (desktop) {
        d.open = true;
        return;
      }
      if (!phone && d.getAttribute("data-collapse") === "phone") {
        d.open = true;
        return;
      }
      d.open = false;
    });
    document.querySelectorAll("details.faq-item").forEach(function (d, i) {
      if (desktop) d.open = true;
      else d.open = i === 0 || d.hasAttribute("data-keep-open");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync);
  } else {
    sync();
  }
  window.addEventListener("load", sync);
  if (desktopMq.addEventListener) {
    desktopMq.addEventListener("change", sync);
    phoneMq.addEventListener("change", sync);
  } else {
    desktopMq.addListener(sync);
    phoneMq.addListener(sync);
  }
})();
