// Pfade unter public/assets, funktionieren auch mit Unterpfad (GitHub-Preview)
const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const asset = (path) => `${base}assets/${path}`;
