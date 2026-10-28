import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Category, Lang, Prompt, Store } from "../types";
import { dict } from "../lib/i18n";
import { seedStore } from "../lib/seed";
import { uid } from "../lib/utils";
import type { Dict } from "../lib/i18n";

const STORE_KEY = "promptfolio.v1";
const LANG_KEY = "promptfolio.lang";

/* ---------------- Language ---------------- */

interface LangCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: Dict;
}

const LangContext = createContext<LangCtx | null>(null);

/* ---------------- Library ---------------- */

export interface SavePatch {
  title?: string;
  desc?: string;
  content?: string;
  categoryId?: string;
  tags?: string[];
}

interface LibCtx {
  prompts: Prompt[];
  categories: Category[];
  createPrompt: (init?: Partial<SavePatch>) => Prompt;
  savePrompt: (id: string, patch: SavePatch, versionNote?: string) => void;
  removePrompt: (id: string) => Prompt | null;
  restorePrompt: (p: Prompt) => void;
  duplicatePrompt: (id: string) => void;
  toggleFavorite: (id: string) => void;
  bumpUsage: (id: string) => void;
  setDefaults: (id: string, defaults: Record<string, string>) => void;
  applyContent: (id: string, content: string, note: string) => void;
  addCategory: (name: string, color: string) => Category;
  removeCategory: (id: string) => void;
  importData: (incoming: { prompts: Prompt[]; categories: Category[] }) => number;
}

const LibContext = createContext<LibCtx | null>(null);

