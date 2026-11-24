// Arbeiten-Übersicht (/projekte/, /playground/): zwei Skalen als Filter.
// Oben Projekte | Playground, unten der Bereich. Beide laufen mit eigener Physik (Ziehen, Schwung, Federeinrasten),
// damit Finger, Maus und Trackpad gleich reagieren. Die Kacheln filtern sofort, sobald das Ziel feststeht.
// Der Wechsel oben bleibt auf der Seite: Adresse, Titel und Ziel beim Schließen des Projekt-Overlays wandern mit.

// Skala: eigene Physik statt nativem Scrollen, damit Maus, Finger und Trackpad gleich laufen.
// Ziehen folgt dem Zeiger 1:1, beim Loslassen läuft die Skala mit Schwung weiter und rastet mit einer Feder ein.
function Dial(row, opts) {
  var strip = row.querySelector('.sl-strip'), widths = [];
  var items = [], centers = [], W = 0, x = 0, v = 0, target = 0, idx = 0, live = -1, raf = 0, last = 0, drag = null, wheelT = 0;
  var K0 = 560, K = K0, C = 2 * Math.sqrt(K); // straffe Feder, kritisch gedämpft: kommt schnell an, ohne nachzuschwingen
  function spring(k) { K = k; C = 2 * Math.sqrt(k); }
  // Bei Skalen mit Strichen (data-pitch) bekommt jeder Eintrag eine Breite aus ganzen Doppelschritten und die Skala
  // einen Rand aus ganzen Schritten: so liegt die Mitte jedes Eintrags – und damit sein langer Strich – genau auf einem kurzen.
  var pitch = Number(row.dataset.pitch) || 0, nat = [];
  function measure() {
    W = row.clientWidth; items = [].slice.call(strip.children);
    if (pitch) {
      var unit = pitch * 2, pad = Math.ceil(W / 2 / unit) * unit + unit, acc = pad;
      items.forEach(function (el) { el.style.width = ''; });
      nat = items.map(function (el) { return el.getBoundingClientRect().width; });
      widths = nat.map(function (w) { return Math.ceil(w / unit) * unit; });
      items.forEach(function (el, i) { el.style.width = widths[i] + 'px'; });
      strip.style.paddingLeft = strip.style.paddingRight = pad + 'px';
      centers = widths.map(function (w) { var c = acc + w / 2; acc += w; return c; });
    } else {
      widths = nat = items.map(function (el) { return el.offsetWidth; });
      centers = items.map(function (el, i) { return el.offsetLeft + widths[i] / 2; });
    }
  }
  function xFor(i) { return Math.round(W / 2 - centers[i]); } // ganze Pixel: Striche bleiben in Ruhe scharf
  function nearest(px) { var c = W / 2 - px, b = 0, bd = Infinity; for (var i = 0; i < centers.length; i++) { var d = Math.abs(centers[i] - c); if (d < bd) { bd = d; b = i; } } return b; }
  function rubber(px) { // über die Enden hinaus nur zäh
    var hi = xFor(0), lo = xFor(items.length - 1), d = W * 0.4;
    if (px > hi) return hi + (1 - 1 / ((px - hi) / d + 1)) * d * 0.6;
    if (px < lo) return lo - (1 - 1 / ((lo - px) / d + 1)) * d * 0.6;
    return px;
  }
  function paint() {
    strip.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    if (opts.frame) opts.frame(W / 2 - x, items, centers, nat, W);
    var n = nearest(x);
    if (n !== live) {
      if (live >= 0) { items[live].classList.remove('on'); items[live].setAttribute('aria-selected', 'false'); if (drag && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) try { navigator.vibrate(3); } catch (e) {} }
      items[n].classList.add('on'); items[n].setAttribute('aria-selected', 'true'); live = n;
    }
  }
  function step(t) {
    var dt = Math.min(0.034, (t - last) / 1000 || 0.016); last = t;
    for (var k = 0; k < 2; k++) { var h = dt / 2, a = -K * (x - target) - C * v; v += a * h; x += v * h; }
    if (Math.abs(x - target) < 0.5 && Math.abs(v) < 20) { x = target; v = 0; paint(); raf = 0; spring(K0); if (opts.onSettle) opts.onSettle(idx); return; }
    paint(); raf = requestAnimationFrame(step);
  }
  function go(i, vel) {
    idx = Math.max(0, Math.min(items.length - 1, i)); target = xFor(idx); if (vel != null) v = vel;
    // am Ende nur wenig Schwung über den Rand hinaus zulassen, sonst schießt die Skala sichtbar übers Ziel
    if ((idx === 0 && v > 900) || (idx === items.length - 1 && v < -900)) v = v > 0 ? 900 : -900;
    // Ziel steht fest, sobald losgelassen oder geklickt wird: sofort melden, nicht erst nach dem Einrasten
    if (opts.onCommit) opts.onCommit(idx);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; spring(K0); }

  row.addEventListener('pointerdown', function (e) {
    if (e.button) return;
    stop(); clearTimeout(wheelT); wh = null;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, start: x, moved: false, s: [[e.timeStamp, x]] };
    if (e.pointerType === 'mouse') e.preventDefault(); // keine Textauswahl beim Ziehen
  });
  row.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x0;
    if (!drag.moved) {
      if (Math.abs(dx) < 4) return;
      drag.moved = true; drag.x0 = e.clientX; dx = 0; drag.start = x;
      row.classList.add('is-drag'); try { row.setPointerCapture(e.pointerId); } catch (err) {}
    }
    // ohne Raw-Ereignisse wirkt der Finger auf schnellen Displays manchmal ruckelig: alle Zwischenpunkte mitnehmen
    x = rubber(drag.start + dx);
    drag.s.push([e.timeStamp, x]); if (drag.s.length > 8) drag.s.shift();
    paint();
  });
  function release(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null; row.classList.remove('is-drag');
    if (!d.moved) {
      if (cancelled) return go(nearest(x));
      var hit = document.elementFromPoint(e.clientX, e.clientY), it = hit && hit.closest('.sl-item');
      return go(it && items.indexOf(it) >= 0 ? items.indexOf(it) : nearest(x), 0);
    }
    var vel = speed(d.s, e.timeStamp);
    go(nearest(x + vel * 0.28), vel);
  }
  // Geschwindigkeit aus den letzten ~90 ms (px/s)
  function speed(sm, now) {
    if (!sm.length) return 0;
    var a = sm[sm.length - 1], b = a;
    for (var i = sm.length - 1; i >= 0; i--) { if (now - sm[i][0] > 90) break; b = sm[i]; }
    if (now - a[0] > 90 || a[0] - b[0] < 4) return 0; // stand still vor dem Loslassen
    return Math.max(-5000, Math.min(5000, (a[1] - b[1]) / ((a[0] - b[0]) / 1000)));
  }
  row.addEventListener('pointerup', function (e) { release(e, false); });
  row.addEventListener('pointercancel', function (e) { release(e, true); });
  row.addEventListener('lostpointercapture', function (e) { if (drag && drag.moved) release(e, false); });
  row.addEventListener('dragstart', function (e) { e.preventDefault(); });
  // Trackpad und Mausrad (seitlich oder mit Shift); senkrechtes Scrollen bleibt bei der Seite.
  // macOS schickt nach dem Loslassen noch lange abklingende Ereignisse (Nachlauf). Sobald der Nachlauf beginnt,
  // übernimmt die eigene Physik mit der gemessenen Geschwindigkeit, der Rest des Nachlaufs wird ignoriert.
  var wh = null;
  row.addEventListener('wheel', function (e) {
    var dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
    if (!dx) return;
    e.preventDefault();
    dx *= e.deltaMode === 1 ? 16 : 1;
    var now = e.timeStamp, a = Math.abs(dx), sg = dx > 0 ? 1 : -1;
    if (wh && wh.locked) {
      // Nachlauf schluckt alles, bis eine Pause kommt, die Richtung wechselt oder ein neuer Swipe klar anschwillt
      // (mehrmals hintereinander stärker). Einzelne Ausreißer im Nachlauf lösen nichts mehr aus.
      var gap = now - wh.t;
      wh.inc = a > wh.a + 0.5 ? (wh.inc || 0) + 1 : 0; wh.t = now; wh.a = a;
      if (gap < 220 && sg === wh.sg && !(wh.inc >= 3 && a > 6)) return;
      wh = null;
    }
    if (!wh || now - wh.t > 160) wh = { raw: x, s: [], peak: 0, dec: 0, t: now, a: 0, sg: sg, from: nearest(x) };
    stop(); v = 0; clearTimeout(wheelT);
    // macOS liefert im Nachlauf ganze Zahlen, die oft gleich bleiben (12, 11, 11, 10 …): gleich zählt als abklingend
    wh.dec = a <= wh.a ? wh.dec + 1 : (a > wh.a * 1.15 + 0.5 ? 0 : wh.dec); wh.peak = Math.max(wh.peak, a); wh.t = now; wh.a = a; wh.sg = sg;
    wh.raw -= dx * 0.6; x = rubber(wh.raw); paint(); // Trackpad etwas gedämpft: folgt ruhiger als der Finger
    wh.s.push([now, x]); if (wh.s.length > 10) wh.s.shift();
    // über das Ende hinaus: sofort zurückfedern statt im Nachlauf hängen zu bleiben
    var out = x > xFor(0) + 1 || x < xFor(items.length - 1) - 1;
    if ((wh.dec >= 3 && a < wh.peak * 0.8) || (out && wh.dec >= 1)) {
      // Schwung nur kurz weiterdenken und höchstens drei Einträge weit vom Start der Geste – sonst rauscht die Skala durch
      var vel = speed(wh.s, now) * 0.6; wh.locked = true;
      var to = Math.max(wh.from - 3, Math.min(wh.from + 3, nearest(x + vel * 0.16)));
      go(to, vel); return;
    }
    wheelT = setTimeout(function () { wh = null; go(nearest(x), 0); }, 110);
  }, { passive: false });
  row.addEventListener('keydown', function (e) {
    var m = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (m) { e.preventDefault(); go(idx + m); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(items.length - 1); }
  });
  function refresh() { if (!strip.children.length) return; measure(); stop(); x = target = xFor(idx); v = 0; paint(); }
  // nur bei echter Größenänderung neu messen; der erste Aufruf direkt nach dem Beobachten würde sonst den Auftritt abbrechen
  if (window.ResizeObserver) new ResizeObserver(function () { if (row.clientWidth !== W) refresh(); }).observe(row);
  return {
    refresh: refresh,
    jump: function (i) { idx = i; refresh(); },
    // Auftritt: Skala steht seitlich versetzt und gleitet mit derselben Feder an ihren Platz wie beim Klicken
    intro: function (offset) { refresh(); x = target + offset; paint(); go(idx, 0); },
    // neue Einträge; die Skala fährt von der Seite her auf den ersten
    set: function (html, i, from) {
      stop(); strip.innerHTML = html; live = -1; measure(); idx = i || 0;
      x = xFor(idx) + (from || 0); target = xFor(idx); paint(); if (from) go(idx, 0);
    },
  };
}

