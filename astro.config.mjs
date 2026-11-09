import { defineConfig } from 'astro/config';

// ASTRO_BASE setzt den Unterpfad für die GitHub-Preview; auf der eigenen Domain läuft die Seite im Wurzelverzeichnis.
export default defineConfig({
  site: 'https://schahsedi.com',
  base: process.env.ASTRO_BASE || '/',
  devToolbar: { enabled: false },
});