/* ---------------- Provider ---------------- */

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seedStore();
    const data = JSON.parse(raw) as Store;
    if (!Array.isArray(data.prompts) || !Array.isArray(data.categories)) {
      return seedStore();
    }
    return data;
  } catch {
    return seedStore();
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === "en" || saved === "fa" ? saved : "fa";
  });
  const [data, setData] = useState<Store>(loadStore);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable — app keeps working in-memory */
    }
  }, [data]);

  useEffect(() => {
    const dir = lang === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.title =
      lang === "fa"
        ? "Promptfolio — کتابخانه پرامپت شخصی"
        : "Promptfolio — Personal Prompt Library";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* noop */
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "fa" ? "en" : "fa";
      try {
        localStorage.setItem(LANG_KEY, next);
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const langValue = useMemo<LangCtx>(
    () => ({
      lang,
      dir: lang === "fa" ? "rtl" : "ltr",
      setLang,
      toggleLang,
      t: dict[lang],
    }),
    [lang, setLang, toggleLang]
  );

  /* ---------- actions ---------- */

  const createPrompt = useCallback((init?: Partial<SavePatch>): Prompt => {
    const now = Date.now();
    const p: Prompt = {
      id: uid(),
      title: init?.title ?? "",
      desc: init?.desc ?? "",
      content: init?.content ?? "",
      categoryId: init?.categoryId ?? "",
      tags: [],
      favorite: false,
      usage: 0,
      createdAt: now,
      updatedAt: now,
      versions: [],
      defaults: {},
    };
    setData((prev) => ({
      ...prev,
      prompts: [
        {
          ...p,
          categoryId: p.categoryId || prev.categories[0]?.id || "",
        },
        ...prev.prompts,
      ],
    }));
    return p;
  }, []);

  const savePrompt = useCallback(
    (id: string, patch: SavePatch, versionNote?: string) => {
      setData((prev) => ({
        ...prev,
        prompts: prev.prompts.map((p) => {
          if (p.id !== id) return p;
          const nextContent = patch.content ?? p.content;
          const lastContent = p.versions[0]?.content ?? null;
          const contentChanged =
            lastContent !== null
              ? nextContent !== lastContent
              : nextContent !== p.content;
          const newVersion = contentChanged
            ? {
                id: uid(),
                n: (p.versions[0]?.n ?? 0) + 1,
                content: nextContent,
                note: versionNote ?? "",
                createdAt: Date.now(),
              }
            : null;
          return {
            ...p,
            ...patch,
            content: nextContent,
            updatedAt: Date.now(),
            versions: newVersion ? [newVersion, ...p.versions] : p.versions,
          };
        }),
      }));
    },
    []
  );

  const removePrompt = useCallback((id: string): Prompt | null => {
    let removed: Prompt | null = null;
    setData((prev) => {
      removed = prev.prompts.find((p) => p.id === id) ?? null;
      return { ...prev, prompts: prev.prompts.filter((p) => p.id !== id) };
    });
    return removed;
  }, []);

  const restorePrompt = useCallback((p: Prompt) => {
    setData((prev) =>
      prev.prompts.some((x) => x.id === p.id)
        ? prev
        : { ...prev, prompts: [p, ...prev.prompts] }
    );
  }, []);

  const duplicatePrompt = useCallback((id: string) => {
    setData((prev) => {
      const src = prev.prompts.find((p) => p.id === id);
      if (!src) return prev;
      const now = Date.now();
      const copy: Prompt = {
        ...src,
        id: uid(),
        title: `${src.title} ‖`,
        favorite: false,
        usage: 0,
        createdAt: now,
        updatedAt: now,
        versions: [{ id: uid(), n: 1, content: src.content, createdAt: now }],
      };
      return { ...prev, prompts: [copy, ...prev.prompts] };
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      prompts: prev.prompts.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite } : p
      ),
    }));
  }, []);

  const bumpUsage = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      prompts: prev.prompts.map((p) =>
        p.id === id ? { ...p, usage: p.usage + 1 } : p
      ),
    }));
  }, []);

  const setDefaults = useCallback((id: string, defaults: Record<string, string>) => {
    setData((prev) => ({
      ...prev,
      prompts: prev.prompts.map((p) =>
        p.id === id ? { ...p, defaults } : p
      ),
    }));
  }, []);

  const applyContent = useCallback((id: string, content: string, note: string) => {
    setData((prev) => ({
      ...prev,
      prompts: prev.prompts.map((p) => {
        if (p.id !== id) return p;
        const v = {
          id: uid(),
          n: (p.versions[0]?.n ?? 0) + 1,
          content,
          note,
          createdAt: Date.now(),
        };
        return { ...p, content, updatedAt: Date.now(), versions: [v, ...p.versions] };
      }),
    }));
  }, []);

  const addCategory = useCallback((name: string, color: string): Category => {
    const c: Category = {
      id: uid(),
      label: { fa: name, en: name },
      icon: "tag",
      color,
    };
    setData((prev) => ({ ...prev, categories: [...prev.categories, c] }));
    return c;
  }, []);

  const removeCategory = useCallback((id: string) => {
    setData((prev) => {
      if (prev.categories.length <= 1) return prev;
      const fallback = prev.categories.find((c) => c.id !== id)?.id ?? "";
      return {
        categories: prev.categories.filter((c) => c.id !== id),
        prompts: prev.prompts.map((p) =>
          p.categoryId === id ? { ...p, categoryId: fallback } : p
        ),
      };
    });
  }, []);

  const importData = useCallback(
    (incoming: { prompts: Prompt[]; categories: Category[] }): number => {
      setData((prev) => {
        const cats = [...prev.categories];
        const catIds = new Set(cats.map((c) => c.id));
        for (const c of incoming.categories) {
          if (!catIds.has(c.id)) {
            cats.push(c);
            catIds.add(c.id);
          }
        }
        const existing = new Set(prev.prompts.map((p) => p.id));
        const defaultCat = cats[0]?.id ?? "";
        const fresh = incoming.prompts.map((p) => {
          const id = existing.has(p.id) ? uid() : p.id;
          existing.add(id);
          return {
            ...p,
            id,
            categoryId: catIds.has(p.categoryId) ? p.categoryId : defaultCat,
          };
        });
        return { categories: cats, prompts: [...fresh, ...prev.prompts] };
      });
      return incoming.prompts.length;
    },
    []
  );

  const libValue = useMemo<LibCtx>(
    () => ({
      prompts: data.prompts,
      categories: data.categories,
      createPrompt,
      savePrompt,
      removePrompt,
      restorePrompt,
      duplicatePrompt,
      toggleFavorite,
      bumpUsage,
      setDefaults,
      applyContent,
      addCategory,
      removeCategory,
      importData,
    }),
    [
      data,
      createPrompt,
      savePrompt,
      removePrompt,
      restorePrompt,
      duplicatePrompt,
      toggleFavorite,
      bumpUsage,
      setDefaults,
      applyContent,
      addCategory,
      removeCategory,
      importData,
    ]
  );

  return (
    <LangContext.Provider value={langValue}>
      <LibContext.Provider value={libValue}>{children}</LibContext.Provider>
    </LangContext.Provider>
  );
}

export function useLang(): LangCtx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside AppProvider");
  return ctx;
}

export function useLib(): LibCtx {
  const ctx = useContext(LibContext);
  if (!ctx) throw new Error("useLib must be used inside AppProvider");
  return ctx;
}
