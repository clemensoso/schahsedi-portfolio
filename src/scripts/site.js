(function () {
  var root = document.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('foot-year').textContent = new Date().getFullYear();

  // Kritzel-Füllung einsetzen
  var SCRIBBLE = '<svg class="scribble" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">' +
    '<path pathLength="1" d="M-6 30 C2 4 12 -2 16 14 C20 32 10 46 24 34 C36 24 30 -6 44 6 C56 16 40 46 56 38 C70 30 64 -4 78 6 C90 14 76 42 92 34 C100 30 104 18 108 12"/></svg>';
  document.querySelectorAll('.btn, .nav-links a').forEach(function (el) {
    if (el.matches('.nav-links a')) el.innerHTML = '<span>' + el.innerHTML + '</span>';
    el.insertAdjacentHTML('afterbegin', SCRIBBLE);
  });

  // Ton-Wechsel: der Block, der die Bildmitte kreuzt, bestimmt die Farbe der ganzen Seite
  var toned = Array.prototype.slice.call(document.querySelectorAll('[data-tone]'));
  root.dataset.work = 'card';
  function pickTone() {
    if (root.dataset.work === 'card') { root.setAttribute('data-tone', 'light'); return; } // Hero und Karte haben eigene Farben
    var mid = window.innerHeight * 0.5;
    for (var i = 0; i < toned.length; i++) {
      var r = toned[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        var t = toned[i].dataset.tone;
        if (t === 'dark') root.removeAttribute('data-tone'); else root.setAttribute('data-tone', t);
        return;
      }
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { pickTone(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', pickTone);
  pickTone();

  // ---------- Projekt-Slider ----------
  var slider = document.getElementById('slider');
  var track = document.getElementById('track');
  var slides = Array.prototype.slice.call(track.querySelectorAll('.slide'));
  var dotsWrap = document.getElementById('dots');
  var n = slides.length, active = -1, lockUntil = 0, cur = 0;
  // Endlos: je ein geklonter Satz davor und dahinter. cur zählt in allen Slides, der echte Satz liegt bei n bis 2n-1.
  function cloneSet() {
    var f = document.createDocumentFragment();
    slides.forEach(function (s) {
      var c = s.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.tabIndex = -1;
      f.appendChild(c);
    });
    return f;
  }
  track.insertBefore(cloneSet(), slides[0]);
  track.appendChild(cloneSet());
  var all = Array.prototype.slice.call(track.querySelectorAll('.slide'));

  slides.forEach(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'dot';
    b.setAttribute('aria-label', 'Projekt ' + (i + 1) + ' von ' + n);
    b.addEventListener('click', function () { var d = (i - active + n) % n; if (d > n / 2) d -= n; step(d); });
    dotsWrap.appendChild(b);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);

  function leftFor(i) { var s = all[i]; return s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2; }
  function nearest() {
    var c = track.scrollLeft + track.clientWidth / 2, best = 0, bd = Infinity;
    all.forEach(function (s, k) { var d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - c); if (d < bd) { bd = d; best = k; } });
    return best;
  }
  function setActive(pos) {
    cur = pos;
    var i = pos % n;
    if (i === active) return;
    active = i;
    all.forEach(function (s, k) { s.classList.toggle('is-active', k % n === i); }); // auch die Klone, damit der Rücksprung unsichtbar bleibt
    dots.forEach(function (d, k) { d.classList.remove('is-active'); d.setAttribute('aria-current', String(k === i)); });
    void dots[i].offsetWidth; // Animation des Fortschritts neu starten
    dots[i].classList.add('is-active');
  }
  // Unsichtbarer Sprung um genau einen Satz zurück in die Mitte
  function normalize() {
    var shift = cur < n ? n : cur >= 2 * n ? -n : 0;
    if (!shift) return;
    track.scrollLeft += all[cur + shift].offsetLeft - all[cur].offsetLeft;
    cur += shift;
  }
  function step(d) { normalize(); goTo(cur + d); }
  function goTo(i, instant) {
    lockUntil = Date.now() + (instant || calm ? 0 : 800);
    track.scrollTo({ left: leftFor(i), behavior: instant || calm ? 'auto' : 'smooth' });
    setActive(i);
  }
  track.addEventListener('scroll', function () {
    armSettle();
    if (drag || Date.now() < lockUntil) return;
    requestAnimationFrame(function () { setActive(nearest()); });
  }, { passive: true });
  // Erst wenn das Scrollen zur Ruhe gekommen ist, zurück in den echten Satz
  var settleT = 0, touching = false;
  function armSettle() { clearTimeout(settleT); settleT = setTimeout(settle, 140); }
  function settle() {
    if (drag || touching || Date.now() < lockUntil) { armSettle(); return; }
    setActive(nearest());
    normalize();
  }
  track.addEventListener('touchstart', function () { touching = true; }, { passive: true });
  ['touchend', 'touchcancel'].forEach(function (t) { track.addEventListener(t, function () { touching = false; armSettle(); }, { passive: true }); });
  document.getElementById('prev').addEventListener('click', function () { step(-1); });
  document.getElementById('next').addEventListener('click', function () { step(1); });
  slides.forEach(function (s, i) { s.addEventListener('focus', function () { if (i !== active && s.matches(':focus-visible')) goTo(n + i); }); });
  window.addEventListener('resize', function () { goTo(cur, true); });

  // Automatisch weiter, wenn der Fortschritt im aktiven Punkt voll ist. Pause bei Hover, Fokus, Ziehen, außer Sicht.
  var reasons = {};
  function pause(key, on) {
    if (on) reasons[key] = true; else delete reasons[key];
    slider.classList.toggle('paused', Object.keys(reasons).length > 0);
  }
  if (calm) slider.classList.add('no-auto');
  dotsWrap.addEventListener('animationend', function () { if (!calm) step(1); });
  slider.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') pause('hover', true); });
  slider.addEventListener('pointerleave', function () { pause('hover', false); });
  slider.addEventListener('focusin', function () { pause('focus', true); });
  slider.addEventListener('focusout', function (e) { if (!slider.contains(e.relatedTarget)) pause('focus', false); });
  document.addEventListener('visibilitychange', function () { pause('tab', document.hidden); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { pause('view', !entries[0].isIntersecting); }, { threshold: 0.4 }).observe(track);
  }

  // Mit der Maus ziehen (Touch nutzt das native Wischen)
  var drag = null, moved = false;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, from: cur };
    moved = false;
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('dragging'); pause('drag', true); }
    if (!moved) return;
    var want = drag.left - dx, setW = all[n].offsetLeft - all[0].offsetLeft;
    // Beim Ziehen über den Rand hinaus: einen Satz versetzen und weiterziehen
    if (want < leftFor(1)) { drag.left += setW; want += setW; drag.from += n; }
    else if (want > leftFor(3 * n - 2)) { drag.left -= setW; want -= setW; drag.from -= n; }
    track.scrollLeft = want;
  });
  function endDrag(e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, from = drag.from;
    drag = null;
    if (!moved) return;
    track.classList.remove('dragging');
    pause('drag', false);
    var i = nearest();
    if (i === from && Math.abs(dx) > 60) i = from + (dx < 0 ? 1 : -1);
    goTo(Math.max(0, Math.min(3 * n - 1, i)));
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  track.addEventListener('click', function (e) {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; return; }
    var s = e.target.closest('.slide');
    if (!s) return;
    var pos = all.indexOf(s);
    if (pos % n !== active) { e.preventDefault(); goTo(pos); return; } // Nachbar-Karte: nur das Karussell bewegt sich
    if (s.getAttribute('href').charAt(0) === '#') e.preventDefault(); // Platzhalter-Link, sonst springt die Seite
  }, true);

  goTo(n + 1, true); // startet auf Projekt 2, links und rechts ist direkt etwas zu sehen

  // ---------- Navigation ----------
  // Oben (Desktop): alle Links. Beim Scrollen: Logo + aktueller Bereich + Hamburger.
  // Der Hamburger lässt die Pill nach links und rechts aufgehen. Das C dreht sich mit dem Scrollen.
  var nav = document.getElementById('nav');
  var navCurrent = document.getElementById('nav-current');
  var navToggle = document.getElementById('nav-toggle');
  var logoMark = document.getElementById('nav-logo-mark');
  var hero = document.querySelector('.hero');
  var narrow = window.matchMedia('(max-width: 760px)');
  var navSections = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var navState = '', navLabel = null, menuOpen = false;
  var mainEl = document.querySelector('main');
  var workSection = document.getElementById('arbeiten'), workTitle = document.getElementById('arbeiten-title');

  function applyNav(state, label, force) {
    if (!force && state === navState && label === navLabel) return;
    var from = nav.getBoundingClientRect().width, first = navState === '';
    navState = state; navLabel = label;
    nav.dataset.state = state;
    navCurrent.textContent = label;
    nav.style.width = '';
    var to = nav.getBoundingClientRect().width;
    if (!calm && !first && from && Math.abs(from - to) > 1) {
      nav.style.width = from + 'px';
      void nav.offsetWidth;
    }
    nav.style.width = to + 'px';
    navToggle.setAttribute('aria-expanded', String(state === 'open'));
    navToggle.setAttribute('aria-label', state === 'open' ? 'Menü schließen' : 'Menü öffnen');
  }
  function currentSection() {
    var line = window.innerHeight * 0.4;
    for (var i = 0; i < navSections.length; i++) {
      if (navSections[i].tagName === 'FOOTER' && mainEl.getBoundingClientRect().bottom > line) continue; // klebt immer im Bild, zählt erst, wenn er freiliegt
      var r = navSections[i].getBoundingClientRect();
      if (r.top <= line && r.bottom > line) return navSections[i];
    }
    return null;
  }
  function updateNav(force) {
    var sec = currentSection();
    // Eingeklappt wird erst, wenn die Projects-Headline ins Bild kommt; das ist dann auch das erste Label
    var projectsIn = window.scrollY > 40 && workTitle.getBoundingClientRect().top < window.innerHeight * 0.92;
    if (!sec && projectsIn) sec = workSection;
    var label = sec ? sec.dataset.nav : 'Schah Sedi';
    navLinks.forEach(function (a) { a.setAttribute('aria-current', String(!!sec && a.getAttribute('href') === '#' + sec.id)); });
    var collapsed = narrow.matches || projectsIn;
    if (!collapsed) menuOpen = false;
    applyNav(menuOpen ? 'open' : (collapsed ? 'mini' : 'full'), label, force);
    if (!calm) logoMark.style.transform = 'rotate(' + (window.scrollY * 0.3).toFixed(1) + 'deg)';
  }
  function setMenu(open) { menuOpen = open; updateNav(); }
  navToggle.addEventListener('click', function () { setMenu(!menuOpen); });
  document.getElementById('nav-links').addEventListener('click', function (e) { if (e.target.closest('a') && menuOpen) setMenu(false); });
  document.addEventListener('click', function (e) { if (menuOpen && !nav.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); navToggle.focus(); } });
  var navTick = false;
  window.addEventListener('scroll', function () {
    if (navTick) return;
    navTick = true;
    requestAnimationFrame(function () { updateNav(); navTick = false; });
  }, { passive: true });
  window.addEventListener('resize', function () { updateNav(true); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { updateNav(true); });
  updateNav(true);

  // ---------- Hero-Kacheln: Parallaxe, auf dem Weg zu Projects nach oben raus ----------
  var floatsWrap = document.getElementById('floats');
  var floatEls = Array.prototype.slice.call(floatsWrap.querySelectorAll('.float'));
  var wideHero = window.matchMedia('(min-width: 901px)');
  var heroInner = document.querySelector('.hero-inner');
  function clearLift(el) { el.style.translate = ''; el.style.opacity = ''; el.style.visibility = ''; }
  function floatsUpdate() {
    var card = root.dataset.work === 'card';
    if (calm) { clearLift(heroInner); clearLift(floatsWrap); floatEls.forEach(clearLift); return; }
    var y = window.scrollY;
    var p = Math.min(1, y / (hero.offsetHeight * 0.6)); // 0 = oben, 1 = Projects ist da
    var fade = String(Math.max(0, 1 - Math.pow(p, 1.6)));
    var lift = '0 ' + (-y * 0.45 - p * p * 120).toFixed(1) + 'px';
    // Claim und Button: gleiche Bewegung wie die Kacheln, nur ruhiger, damit die Karte sie erst beim Ausblenden einholt
    if (card) {
      heroInner.style.translate = lift;
      heroInner.style.opacity = fade;
      heroInner.style.visibility = p >= 1 ? 'hidden' : '';
    } else clearLift(heroInner);
    if (!wideHero.matches) {
      // schmal hat der Wrapper keine eigene Box: gleiche Parallaxe wie am Desktop, Ausblenden je Kachel
      floatEls.forEach(function (f) {
        var speed = parseFloat(f.dataset.speed) + (card ? 0.7 : 0);
        f.style.translate = '0 ' + (-y * speed - p * p * 260).toFixed(1) + 'px';
        f.style.opacity = fade;
        f.style.visibility = p >= 1 ? 'hidden' : '';
      });
      clearLift(floatsWrap);
      return;
    }
    floatsWrap.style.translate = '';
    floatEls.forEach(function (f) { f.style.opacity = ''; f.style.visibility = ''; });
    floatEls.forEach(function (f) {
      var speed = parseFloat(f.dataset.speed);
      if (card) speed += 0.7; // der Hero klebt: Kacheln ziehen selbst nach oben weg
      // eigene Geschwindigkeit pro Kachel, zum Ende hin beschleunigt nach oben
      f.style.translate = '0 ' + (-y * speed - p * p * 260).toFixed(1) + 'px';
    });
    floatsWrap.style.opacity = fade;
    floatsWrap.style.visibility = p >= 1 ? 'hidden' : '';
  }
  // Tag am Mauszeiger: Text aus dem aria-label der Kachel, läuft leicht nach
  var cursorTag = document.getElementById('cursor-tag');
  var tagOn = false, tagRaf = 0, tagFor = null, mx = 0, my = 0, tx = 0, ty = 0, tagTouch = false, tagTimer = 0;
  function tagTarget() {
    var w = cursorTag.offsetWidth, h = cursorTag.offsetHeight;
    var x = mx + 16, y = tagTouch ? my - h - 28 : my + 20; // beim Finger darüber, sonst verdeckt er das Tag
    if (tagTouch) x = Math.max(12, mx - w / 2);
    if (x + w > window.innerWidth - 12) x = mx - w - 12;
    if (y + h > window.innerHeight - 12) y = my - h - 12;
    return [x, y];
  }
  function tagFrame() {
    var t = tagTarget();
    if (calm) { tx = t[0]; ty = t[1]; } else { tx += (t[0] - tx) * 0.3; ty += (t[1] - ty) * 0.3; }
    cursorTag.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
    tagRaf = tagOn ? requestAnimationFrame(tagFrame) : 0;
  }
  function setTag(el) {
    if (el === tagFor) return;
    tagFor = el;
    if (el) {
      cursorTag.textContent = el.getAttribute('aria-label');
      if (!tagOn) { var t = tagTarget(); tx = t[0]; ty = t[1]; }
      tagOn = true;
      cursorTag.classList.add('is-on');
      if (!tagRaf) tagRaf = requestAnimationFrame(tagFrame);
    } else {
      tagOn = false;
      cursorTag.classList.remove('is-on');
    }
  }
  window.addEventListener('pointermove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (e.pointerType !== 'mouse') return;
    tagTouch = false;
    setTag(e.target.closest ? e.target.closest('.float, .social-mail') : null);
  }, { passive: true });
  // Touch: kurz gedrückt halten zeigt das Tag; beim Scrollen bricht der Browser den Druck ab, dann erscheint nichts
  window.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' || !e.target.closest) return;
    var el = e.target.closest('.float');
    if (!el) return;
    mx = e.clientX; my = e.clientY;
    clearTimeout(tagTimer);
    tagTimer = setTimeout(function () { tagTouch = true; setTag(el); }, 120);
  }, { passive: true });
  ['pointerup', 'pointercancel'].forEach(function (t) {
    window.addEventListener(t, function (e) { if (e.pointerType !== 'mouse') { clearTimeout(tagTimer); setTag(null); } }, { passive: true });
  });
  document.documentElement.addEventListener('mouseleave', function () { setTag(null); });
  // Kachel scrollt unter dem ruhenden Mauszeiger weg
  window.addEventListener('scroll', function () {
    if (!tagOn) return;
    var under = document.elementFromPoint(mx, my);
    setTag(under && under.closest('.float, .social-mail'));
  }, { passive: true });

  // ---------- Hero-Kacheln: leicht zum Mauszeiger hin, auf dem Handy mit der Neigung des Geräts ----------
  var leanCards = floatEls.map(function (f) {
    return { el: f, card: f.querySelector('.float-card'), depth: 0.7 + parseFloat(f.dataset.speed), x: 0, y: 0, tx: 0, ty: 0 };
  });
  var leanRaf = 0;
  function leanFrame() {
    var moving = false;
    leanCards.forEach(function (c) {
      c.x += (c.tx - c.x) * 0.07; c.y += (c.ty - c.y) * 0.07;
      if (Math.abs(c.tx - c.x) > 0.05 || Math.abs(c.ty - c.y) > 0.05) moving = true;
      c.card.style.translate = c.x.toFixed(2) + 'px ' + c.y.toFixed(2) + 'px';
    });
    leanRaf = moving ? requestAnimationFrame(leanFrame) : 0;
  }
  function leanKick() { if (!leanRaf) leanRaf = requestAnimationFrame(leanFrame); }
  function leanZero() { leanCards.forEach(function (c) { c.tx = 0; c.ty = 0; }); leanKick(); }

  if (!calm) {
    // Nahe Kacheln ziehen stärker; direkt unter Mauszeiger oder Finger lässt der Zug nach, damit nichts zappelt
    function leanTo(x, y) {
      if (window.scrollY > hero.offsetHeight * 0.6) { leanZero(); return; }
      var wide = wideHero.matches, base = (wide ? floatsWrap : hero).getBoundingClientRect(), reach = window.innerWidth * 0.8, k = wide ? 1 : 0.75;
      leanCards.forEach(function (c) {
        var dx = x - (base.left + c.el.offsetLeft + c.el.offsetWidth / 2);
        var dy = y - (base.top + c.el.offsetTop + c.el.offsetHeight / 2);
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var pull = 22 * k * c.depth * (0.3 + 0.7 * Math.max(0, 1 - d / reach)) * Math.min(1, d / 180);
        c.tx = dx / d * pull; c.ty = dy / d * pull;
      });
      leanKick();
    }
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') leanTo(e.clientX, e.clientY); }, { passive: true });
    function leanTouch(e) { if (e.touches[0]) leanTo(e.touches[0].clientX, e.touches[0].clientY); }
    window.addEventListener('touchstart', leanTouch, { passive: true });
    window.addEventListener('touchmove', leanTouch, { passive: true });
    window.addEventListener('touchend', leanZero, { passive: true });
    window.addEventListener('touchcancel', leanZero, { passive: true });
    document.documentElement.addEventListener('mouseleave', leanZero);

    // Handy: Neigung relativ zur Haltung; die Mitte wandert langsam mit, damit jede Haltung als Ruhelage gilt
    var tiltG = null, tiltB = null;
    function clampUnit(v) { return Math.max(-1, Math.min(1, v)); }
    function onTilt(e) {
      if (e.gamma === null || e.beta === null) return;
      if (window.scrollY > hero.offsetHeight) { leanZero(); return; }
      var g = e.gamma, b = e.beta;
      var angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      if (angle === 90) { var g90 = g; g = b; b = -g90; }
      else if (angle === -90 || angle === 270) { var g270 = g; g = -b; b = g270; }
      if (tiltG === null) { tiltG = g; tiltB = b; }
      tiltG += (g - tiltG) * 0.004; tiltB += (b - tiltB) * 0.004;
      var nx = clampUnit((g - tiltG) / 18), ny = clampUnit((b - tiltB) / 18);
      leanCards.forEach(function (c) { c.tx = nx * 20 * c.depth; c.ty = ny * 20 * c.depth; });
      leanKick();
    }
    function startTilt() { window.addEventListener('deviceorientation', onTilt, { passive: true }); }
    // iOS verlangt dafür eine ausdrückliche Freigabe per Tipp: dort bleibt es beim Schweben
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') startTilt();
  }

  var floatTick = false;
  window.addEventListener('scroll', function () {
    if (floatTick) return;
    floatTick = true;
    requestAnimationFrame(function () { floatsUpdate(); floatTick = false; });
  }, { passive: true });
  window.addEventListener('resize', floatsUpdate);
  floatsUpdate();

  // ---------- Kontakt-Karte: fährt beim Reinscrollen von unten hoch ----------
  var card = document.getElementById('kontakt');
  function cardUpdate() {
    if (calm) return;
    var r = card.getBoundingClientRect(), vh = window.innerHeight;
    var t = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.7))); // 0 = Oberkante unten im Bild, 1 = gut drin
    var e = 1 - Math.pow(1 - t, 3);
    card.style.setProperty('--rise', ((1 - e) * 160).toFixed(1) + 'px');
    card.style.setProperty('--grow', (0.94 + e * 0.06).toFixed(4));
  }
  // Weiße Projekte-Karte: gleiche Kurve wie Kontakt. Gemessen über die Hero-Höhe, nicht über die bewegte Karte.
  var heroBlock = document.getElementById('hero-block');
  var workBlock = document.getElementById('work-block');
  function stageUpdate() {
    var on = root.dataset.work === 'card';
    heroBlock.style.top = on ? Math.min(0, window.innerHeight - heroBlock.offsetHeight) + 'px' : '';
    if (!on || calm) { workBlock.style.removeProperty('--rise'); workBlock.style.removeProperty('--grow'); return; }
    var vh = window.innerHeight, top = heroBlock.offsetHeight - window.scrollY;
    var t = Math.max(0, Math.min(1, (vh - top) / (vh * 0.7)));
    var e = 1 - Math.pow(1 - t, 3);
    workBlock.style.setProperty('--rise', ((1 - e) * 160).toFixed(1) + 'px');
    workBlock.style.setProperty('--grow', (0.94 + e * 0.06).toFixed(4));
  }
  var cardTick = false;
  window.addEventListener('scroll', function () {
    if (cardTick) return;
    cardTick = true;
    requestAnimationFrame(function () { cardUpdate(); stageUpdate(); cardTick = false; });
  }, { passive: true });
  window.addEventListener('resize', cardUpdate);
  window.addEventListener('resize', stageUpdate);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(stageUpdate);
  cardUpdate();
  stageUpdate();

  // ---------- Porträt-GIF: spielt zweimal, bleibt dann auf dem ersten Bild stehen; Knopf unten links ----------
  var gifImg = document.getElementById('portrait-gif');
  var gifBtn = document.getElementById('portrait-play');
  var GIF_SRC = gifImg.dataset.gif, STILL_SRC = gifImg.getAttribute('src');
  var gifBlob = null, gifLoop = 1480, gifUrl = null, gifStop = 0;
  function gifDuration(buf) { // Summe der Bildverzögerungen aus den Graphic-Control-Blöcken
    var d = new Uint8Array(buf), ms = 0;
    for (var i = 0; i < d.length - 5; i++) if (d[i] === 0x21 && d[i + 1] === 0xF9 && d[i + 2] === 0x04) ms += Math.max(2, d[i + 4] | (d[i + 5] << 8)) * 10;
    return ms || 1480;
  }
  function loadGif() {
    if (gifBlob) return Promise.resolve();
    return fetch(GIF_SRC).then(function (r) { return r.blob(); }).then(function (b) {
      gifBlob = b; return b.arrayBuffer();
    }).then(function (buf) { gifLoop = gifDuration(buf); });
  }
  var gifTok = 0;
  function showStill() {
    gifTok++;
    clearTimeout(gifStop);
    gifImg.src = STILL_SRC;
    if (gifUrl) { URL.revokeObjectURL(gifUrl); gifUrl = null; }
    gifBtn.setAttribute('aria-pressed', 'false');
    gifBtn.setAttribute('aria-label', 'Animation abspielen');
  }
  function playGif(loops) {
    var tok = ++gifTok;
    loadGif().then(function () {
      if (tok !== gifTok) return; // inzwischen wieder angehalten
      clearTimeout(gifStop);
      if (gifUrl) URL.revokeObjectURL(gifUrl);
      gifUrl = URL.createObjectURL(gifBlob); // neue Adresse = Animation startet sicher beim ersten Bild
      gifImg.src = gifUrl;
      gifBtn.setAttribute('aria-pressed', 'true');
      gifBtn.setAttribute('aria-label', 'Animation pausieren');
      if (loops) gifStop = setTimeout(showStill, gifLoop * loops);
    });
  }
  // Maus: läuft, solange man über dem Porträt ist. Touch und Tastatur: Tippen schaltet um.
  var gifTile = gifImg.closest('.t-portrait'), lastPointer = 'mouse';
  function gifToggle() { if (gifBtn.getAttribute('aria-pressed') === 'true') showStill(); else playGif(0); }
  gifTile.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType; });
  gifTile.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') playGif(0); });
  gifTile.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') showStill(); });
  gifTile.addEventListener('click', function (e) { if (e.detail === 0 || lastPointer !== 'mouse') gifToggle(); });
  // Automatisch erst, wenn wirklich gescrollt wurde und mindestens 60 % des Porträts im Bild sind
  if (!calm) {
    var gifCheck = function () {
      if (document.hidden || window.scrollY < 1) return;
      var r = gifImg.getBoundingClientRect(), vh = window.innerHeight;
      var seen = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (seen < Math.min(r.height, vh) * 0.6) return;
      window.removeEventListener('scroll', gifCheck);
      playGif(2);
    };
    window.addEventListener('scroll', gifCheck, { passive: true });
  }

  // ---------- Sticker: klebt sich beim Runterscrollen selbst auf ----------
  var sticker = document.getElementById('sticker');
  function stickerUpdate() {
    if (calm) { sticker.classList.add('settled'); return; }
    // Lage ohne eigene Verschiebung messen (über die Porträt-Kachel), sonst schaukelt sich der Wert auf
    var top = sticker.parentElement.getBoundingClientRect().top + sticker.offsetTop, vh = window.innerHeight;
    // 0 = Sticker kommt unten ins Bild, 1 = er ist gut im Bild angekommen und klebt
    var t = Math.max(0, Math.min(1, (vh - top) / (vh * 0.5)));
    var e = t * t * (3 - 2 * t), lift = 1 - e; // weich rein und raus: die Ecke streicht sich sichtbar glatt
    var h = sticker.offsetHeight;
    sticker.style.setProperty('--peel', (lift * h * 0.92).toFixed(1) + 'px');
    if (t >= 1) {
      sticker.classList.add('settled');
      sticker.style.opacity = ''; sticker.style.rotate = ''; sticker.style.translate = ''; sticker.style.scale = '';
      return;
    }
    sticker.classList.remove('settled');
    sticker.style.opacity = Math.min(1, t * 6).toFixed(3);
    sticker.style.rotate = (-6 - lift * 12).toFixed(2) + 'deg';
    sticker.style.translate = (lift * 18).toFixed(1) + 'px ' + (-lift * 34).toFixed(1) + 'px';
    sticker.style.scale = (1 + lift * 0.08).toFixed(3);
  }
  var stickTick = false, scrollTimer = 0;
  window.addEventListener('scroll', function () {
    sticker.classList.add('scrolling');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () { sticker.classList.remove('scrolling'); }, 150);
    if (stickTick) return;
    stickTick = true;
    requestAnimationFrame(function () { stickerUpdate(); stickTick = false; });
  }, { passive: true });
  window.addEventListener('resize', stickerUpdate);
  stickerUpdate();

  // ---------- Skill-Sticker: frei verschiebbar (Maus und Touch) ----------
  var sheet = document.getElementById('sticker-sheet');
  var skills = Array.prototype.slice.call(sheet.querySelectorAll('.skill'));
  // Weißer Sticker-Rand: dieselben Formen dick und weiß darunter, Platz dafür im viewBox
  skills.forEach(function (sk) {
    var svg = sk.querySelector('svg'), vb = svg.getAttribute('viewBox').split(' ').map(Number), P = 6;
    var cut = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    cut.setAttribute('class', 'cut');
    Array.prototype.forEach.call(svg.querySelectorAll('path, rect, circle, line'), function (n) { cut.appendChild(n.cloneNode(true)); });
    svg.insertBefore(cut, svg.firstChild);
    svg.setAttribute('viewBox', (vb[0] - P) + ' ' + (vb[1] - P) + ' ' + (vb[2] + 2 * P) + ' ' + (vb[3] + 2 * P));
  });
  var MOBILE = [[0, 3], [36, 0], [72, 3], [0, 25], [38, 42], [66, 38], [0, 62], [58, 70]];
  var narrowSheet = window.matchMedia('(max-width: 759px)');
  var zTop = 1;
  function layoutSkills() {
    var w = sheet.clientWidth, h = sheet.clientHeight;
    sheet.style.setProperty('--k', Math.max(0.8, Math.min(1.25, w / 708)).toFixed(3)); // Sticker wachsen mit der Fläche
    skills.forEach(function (el, i) {
      if (el.dataset.moved) return;
      var px = narrowSheet.matches ? MOBILE[i][0] : parseFloat(el.dataset.x);
      var py = narrowSheet.matches ? MOBILE[i][1] : parseFloat(el.dataset.y);
      el.style.left = Math.max(4, Math.min(w - el.offsetWidth - 4, px / 100 * w)) + 'px';
      el.style.top = Math.max(4, Math.min(h - el.offsetHeight - 4, py / 100 * h)) + 'px';
    });
  }
  skills.forEach(function (el) {
    var start = null;
    el.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      start = { x: e.clientX, y: e.clientY, left: el.offsetLeft, top: el.offsetTop, maxX: sheet.clientWidth - el.offsetWidth, maxY: sheet.clientHeight - el.offsetHeight };
      el.setPointerCapture(e.pointerId);
      el.classList.add('grabbing');
      el.style.zIndex = ++zTop;
      el.dataset.moved = '1';
    });
    el.addEventListener('pointermove', function (e) {
      if (!start) return;
      el.style.left = Math.max(0, Math.min(start.maxX, start.left + e.clientX - start.x)) + 'px';
      el.style.top = Math.max(0, Math.min(start.maxY, start.top + e.clientY - start.y)) + 'px';
    });
    function drop() { if (!start) return; start = null; el.classList.remove('grabbing'); }
    el.addEventListener('pointerup', drop);
    el.addEventListener('pointercancel', drop);
  });
  window.addEventListener('resize', layoutSkills);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutSkills);
  layoutSkills();
  // Zurücklegen: alle Sticker gleiten an ihre Ausgangsposition
  var resetBtn = document.getElementById('sheet-reset');
  resetBtn.hidden = true;
  sheet.addEventListener('pointerdown', function () { resetBtn.hidden = false; });
  resetBtn.addEventListener('click', function () {
    skills.forEach(function (el) { delete el.dataset.moved; el.classList.add('returning'); });
    layoutSkills();
    setTimeout(function () { skills.forEach(function (el) { el.classList.remove('returning'); }); }, 700);
    resetBtn.hidden = true;
  });
  // Ab und zu wackelt ein Sticker kurz, solange er im Bild ist und noch niemand einen angefasst hat
  var touched = false, nudgeTimer = 0, lastNudge = -1;
  sheet.addEventListener('pointerdown', function () { touched = true; clearInterval(nudgeTimer); });
  function nudgeOne() {
    if (touched || document.hidden) return;
    var i; do { i = Math.floor(Math.random() * skills.length); } while (i === lastNudge && skills.length > 1);
    lastNudge = i;
    var el = skills[i];
    el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge');
  }
  skills.forEach(function (el) { el.addEventListener('animationend', function () { el.classList.remove('nudge'); }); });
  if (!calm && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      clearInterval(nudgeTimer);
      if (entries[0].isIntersecting && !touched) { setTimeout(nudgeOne, 600); nudgeTimer = setInterval(nudgeOne, 2600); }
    }, { threshold: 0.5 }).observe(sheet);
  }

  // Logo-Band: Gruppe dreimal kopieren, damit auch auf sehr breiten Monitoren keine Lücke entsteht
  var marquee = document.getElementById('marquee');
  var mGroup = marquee.querySelector('.marquee-group');
  for (var mi = 0; mi < 3; mi++) {
    var mCopy = mGroup.cloneNode(true);
    mCopy.setAttribute('aria-hidden', 'true');
    mCopy.querySelectorAll('img').forEach(function (im) { im.alt = ''; });
    marquee.appendChild(mCopy);
  }
  // Handy: dieselben Logos auf zwei Zeilen verteilt
  var mWrap = document.createElement('div');
  mWrap.className = 'marquee-m';
  var mSource = Array.prototype.slice.call(mGroup.querySelectorAll('li'));
  var mRows = [mSource.slice(0, 4), mSource.slice(4)].map(function (part) {
    var row = document.createElement('ul');
    row.className = 'm-row';
    part.forEach(function (li) {
      var c = li.cloneNode(true), im = c.querySelector('img');
      im.style.height = Math.round(parseFloat(im.style.height) * 0.85) + 'px';
      row.appendChild(c);
    });
    // weitere Sätze derselben Logos: die Zeile läuft in beide Richtungen endlos
    row.dataset.n = part.length;
    var first = Array.prototype.slice.call(row.children);
    for (var rep = 0; rep < 4; rep++) first.forEach(function (li) {
      var d = li.cloneNode(true);
      d.setAttribute('aria-hidden', 'true');
      d.querySelector('img').alt = '';
      row.appendChild(d);
    });
    mWrap.appendChild(row);
    return row;
  });
  marquee.parentNode.insertBefore(mWrap, marquee.nextSibling);
  var mNarrow = window.matchMedia('(max-width: 759px)');

  // Band hängt am Scrollen: runterscrollen schiebt es nach links, hochscrollen zurück (leicht nachgefedert)
  if (!calm) {
    var mNow = window.scrollY, mRun = false;
    function mDraw() {
      if (mNarrow.matches) {
        mRows.forEach(function (row, i) {
          // Länge eines Satzes; Versatz läuft modulo, also nie ans Ende. Zeile 1 nach rechts, Zeile 2 nach links
          var set = row.children[+row.dataset.n].offsetLeft - row.children[0].offsetLeft || 1;
          var off = ((mNow * 0.5 * (i === 0 ? -1 : 1)) % set + set) % set;
          row.style.transform = 'translate3d(' + (-off).toFixed(1) + 'px,0,0)';
        });
        return;
      }
      var w = mGroup.getBoundingClientRect().width || 1;
      marquee.style.setProperty('--mx', (-(((mNow * 0.55) % w) + w) % w).toFixed(1) + 'px');
    }
    function mStep() {
      var d = window.scrollY - mNow;
      if (Math.abs(d) < 0.4) { mNow = window.scrollY; mDraw(); mRun = false; return; }
      mNow += d * 0.12;
      mDraw();
      requestAnimationFrame(mStep);
    }
    window.addEventListener('scroll', function () { if (!mRun) { mRun = true; requestAnimationFrame(mStep); } }, { passive: true });
    window.addEventListener('resize', mDraw);
    mDraw();
  }

  // Scroll-Reveals
  if (!calm && 'IntersectionObserver' in window) {
    var vh = window.innerHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal, .reveal-clip').forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.9) return;
      el.classList.add(el.classList.contains('reveal-clip') ? 'pre-clip' : 'pre');
      io.observe(el);
    });
  }

  // Formular
  document.querySelectorAll('.story .chip').forEach(function (c) {
    c.insertAdjacentHTML('afterbegin', '<svg class="chip-i" viewBox="0 0 16 16" aria-hidden="true"><path class="plus" d="M8 3v10M3 8h10"/><path class="check" d="M3 8.5 6.5 12 13 4.5"/></svg>');
    c.addEventListener('click', function () {
      var on = c.getAttribute('aria-pressed') !== 'true';
      if (c.parentElement.hasAttribute('data-single')) Array.prototype.forEach.call(c.parentElement.children, function (x) { x.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', String(on));
    });
  });
  // Felder im Satz wachsen mit dem Text
  var fills = Array.prototype.slice.call(document.querySelectorAll('input.fill'));
  var fillRuler = document.createElement('span');
  fillRuler.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0';
  document.body.appendChild(fillRuler);
  function fitFill(el) {
    el.style.fontSize = '';
    var cs = getComputedStyle(el);
    fillRuler.style.font = cs.font;
    fillRuler.style.letterSpacing = cs.letterSpacing;
    fillRuler.style.textTransform = cs.textTransform;
    fillRuler.textContent = el.value || el.placeholder;
    var w = Math.ceil(fillRuler.getBoundingClientRect().width + 12);
    if (el === fNameEl) {
      // Name bleibt immer komplett sichtbar: wird er zu lang, schrumpft die Schrift, statt im Feld zu scrollen
      fillRuler.textContent = 'Hey ,';
      var room = el.closest('h2').clientWidth - fillRuler.getBoundingClientRect().width - 8;
      if (w > room) { el.style.fontSize = (parseFloat(cs.fontSize) * room / w).toFixed(2) + 'px'; w = room; }
    }
    el.style.width = w + 'px';
  }
  function fitAll() { fills.forEach(fitFill); }
  var fNameEl = document.getElementById('f-name'), fMailEl = document.getElementById('f-mail'), echoName = document.getElementById('echo-name');
  fills.forEach(function (el) { el.addEventListener('input', function () { fitFill(el); el.classList.remove('is-missing'); }); });
  fNameEl.addEventListener('input', function () { var v = fNameEl.value.trim(); echoName.textContent = v ? ', ' + v : ''; });
  fitAll();
  window.addEventListener('resize', fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  var fMsg = document.getElementById('f-msg');
  fMsg.addEventListener('input', function () { fMsg.style.height = 'auto'; fMsg.style.height = fMsg.scrollHeight + 'px'; });

  document.getElementById('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var note = document.getElementById('form-note');
    var missing = !fNameEl.value.trim() ? fNameEl : (!fMailEl.value.trim() || !fMailEl.checkValidity()) ? fMailEl : null;
    note.classList.add('form-note');
    if (missing) {
      note.textContent = missing === fNameEl ? 'Wie darf ich dich nennen? Oben fehlt noch dein Name.' : 'An welche Adresse soll die Antwort gehen?';
      missing.classList.add('is-missing');
      missing.focus();
      return;
    }
    note.textContent = 'Danke, ' + fNameEl.value.trim() + '. Das ist noch ein Entwurf: Das Formular wird erst auf der echten Seite angebunden, verschickt wurde nichts.';
  });
})();
