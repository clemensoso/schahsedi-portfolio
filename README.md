# Schah Sedi Portfolio

Website von Schah Sedi, gebaut mit Astro. Der Pflegebereich mit Pages CMS kommt als Nächstes.

## Lokal starten

```bash
npm install
npm run dev
```

Die Seite läuft dann unter http://localhost:4321/.

## Aufbau

- `src/pages/index.astro`: Startseite, setzt die Bausteine zusammen
- `src/components/`: Bausteine wie Hero, Karussell, Kontakt und Footer
- `src/data/home.json`: Projekte in den Hero-Kacheln und im Karussell
- `src/styles/`: Gestaltung, `tokens.css` enthält Farben, Schriften und Abstände
- `src/scripts/site.js`: Animationen und Interaktionen
- `public/assets/`: Bilder und Logos
- `public/styleguide.html`: Styleguide

Die Preview läuft über GitHub Pages und ist für Suchmaschinen gesperrt (`noindex`). Das finale Hosting ist IONOS.

Texte, Bilder und Logos sind urheberrechtlich geschützt.
