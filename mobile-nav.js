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