// Pille: feste Mitte, Breite wandert fließend zwischen den Wörtern links und rechts der Mitte
function pillFrame(pill, inset, extra) {
  return function (c, items, centers, widths, W) {
    var n = centers.length, i = 0;
    while (i < n - 2 && centers[i + 1] < c) i++;
    var t = n > 1 ? Math.max(0, Math.min(1, (c - centers[i]) / (centers[i + 1] - centers[i]))) : 0;
    var w = widths[i] + ((n > 1 ? widths[i + 1] : widths[i]) - widths[i]) * t;
    pill.style.width = (w - inset).toFixed(1) + 'px';
    if (extra) extra(c, items, centers, W);
  };
}

function initWork(root) {
  var sl = root.querySelector('.sl'), groups = JSON.parse(sl.dataset.groups);
  var r1 = sl.querySelector('.l1'), r2 = sl.querySelector('.l2');
  var cards = [].slice.call(root.querySelectorAll('.grid .card'));
  var h1 = root.querySelector('h1');
  var s = { l1: root.dataset.initial, l2: '' };
  var keys = groups.map(function (g) { return g.key; });
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function group(k) { return groups[keys.indexOf(k)]; }
  function subs(k) { return [['', 'Alle']].concat(group(k).cats.map(function (c) { return [c, c]; })); }
  function subHtml(list) { return list.map(function (o, j) { return '<span class="sl-item" role="option" aria-selected="' + (j === 0) + '">' + esc(o[1]) + '</span>'; }).join(''); }
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealHidden = function () {};
  function show() {
    cards.forEach(function (c) {
      var on = c.dataset.kind === s.l1 && (!s.l2 || JSON.parse(c.dataset.cats).indexOf(s.l2) >= 0);
      // durch den Filter wieder sichtbar: kurz von unten einblenden
      if (on && c.hidden && c.animate && !calm) c.animate([{ opacity: 0, translate: '0 12px' }, { opacity: 1, translate: '0 0' }], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      if (on && c.hidden) revealHidden(c); // durch den Filter sichtbar: eigene Einblendung, ohne Warten aufs Scrollen
      c.hidden = !on;
    });
  }
  var list2 = subs(s.l1), swapT = 0;
  var d2 = Dial(r2, { frame: pillFrame(r2.querySelector('.sl-pill'), 6), onCommit: function (i) {
    var val = list2[i][0]; if (val !== s.l2) { s.l2 = val; show(); }
  } });
  // Badge nur, solange der gewählte Eintrag ruhig unter der Pille steht
  var sel = -2, pf1 = pillFrame(r1.querySelector('.sl-pill'), 6);
  function mark(i) { if (i === sel) return; sel = i; [].forEach.call(r1.querySelectorAll('.sl-item'), function (el, j) { el.classList.toggle('sel', j === i); }); }
  var d1 = Dial(r1, { frame: function (c, items, centers, widths, W) {
    pf1(c, items, centers, widths, W);
    var n = 0, bd = Infinity; for (var k = 0; k < centers.length; k++) { var dd = Math.abs(centers[k] - c); if (dd < bd) { bd = dd; n = k; } }
    mark(bd <= 4 ? n : -1);
  }, onCommit: function (i) {
    var g = groups[i]; if (g.key === s.l1) return;
    s.l1 = g.key; s.l2 = ''; list2 = subs(g.key); show();
    // auf der Seite bleiben, aber Adresse und Titel anpassen; das Projekt-Overlay schließt künftig hierhin
    history.replaceState(history.state, '', g.url); document.title = g.title; if (h1) h1.textContent = g.label;
    var layer = document.getElementById('sheet-layer'); if (layer) { layer.dataset.home = g.url; layer.dataset.homeTitle = g.title; }
    // untere Skala kurz ausblenden und mit den neuen Bereichen wieder einblenden
    clearTimeout(swapT); r2.classList.add('is-out');
    swapT = setTimeout(function () { d2.set(subHtml(list2), 0); r2.classList.remove('is-out'); }, 120);
  } });
  d1.jump(Math.max(0, keys.indexOf(s.l1))); d2.jump(0);

  // Auftritt der Skalen, sobald die Schrift steht (sonst stimmen die Breiten nicht): Zeilen blenden nacheinander ein,
  // die Skalen gleiten von rechts unter die Pillen
  var started = false;
  function intro() {
    if (started) return; started = true;
    if (calm) { d1.refresh(); d2.refresh(); root.classList.add('is-ready'); return; }
    root.classList.add('is-ready');
    d1.intro(140);
    setTimeout(function () { d2.intro(140); }, 110);
  }
  if (document.fonts) { document.fonts.ready.then(intro); setTimeout(intro, 500); } else intro();

  // Kacheln: beim ersten Sichtbarwerden von unten einblenden, der Bildstapel fächert danach auf.
  // Was zusammen sichtbar wird, kommt leicht versetzt nacheinander; beim ersten Laden nach den Skalen.
  var first = true;
  function reveal(list) {
    list.sort(function (a, b) { var r = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return r.top - q.top || r.left - q.left; });
    list.forEach(function (c, i) {
      c.style.setProperty('--d', ((first ? 220 : 0) + i * 90) + 'ms');
      c.classList.add('in');
      setTimeout(function () { c.classList.add('done'); c.style.removeProperty('--d'); }, (first ? 220 : 0) + i * 90 + 1400);
    });
    first = false;
  }
  if (calm || !window.IntersectionObserver) cards.forEach(function (c) { c.classList.add('in', 'done'); });
  else {
    var io = new IntersectionObserver(function (entries) {
      var list = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { io.unobserve(e.target); return e.target; });
      if (list.length) reveal(list);
    }, { rootMargin: '0px 0px -8% 0px' });
    cards.forEach(function (c) { if (!c.hidden) io.observe(c); });
    revealHidden = function (c) { io.unobserve(c); c.classList.add('in', 'done'); };
  }
}

document.querySelectorAll('.work').forEach(initWork);
