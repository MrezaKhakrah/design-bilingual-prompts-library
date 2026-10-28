import type { Category, Lang, Prompt } from "../types";

export const uid = (): string =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const VAR_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

export function extractVars(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(VAR_RE.source, "g");
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

export function fillVars(text: string, values: Record<string, string>): string {
  return text.replace(new RegExp(VAR_RE.source, "g"), (raw, g1: string) => {
    const key = g1.trim();
    const v = values[key];
    return v && v.trim() !== "" ? v : raw;
  });
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export const faDigits = (s: string | number): string =>
  String(s).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);

export const num = (n: number, lang: Lang): string =>
  lang === "fa" ? faDigits(n) : String(n);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[يی]/g, "ی")
    .replace(/[كک]/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/‌/g, " ") // ZWNJ
    .trim();
}

export function searchPrompts(
  prompts: Prompt[],
  query: string,
  catLabel: (p: Prompt) => string
): Prompt[] {
  const q = normalize(query);
  if (!q) return prompts;
  const tokens = q.split(/\s+/).filter(Boolean);
  return prompts.filter((p) => {
    const hay = normalize(
      [p.title, p.desc, p.content, p.tags.join(" "), catLabel(p)].join(" ")
    );
    return tokens.every((t) => hay.includes(t));
  });
}

export function relTime(ts: number, lang: Lang, t: (k: string) => string): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return t("justNow");
  if (min < 60) return `${num(min, lang)} ${t("minAgo")}`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${num(hr, lang)} ${t("hourAgo")}`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${num(day, lang)} ${t("dayAgo")}`;
  const d = new Date(ts);
  return d.toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function catLabel(cat: Category | undefined, lang: Lang): string {
  if (!cat) return "—";
  return cat.label[lang] || cat.label[lang === "fa" ? "en" : "fa"];
}

export const CAT_COLORS = [
  "#2dd4bf",
  "#38bdf8",
  "#fbbf24",
  "#a78bfa",
  "#fb7185",
  "#a3e635",
  "#f472b6",
  "#f97316",
];

export function colorWith(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export const hasPersian = (s: string): boolean => /[؀-ۿ]/.test(s);

export const wordCount = (s: string): number =>
  (s.trim().match(/\S+/g) || []).length;
