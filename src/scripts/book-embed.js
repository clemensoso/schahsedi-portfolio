// Eingebettete 3D-Bücher auf dem Handy größer zeigen.
// Das Buch rahmt sich selbst mit viel Luft ein (ca. zwei Drittel der Breite). Unter 900px vergrößern wir deshalb
// die Bühne im Buch um SCALE und schneiden den Überstand ab: Das Buch wird größer, der Weißraum drumherum kleiner.
// Die Bühne selbst wird skaliert (nicht nur die Grafik), damit Hover und Klick weiter genau auf dem Buch landen.
(function () {
  var SCALE = 1.17; // 1.3 war etwas zu groß
  var narrow = window.matchMedia('(max-width: 899px)');
  var CSS = 'interactive-book{overflow:hidden}' +
    '.stage.stage{transform:scale(' + SCALE + ');transform-origin:50% 50%}' +
    '.book-actions{position:relative;z-index:2}';

  function apply(doc) {
    var st = doc.getElementById('site-book-mobile');
    if (!st) {
      st = doc.createElement('style');
      st.id = 'site-book-mobile';
      (doc.head || doc.documentElement).appendChild(st);
    }
    st.textContent = narrow.matches ? CSS : '';
  }

  function setup(fig) {
    if (fig.dataset.book) return;
    fig.dataset.book = '1';
    var frame = fig.querySelector('iframe');
    if (!frame) return;
    (function look() {
      if (!fig.isConnected) return;
      var doc = null;
      try { doc = frame.contentDocument; } catch (e) { return; } // fremde Seite: nichts zu tun
      var book = doc && doc.querySelector('interactive-book');
      if (book) {
        apply(doc);
        narrow.addEventListener('change', function () { apply(doc); });
        return;
      }
      if (doc && doc.readyState === 'complete' && doc.URL !== 'about:blank') return; // keine Buchvorschau
      setTimeout(look, 300); // iframe lädt erst beim Hinscrollen
    })();
  }

  function scan() { document.querySelectorAll('.pb-embed').forEach(setup); }
  scan();
  document.addEventListener('sheet:content', scan);
})();
