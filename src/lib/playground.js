// Playground: eine JSON-Datei pro Arbeit in src/data/playground (Werkzeuge, Experimente, Bilder …).
// Pflichtfelder: title, image. href: eigene Seite (relativ zur Website, z. B. „playground/buchmacher/“) oder voller Link.
// draft: true blendet aus, order steuert die Reihenfolge (sonst neu zuerst).
const files = import.meta.glob('../data/playground/*.json', { eager: true, import: 'default' });
const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const playgroundUrl = `${base}playground/`;

const items = Object.entries(files).map(([path, data]) => {
  const slug = path.split('/').pop().replace('.json', '');
  for (const key of ['title', 'image']) {
    if (!data[key]) throw new Error(`Playground „${slug}“: Feld „${key}“ fehlt (src/data/playground/${slug}.json)`);
  }
  const href = data.href ? (/^https?:\/\//.test(data.href) ? data.href : base + data.href.replace(/^\//, '')) : null;
  return { slug, ...data, tags: data.tags || [], href, external: !!data.href && /^https?:\/\//.test(data.href) };
}).filter((p) => !p.draft);

const rank = (p) => (Number.isFinite(p.order) ? p.order : 1e6);
items.sort((a, b) => rank(a) - rank(b) || String(b.year || '').localeCompare(String(a.year || '')) || a.title.localeCompare(b.title, 'de'));

export const playgroundItems = items;
export const playgroundTypes = [...new Set(items.map((p) => p.type).filter(Boolean))];
