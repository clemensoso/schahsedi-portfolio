# Schah Sedi Portfolio

Website von Schah Sedi, gebaut mit Astro. Texte und Bilder werden über [Pages CMS](https://app.pagescms.org) gepflegt, die Felder stehen in `.pages.yml`.

## Lokal starten

```bash
npm install
npm run dev
```

Die Seite läuft dann unter http://localhost:4321/.

## Aufbau

- `src/pages/index.astro`: Startseite, setzt die Bausteine zusammen
- `src/components/`: Bausteine wie Hero, Karussell, Kontakt und Footer
- `src/data/`: alle Texte, Bilder und Links der Startseite, das CMS schreibt in diese Dateien
- `src/styles/`: Gestaltung, `tokens.css` enthält Farben, Schriften und Abstände
- `src/scripts/site.js`: Animationen und Interaktionen
- `public/assets/`: Bilder und Logos
- `public/styleguide.html`: Styleguide

Die Preview läuft über GitHub Pages und ist für Suchmaschinen gesperrt (`noindex`). Das finale Hosting ist IONOS.

Texte, Bilder und Logos sind urheberrechtlich geschützt.
