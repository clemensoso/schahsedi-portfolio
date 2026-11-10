// Schriftzug-Animationen (.lettering) in Projekten starten: beim direkten Aufruf und jedes Mal,
// wenn das Overlay neuen Inhalt bekommt (Ereignis „sheet:content“). Endet von selbst, wenn das Element weg ist.
(function () {
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Zeiten in ms, Bogen in % der Schriftzug-Größe
  var IN = 1300, WRITE = 1820, ARROW = 300, HOLD = 1400, OUT = 1200, GAP = 350, WRITE_START = 150;
  var DX = 45, DY = 90, ROT = 10;

  function setup(el) {
    if (el.dataset.ready) return;
    el.dataset.ready = '1';
    var mx = el.querySelector('.lt-mx'), my = el.querySelector('.lt-my');
    var a = el.querySelector('.lt-a'), b = el.querySelector('.lt-b');
    var la = a.getTotalLength() + 2, lb = b.getTotalLength() + 2;
    a.style.strokeDasharray = la + ' ' + la;
    b.style.strokeDasharray = lb + ' ' + lb;

    if (calm) { a.style.opacity = 1; b.style.opacity = 1; return; } // ohne Bewegung: fertiger Schriftzug

    var anims = [], timers = [];
    function run(node, kf, opts) { opts.fill = 'forwards'; anims.push(node.animate(kf, opts)); }
    function at(ms, fn) { timers.push(setTimeout(function () { if (el.isConnected) fn(); else stop(); }, ms)); }
    function stop() { anims.forEach(function (x) { x.cancel(); }); timers.forEach(clearTimeout); anims = []; timers = []; }

    function play() {
      stop();
      a.style.opacity = 0; b.style.opacity = 0;

      // Rein: von unten links im Bogen (X sanft, Y stärker abgebremst), dabei einblenden
      run(mx, [{ transform: 'translateX(-' + DX + '%)', opacity: 0 }, { opacity: 1, offset: 0.45 }, { transform: 'translateX(0)', opacity: 1 }],
        { duration: IN, easing: 'cubic-bezier(.25,.6,.3,1)' });
      run(my, [{ transform: 'translateY(' + DY + '%) rotate(-' + ROT + 'deg)' }, { transform: 'translateY(0) rotate(0deg)' }],
        { duration: IN, easing: 'cubic-bezier(.1,.75,.2,1)' });

      // Zeichnen, dann Pfeilspitze
      at(WRITE_START, function () {
        a.style.opacity = 1;
        run(a, [{ strokeDashoffset: -la }, { strokeDashoffset: 0 }], { duration: WRITE, easing: 'cubic-bezier(.55,.05,.4,1)' });
      });
      var tArrow = WRITE_START + WRITE;
      at(tArrow, function () {
        b.style.opacity = 1;
        run(b, [{ strokeDashoffset: lb }, { strokeDashoffset: 0 }], { duration: ARROW, easing: 'cubic-bezier(.3,0,.1,1)' });
      });

      // Raus: im Bogen nach unten rechts, ausblenden und dabei wegzeichnen
      var tOut = tArrow + ARROW + HOLD;
      at(tOut, function () {
        run(mx, [{ transform: 'translateX(0)', opacity: 1 }, { opacity: 1, offset: 0.5 }, { transform: 'translateX(' + DX + '%)', opacity: 0 }],
          { duration: OUT, easing: 'cubic-bezier(.45,0,.75,.6)' });
        run(my, [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(' + DY + '%) rotate(' + ROT + 'deg)' }],
          { duration: OUT, easing: 'cubic-bezier(.8,0,.9,.3)' });
        run(a, [{ strokeDashoffset: 0 }, { strokeDashoffset: la }], { duration: OUT * 0.9, easing: 'cubic-bezier(.45,0,.6,1)' });
        run(b, [{ strokeDashoffset: 0 }, { strokeDashoffset: -lb }], { duration: OUT * 0.35, easing: 'cubic-bezier(.45,0,.6,1)' });
      });

      at(tOut + OUT + GAP, play);
    }
    play();
  }

  function scan() { document.querySelectorAll('.lettering').forEach(setup); }
  document.addEventListener('sheet:content', scan);
  scan();
})();
