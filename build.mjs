// Gera o site estático em dist/ a partir de src/pages + src/layout.html.
// Cada página começa com um bloco de metadados em JSON:  <!--meta { "title": "..." } -->
// Uso: node build.mjs
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE_URL = "https://reguilas.pt"; // TODO: confirmar o domínio final
const root = new URL(".", import.meta.url).pathname;
const out = join(root, "dist");
const layout = readFileSync(join(root, "src/layout.html"), "utf8");
const partials = Object.fromEntries(
  readdirSync(join(root, "src/partials")).map((f) => [f.replace(".html", ""), readFileSync(join(root, "src/partials", f), "utf8")]),
);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, "assets"), join(out, "assets"), { recursive: true });
for (const f of ["robots.txt", "_headers"]) cpSync(join(root, "public", f), join(out, f));

const fill = (tpl, vars) => tpl.replace(/\{\{\s*([\w.>-]+)\s*\}\}/g, (_, key) => {
  if (key.startsWith(">")) return fill(partials[key.slice(1)] ?? "", vars);
  return vars[key] ?? "";
});

const pages = readdirSync(join(root, "src/pages")).filter((f) => f.endsWith(".html"));
const urls = [];
for (const file of pages) {
  const raw = readFileSync(join(root, "src/pages", file), "utf8");
  const match = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!match) throw new Error(`${file}: falta o bloco <!--meta {...} -->`);
  const meta = JSON.parse(match[1]);
  const slug = file === "index.html" ? "" : file.replace(/\.html$/, "");
  const path = slug ? `/${slug}` : "/";
  const vars = {
    ...meta,
    url: SITE_URL + path,
    siteUrl: SITE_URL,
    ogImage: SITE_URL + (meta.ogImage ?? "/assets/img/hero-home.webp"),
    robots: meta.noindex ? "noindex" : "index, follow",
    bodyClass: meta.bodyClass ?? "",
  };
  // Marca o link ativo no menu
  let html = fill(layout, { ...vars, content: fill(raw.slice(match[0].length), vars) });
  html = html.replace(new RegExp(`(<a[^>]*href="${path.replace(/\//g, "\\/")}")`, "g"), '$1 aria-current="page"');
  writeFileSync(join(out, file), html);
  if (!meta.noindex) urls.push(SITE_URL + path);
}

writeFileSync(join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`);

console.log(`✓ ${pages.length} páginas geradas em dist/`);
