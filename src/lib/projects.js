// Projekte: eine JSON-Datei pro Projekt in src/data/projects, der Dateiname ist die Adresse (/projekte/emmy/).
// Die Reihenfolge kommt aus dem Karussell der Startseite.
import work from '../data/work.json';

const files = import.meta.glob('../data/projects/*.json', { eager: true, import: 'default' });
const bySlug = Object.fromEntries(
  Object.entries(files).map(([path, data]) => [path.split('/').pop().replace('.json', ''), data])
);

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const projectUrl = (slug) => `${base}projekte/${slug}/`;

const order = work.slides.map((s) => s.project).filter((s) => s && bySlug[s]);
for (const slug of Object.keys(bySlug)) if (!order.includes(slug)) order.push(slug);

export const projects = order.map((slug, i) => ({
  slug,
  ...bySlug[slug],
  next: order.length > 1 ? order[(i + 1) % order.length] : null,
}));
export const getProject = (slug) => projects.find((p) => p.slug === slug);
