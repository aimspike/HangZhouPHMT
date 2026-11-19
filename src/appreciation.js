/* One optional, dismissible support prompt after one minute of visible browsing. */
function createHouseAppreciation(options) {
  'use strict';
  const overlay = document.getElementById('appreciationDialog');
  const sheet = overlay.querySelector('[role="dialog"]');
  const closeButton = document.getElementById('closeAppreciation');
  let started = false, shown = false, remaining = 60000, timer = null, since = 0, previousFocus = null;

  function close() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    if (previousFocus && document.documentElement.contains(previousFocus) && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  function show() {
    shown = true;
    previousFocus = document.activeElement;
    options.onOpen();
    overlay.hidden = false;
    closeButton.focus();
  }

  function due() {
    timer = null;
    remaining = 0;
    if (document.hidden || shown) return;
    if (!window.houseBoot.ready || options.isBusy()) {
      since = performance.now();
      timer = setTimeout(due, 1000);
      return;
    }
    show();
  }

  function pause() {
    if (timer === null) return;
    remaining = Math.max(0, remaining - (performance.now() - since));
    clearTimeout(timer);
    timer = null;
  }

  function resume() {
    if (!started || shown || timer !== null || document.hidden) return;
    since = performance.now();
    timer = setTimeout(due, remaining);
  }

  closeButton.addEventListener('click', close);
  document.getElementById('dismissAppreciation').addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    } else if (event.key === 'Tab') {
      const focusable = Array.from(sheet.querySelectorAll('button:not([disabled]),a[href]'));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !sheet.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sheet.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else resume(); });
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', resume);

  return {
    start() { if (started) return; started = true; resume(); },
    get diagnostics() { return { delayMs:60000, shown, open:!overlay.hidden, remainingMs:Math.max(0, remaining - (timer !== null && remaining > 0 ? performance.now() - since : 0)), visibleTimeOnly:true, oncePerPage:true }; }
  };
}
