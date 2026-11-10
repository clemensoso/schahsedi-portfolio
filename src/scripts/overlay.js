// Projekt-Overlay: Klick auf ein Projekt lädt dessen eigene Seite im Hintergrund und zeigt den Inhalt als Overlay.
// Die Adresse wechselt auf /projekte/…/, Zurück, Esc, X, Wischen und Klick auf den dunklen Bereich schließen wieder.
(function () {
  var layer = document.getElementById('sheet-layer');
  if (!layer) return;
  var sheet = document.getElementById('sheet');
  var content = document.getElementById('sheet-content');
  var backdrop = document.getElementById('sheet-backdrop');
  var closeBtn = document.getElementById('sheet-close');
  var grip = layer.querySelector('.sheet-grip');
  var home = layer.dataset.home;
  var homeTitle = 'Schah Sedi Startseite';
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var isOpen = layer.classList.contains('is-open');
  var pushed = false;   // haben wir selbst einen Verlaufseintrag angelegt? Dann schließt history.back()
  var opener = null;    // Link, der geöffnet hat: bekommt beim Schließen den Fokus zurück
  var hideTimer = 0;
  var cache = {};

  function behind() {
    return Array.prototype.filter.call(document.body.children, function (el) { return el !== layer && el.tagName !== 'SCRIPT'; });
  }
  function lockPage(on) {
    behind().forEach(function (el) { el.inert = on; });
  }
  // Seite dahinter bleibt stehen, ohne ihre Scrollbar auszublenden (sonst springt das Layout um deren Breite)
  function hold(e) { if (isOpen && !sheet.contains(e.target)) e.preventDefault(); }
  layer.addEventListener('wheel', hold, { passive: false });
  layer.addEventListener('touchmove', hold, { passive: false });

  // Direkt aufgerufener Projektlink: Overlay ist schon offen
  if (isOpen) {
    lockPage(true);
    history.replaceState({ sheet: location.pathname }, '');
    setTimeout(function () { layer.classList.remove('no-anim'); }, 60);
  }

  function load(url) {
    if (cache[url]) return Promise.resolve(cache[url]);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (html) {
      var art = new DOMParser().parseFromString(html, 'text/html').querySelector('#sheet-content .project');
      if (!art) throw new Error('kein Projekt');
      cache[url] = art;
      return art;
    });
  }

  function open(url, link) {
    return load(url).then(function (art) {
      content.replaceChildren(document.importNode(art, true));
      document.title = art.dataset.title || document.title;
      clearTimeout(hideTimer);
      layer.hidden = false;
      sheet.scrollTop = 0; // erst nach hidden=false, sonst bleibt die alte Scrollposition stehen
      document.dispatchEvent(new Event('sheet:content')); // Animationen im neuen Inhalt starten
      if (isOpen) return;
      opener = link || null;
      void sheet.offsetHeight; // Startposition festhalten, damit die Karte wirklich hochfährt
      layer.classList.add('is-open');
      lockPage(true);
      isOpen = true;
      closeBtn.focus({ preventScroll: true });
    }).catch(function () { location.href = url; }); // im Zweifel ganz normal zur Projektseite
  }

  function close(fromHistory) {
    if (!isOpen) return;
    isOpen = false;
    layer.classList.remove('is-open');
    lockPage(false);
    document.title = homeTitle;
    hideTimer = setTimeout(function () {
      layer.hidden = true;
      sheet.style.removeProperty('--drag');
      content.replaceChildren();
    }, calm ? 0 : 660);
    if (!fromHistory) {
      if (pushed) history.back();
      else history.replaceState(null, '', home);
    }
    pushed = false;
    if (opener) opener.focus({ preventScroll: true });
    opener = null;
  }

  // Klicks auf Projektlinks (Karussell, „Nächstes Projekt“) abfangen
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[data-project]');
    if (!a) return;
    e.preventDefault();
    var url = a.getAttribute('href');
    if (isOpen) {
      history.replaceState({ sheet: url }, '', url); // Weiterblättern: Zurück schließt trotzdem direkt
      open(url);
    } else {
      history.pushState({ sheet: url }, '', url);
      pushed = true;
      open(url, a);
    }
  });

  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.sheet) { pushed = true; open(e.state.sheet); }
    else close(true);
  });

  closeBtn.addEventListener('click', function () { close(); });
  backdrop.addEventListener('click', function () { close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(); });

  // ---------- Wegwischen nach unten ----------
  var drag = null;
  function dragStart(y) {
    drag = { y0: y, dy: 0, lastY: y, lastT: performance.now(), v: 0 };
    sheet.classList.add('dragging');
  }
  function dragMove(y) {
    var now = performance.now();
    drag.v = (y - drag.lastY) / Math.max(1, now - drag.lastT);
    drag.lastY = y; drag.lastT = now;
    drag.dy = Math.max(0, y - drag.y0);
    sheet.style.setProperty('--drag', drag.dy + 'px');
    layer.style.setProperty('--shade', Math.max(0, 1 - drag.dy / window.innerHeight).toFixed(3));
  }
  function dragEnd() {
    if (!drag) return;
    var shut = drag.dy > Math.min(160, window.innerHeight * 0.25) || (drag.v > 0.5 && drag.dy > 24);
    drag = null;
    sheet.classList.remove('dragging');
    layer.style.removeProperty('--shade');
    if (shut) close();
    else sheet.style.setProperty('--drag', '0px');
  }

  // Griff: mit Maus und Finger
  grip.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    try { grip.setPointerCapture(e.pointerId); } catch (err) { /* ohne Capture geht es auch */ }
    dragStart(e.clientY);
  });
  grip.addEventListener('pointermove', function (e) { if (drag) dragMove(e.clientY); });
  grip.addEventListener('pointerup', dragEnd);
  grip.addEventListener('pointercancel', dragEnd);

  // Inhalt: nur wenn ganz oben gescrollt und der Finger nach unten zieht
  var touchY = null;
  sheet.addEventListener('touchstart', function (e) {
    if (e.target.closest('.sheet-grip') || e.touches.length > 1) { touchY = null; return; }
    touchY = sheet.scrollTop <= 0 ? e.touches[0].clientY : null;
  }, { passive: true });
  sheet.addEventListener('touchmove', function (e) {
    if (touchY === null) return;
    var y = e.touches[0].clientY;
    if (!drag) {
      if (y - touchY < -4) { touchY = null; return; } // nach oben: normal scrollen
      if (y - touchY > 6 && sheet.scrollTop <= 0) dragStart(touchY);
    }
    if (drag) { e.preventDefault(); dragMove(y); }
  }, { passive: false });
  sheet.addEventListener('touchend', function () { touchY = null; dragEnd(); });
  sheet.addEventListener('touchcancel', function () { touchY = null; dragEnd(); });
})();
