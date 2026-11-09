// Pfade unter public/assets, funktionieren auch mit Unterpfad (GitHub-Preview).
// Das CMS speichert /assets/…, im Code reicht der Teil danach.
const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const asset = (path) => `${base}assets/${path.replace(/^\/?(assets\/)?/, '')}`;
