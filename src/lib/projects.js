// Projekte: eine JSON-Datei pro Projekt in src/data/projects, der Dateiname ist die Adresse (/projekte/emmy/).
// Das ist die einzige Quelle für alle Stellen, an denen Projekte auftauchen:
//   featured: true  → im Karussell „Ausgewählte Arbeiten“ der Startseite, Reihenfolge über order
//   draft: true     → nirgends sichtbar (Entwurf)
//   blocks          → hat das Projekt Inhaltsblöcke, bekommt es eine eigene Seite; sonst nur Kachel in der Sammlung
// Pflichtfelder: title, cover. Optional: coverMobile, coverPos, year, client, services, categories, intro, order.
const files = import.meta.glob('../data/projects/*.json', { eager: true, import: 'default' });

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const projectUrl = (slug) => `${base}projekte/${slug}/`;
export const projectsIndexUrl = `${base}projekte/`;

const all = Object.entries(files).map(([path, data]) => {
  const slug = path.split('/').pop().replace('.json', '');
  for (const key of ['title', 'cover']) {
    if (!data[key]) throw new Error(`Projekt „${slug}“: Feld „${key}“ fehlt (src/data/projects/${slug}.json)`);
  }
  return { slug, ...data, categories: data.categories || [], hasPage: Array.isArray(data.blocks) && data.blocks.length > 0 };
}).filter((p) => !p.draft);

// Reihenfolge: zuerst nach order (ohne order ans Ende), dann nach Jahr (neu zuerst), dann nach Titel
const rank = (p) => (Number.isFinite(p.order) ? p.order : 1e6);
all.sort((a, b) => rank(a) - rank(b) || String(b.year || '').localeCompare(String(a.year || '')) || a.title.localeCompare(b.title, 'de'));

/** Alle veröffentlichten Projekte (Sammlung /projekte/) */
export const allProjects = all;
/** Karussell der Startseite */
export const featuredProjects = all.filter((p) => p.featured);
/** Alle Bereiche, die in Projekten vorkommen (Filter der Sammlung), nach Häufigkeit */
export const projectCategories = Object.entries(
  all.flatMap((p) => p.categories).reduce((m, c) => ((m[c] = (m[c] || 0) + 1), m), {})
).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de')).map(([c]) => c);

/** Projekte mit eigener Seite, jeweils mit dem nächsten für „Nächstes Projekt“ */
const withPage = all.filter((p) => p.hasPage);
export const projects = withPage.map((p, i) => ({
  ...p,
  next: withPage.length > 1 ? withPage[(i + 1) % withPage.length].slug : null,
}));
export const getProject = (slug) => projects.find((p) => p.slug === slug);
