import { defineConfig } from 'astro/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Nur im Dev-Server: Die Werkzeug-Seite /sticker-layout/ speichert hierüber die Sticker-Positionen je Breakpoint
// direkt in src/data/stickers.json. Im fertigen Build gibt es diesen Weg nicht.
const stickerFile = fileURLToPath(new URL('./src/data/stickers.json', import.meta.url));
const stickerSave = {
  name: 'sticker-save',
  configureServer(server) {
    server.middlewares.use('/__stickers', (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        try {
          const { bp, positions } = JSON.parse(body);
          if (!/^\d{3,4}$/.test(String(bp)) || typeof positions !== 'object') throw new Error('Ungültige Daten');
          let data = {};
          try { data = JSON.parse(readFileSync(stickerFile, 'utf8')); } catch {}
          data[String(bp)] = positions;
          const sorted = Object.fromEntries(Object.keys(data).sort((a, b) => a - b).map((k) => [k, data[k]]));
          writeFileSync(stickerFile, JSON.stringify(sorted, null, 2) + '\n');
          res.setHeader('Content-Type', 'application/json'); res.end('{"ok":true}');
        } catch (e) { res.statusCode = 400; res.end(String(e.message || e)); }
      });
    });
  },
};

// ASTRO_BASE setzt den Unterpfad für die GitHub-Preview; auf der eigenen Domain läuft die Seite im Wurzelverzeichnis.
export default defineConfig({
  site: 'https://schahsedi.com',
  base: process.env.ASTRO_BASE || '/',
  devToolbar: { enabled: false },
  vite: { plugins: [stickerSave] },
});
