import type { BackupFile, Category, Prompt, Store } from "../types";
import { catLabel } from "./utils";
import type { Lang } from "../types";

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const stamp = (): string => new Date().toISOString().slice(0, 10);

export function exportJSON(store: Store): void {
  const backup: BackupFile = {
    app: "promptfolio",
    version: 1,
    exportedAt: Date.now(),
    prompts: store.prompts,
    categories: store.categories,
  };
  download(
    `promptfolio-backup-${stamp()}.json`,
    JSON.stringify(backup, null, 2),
    "application/json"
  );
}

export function promptToMarkdown(p: Prompt, cat: string): string {
  const tags = p.tags.length ? p.tags.map((t) => `#${t}`).join(" ") : "—";
  return `### ${p.title}\n\n> ${p.desc || "—"} · ${cat} · ${tags}\n\n\`\`\`\n${p.content}\n\`\`\`\n`;
}

export function exportMarkdown(store: Store, lang: Lang): void {
  const catById = new Map<string, Category>(store.categories.map((c) => [c.id, c]));
  const groups = new Map<string, Prompt[]>();
  store.prompts.forEach((p) => {
    const arr = groups.get(p.categoryId) || [];
    arr.push(p);
    groups.set(p.categoryId, arr);
  });
  const head =
    lang === "fa"
      ? `# پرامپت‌فولیو — پشتیبان مارک‌داون\n\n${store.prompts.length} پرامپت · ${new Date().toLocaleDateString("fa-IR")}\n\n---\n`
      : `# Promptfolio — Markdown backup\n\n${store.prompts.length} prompts · ${new Date().toLocaleDateString("en-US")}\n\n---\n`;
  let body = "";
  groups.forEach((items, catId) => {
    body += `\n## ${catLabel(catById.get(catId), lang)}\n\n`;
    items.forEach((p) => {
      body += promptToMarkdown(p, catLabel(catById.get(catId), lang)) + "\n";
    });
  });
  download(`promptfolio-${stamp()}.md`, head + body, "text/markdown");
}

function coercePrompt(raw: unknown): Prompt | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== "string" || typeof r.content !== "string") return null;
  const now = Date.now();
  const versions = Array.isArray(r.versions)
    ? (r.versions as Prompt["versions"]).filter(
        (v) => v && typeof v.content === "string"
      )
    : [];
  const content = r.content;
  if (versions.length === 0) {
    versions.push({ id: String(r.id ?? "") + "-v1", n: 1, content, createdAt: now });
  }
  return {
    id: typeof r.id === "string" ? r.id : String(Math.random()),
    title: r.title,
    desc: typeof r.desc === "string" ? r.desc : "",
    content,
    categoryId: typeof r.categoryId === "string" ? r.categoryId : "",
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string") : [],
    favorite: Boolean(r.favorite),
    usage: typeof r.usage === "number" ? r.usage : 0,
    createdAt: typeof r.createdAt === "number" ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : now,
    versions,
    defaults:
      typeof r.defaults === "object" && r.defaults !== null
        ? (r.defaults as Record<string, string>)
        : {},
  };
}

export function parseBackup(json: string): { prompts: Prompt[]; categories: Category[] } | null {
  try {
    const data = JSON.parse(json) as unknown;
    const container =
      typeof data === "object" && data !== null && Array.isArray((data as BackupFile).prompts)
        ? (data as BackupFile)
        : Array.isArray(data)
          ? ({ prompts: data as unknown[], categories: [] } as unknown as BackupFile)
          : null;
    if (!container) return null;
    const prompts = (container.prompts as unknown[])
      .map(coercePrompt)
      .filter((p): p is Prompt => p !== null);
    const categories = Array.isArray(container.categories)
      ? container.categories.filter(
          (c): c is Category =>
            !!c && typeof c.id === "string" && typeof c.label === "object"
        )
      : [];
    return { prompts, categories };
  } catch {
    return null;
  }
}
