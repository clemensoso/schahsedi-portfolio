// Schriftzug-Animationen (.lettering) in Projekten starten: beim direkten Aufruf und jedes Mal,
// wenn das Overlay neuen Inhalt bekommt (Ereignis „sheet:content“). Endet von selbst, wenn das Element weg ist.
(function () {
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Einstellungen (ms)
  var FADE_IN = 600;    // leichtes Einblenden, parallel zum Schreibbeginn
  var WRITE = 1820;     // Schriftzug schreiben
  var BEAT = 180;       // kurzes Innehalten vor dem Pfeil
  var ARROW = 860;      // Pfeil schnappt rein
  var HOLD = 1500;      // Standbild
  var FADE_OUT = 300;   // leichtes Ausblenden
  var GAP = 400;        // leer, dann Schleife
  var EASE_POWER = 3;   // Ease-in/-out beim Schreiben (2 sanft, 5 stark)
  var PUSH = 0.35;      // ganz langsamer Zoom über die Schleife, 0 = aus

  var A0 = WRITE + BEAT, A1 = A0 + ARROW, F0 = A1 + HOLD, F1 = F0 + FADE_OUT, CYCLE = F1 + GAP;

  function clamp(v) { return Math.min(1, Math.max(0, v)); }
  function inOut(t) { return t < 0.5 ? Math.pow(2 * t, EASE_POWER) / 2 : 1 - Math.pow(2 - 2 * t, EASE_POWER) / 2; }
  function snap(t) { return 1 - Math.pow(1 - t, 4); }
  function fade(t) { return t * t * (3 - 2 * t); }

  function show(p, len, e) {
    e = Math.min(len, Math.max(0, e));
    p.style.visibility = e < 0.5 ? 'hidden' : 'visible';
    p.style.strokeDasharray = e + ' ' + len * 3;
  }

  function setup(el) {
    if (el.dataset.ready) return;
    el.dataset.ready = '1';
    var obj = el.querySelector('.lt-obj'), cam = el.querySelector('.lt-cam');
    var main = el.querySelector('.lt-main'), arrow = el.querySelector('.lt-arrow');
    var Lm = main.getTotalLength(), La = arrow.getTotalLength();

    if (calm) { show(main, Lm, Lm); show(arrow, La, La); return; } // ohne Bewegung: fertiger Schriftzug

    var start = performance.now();
    function frame(now) {
      if (!el.isConnected) return; // Overlay geschlossen oder weitergeblättert
      var t = (now - start) % CYCLE;
      show(main, Lm, Lm * inOut(clamp(t / WRITE)));
      show(arrow, La, La * snap(clamp((t - A0) / ARROW)));
      obj.style.opacity = t < F0 ? fade(clamp(t / FADE_IN)) : 1 - fade(clamp((t - F0) / FADE_OUT));
      var s = 1 - PUSH / 2 + PUSH * (t / F1);
      cam.setAttribute('transform', 'translate(343 145) scale(' + s + ') translate(-343 -145)');
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function scan() { document.querySelectorAll('.lettering').forEach(setup); }
  document.addEventListener('sheet:content', scan);
  scan();
})();
