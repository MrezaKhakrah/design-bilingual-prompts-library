import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Braces,
  Layers,
  Lightbulb,
  Plus,
  Repeat2,
  SearchX,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import type { Filter, Prompt } from "./types";
import { AppProvider, useLang, useLib } from "./state/app";
import { catLabel, extractVars, num, searchPrompts } from "./lib/utils";
import { pushToast } from "./lib/toast";
import { exportJSON, exportMarkdown } from "./lib/exporters";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { PromptCard } from "./components/PromptCard";
import { EditorDrawer } from "./components/EditorDrawer";
import type { EditorState } from "./components/EditorDrawer";
import { VariableModal } from "./components/VariableModal";
import { ExportDialog } from "./components/ExportDialog";
import { CommandPalette } from "./components/CommandPalette";
import { ToastHost } from "./components/ToastHost";

const WEEK = 7 * 86400000;

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

function greetingKey(h: number): "greet_morning" | "greet_afternoon" | "greet_evening" | "greet_night" {
  if (h < 12) return "greet_morning";
  if (h < 17) return "greet_afternoon";
  if (h < 20) return "greet_evening";
  return "greet_night";
}

function Shell() {
  const { lang, toggleLang, t } = useLang();
  const lib = useLib();
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [fillId, setFillId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const catMap = useMemo(
    () => new Map(lib.categories.map((c) => [c.id, c])),
    [lib.categories]
  );

  const filtered = useMemo(() => {
    let list = lib.prompts;
    if (filter.kind === "fav") list = list.filter((p) => p.favorite);
    else if (filter.kind === "recent") list = list.filter((p) => Date.now() - p.updatedAt < WEEK);
    else if (filter.kind === "cat") list = list.filter((p) => p.categoryId === filter.catId);
    list = searchPrompts(list, query, (p) => catLabel(catMap.get(p.categoryId), lang));
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [lib.prompts, filter, query, catMap, lang]);

  const stats = useMemo(() => {
    const favs = lib.prompts.filter((p) => p.favorite).length;
    const copies = lib.prompts.reduce((s, p) => s + p.usage, 0);
    const vars = lib.prompts.reduce((s, p) => s + extractVars(p.content).length, 0);
    return { total: lib.prompts.length, favs, copies, vars };
  }, [lib.prompts]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        openNew();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const openNew = () =>
    setEditor({
      kind: "new",
      categoryId: filter.kind === "cat" ? filter.catId : undefined,
    });

  const handleDelete = (p: Prompt) => {
    setEditor(null);
    const removed = lib.removePrompt(p.id) ?? p;
    pushToast({
      title: t.deleted,
      desc: removed.title,
      kind: "danger",
      action: { label: t.undo, run: () => lib.restorePrompt(removed) },
    });
  };

  const fillPrompt = fillId ? lib.prompts.find((p) => p.id === fillId) ?? null : null;

  const sectionTitle =
    filter.kind === "fav"
      ? t.favorites
      : filter.kind === "recent"
        ? t.recent
        : filter.kind === "cat"
          ? catLabel(catMap.get(filter.catId ?? ""), lang)
          : t.all;

  const tip = t.tips[new Date().getDate() % t.tips.length];

  const statChips = [
    { icon: Layers, label: t.statPrompts, value: stats.total, color: "#2dd4bf" },
    { icon: Star, label: t.statFavs, value: stats.favs, color: "#fbbf24" },
    { icon: Repeat2, label: t.statCopies, value: stats.copies, color: "#38bdf8" },
    { icon: Braces, label: t.statVars, value: stats.vars, color: "#fb7185" },
  ];

  return (
    <div className="relative min-h-screen">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-44 start-[-12%] h-[36rem] w-[36rem] rounded-full bg-brand-500/[0.12] blur-[130px]" />
        <div className="absolute bottom-[-22%] end-[-10%] h-[32rem] w-[32rem] rounded-full bg-sun-500/[0.08] blur-[130px]" />
        <div className="absolute top-[32%] start-[38%] h-[26rem] w-[26rem] rounded-full bg-violet-500/[0.07] blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: GRAIN }} />
      </div>

      <div className="relative z-[1] flex">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-e border-white/[0.06] bg-ink-950/40 lg:block">
          <Sidebar filter={filter} setFilter={setFilter} onOpenExport={() => setExportOpen(true)} />
        </aside>

        {/* mobile sidebar */}
        <AnimatePresence>
          {navOpen && (
            <motion.div
              className="fixed inset-0 z-[55] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
              <motion.div
                initial={{ x: lang === "fa" ? "105%" : "-105%" }}
                animate={{ x: 0 }}
                exit={{ x: lang === "fa" ? "105%" : "-105%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="absolute inset-y-0 start-0 w-[19rem] border-e border-white/10 bg-ink-900 shadow-2xl"
              >
                <button onClick={() => setNavOpen(false)} className="icon-btn absolute end-3 top-3 z-10">
                  <X size={16} />
                </button>
                <Sidebar
                  filter={filter}
                  setFilter={(f) => {
                    setFilter(f);
                    setNavOpen(false);
                  }}
                  onOpenExport={() => {
                    setNavOpen(false);
                    setExportOpen(true);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* main column */}
        <div className="min-w-0 flex-1 px-4 sm:px-8">
          <Topbar
            query={query}
            setQuery={setQuery}
            onNew={openNew}
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenSidebar={() => setNavOpen(true)}
          />

          <main className="mx-auto max-w-6xl pb-24">
            {/* hero */}
            <section className="flex flex-wrap items-end justify-between gap-6 pb-9 pt-6">
              <div className="min-w-0 max-w-xl">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[12.5px] font-bold text-brand-300"
                >
                  {t[greetingKey(new Date().getHours())]}
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="display mt-2.5 text-[28px] font-black leading-[1.25] text-mist-50 sm:text-[38px]"
                >
                  <span className="text-glow num">{num(stats.total, lang)} </span>
                  {t.heroLine}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="mt-3.5 flex items-start gap-2 text-[12.5px] leading-5 text-mist-500"
                >
                  <Lightbulb size={14} className="mt-0.5 shrink-0 text-sun-400" />
                  <span>
                    <b className="font-bold text-mist-300">{t.tip}: </b>
                    {tip}
                  </span>
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
              >
                {statChips.map((s) => (
                  <div
                    key={s.label}
                    className="glass flex items-center gap-2.5 rounded-2xl px-3.5 py-3"
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: `${s.color}1c`, color: s.color }}
                    >
                      <s.icon size={14} strokeWidth={2.3} />
                    </span>
                    <span>
                      <span className="num block text-[15px] font-black leading-4 text-mist-50">
                        {num(s.value, lang)}
                      </span>
                      <span className="text-[10px] font-semibold text-mist-500">{s.label}</span>
                    </span>
                  </div>
                ))}
              </motion.div>
            </section>

            {/* section heading */}
            <div className="mb-5 flex items-center gap-3">
              <h2 className="display text-lg font-extrabold text-mist-100">{sectionTitle}</h2>
              <span className="num chip border-brand-400/25 bg-brand-400/10 text-brand-300">
                {num(filtered.length, lang)}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
            </div>

            {/* grid */}
            {filtered.length > 0 ? (
              <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((p) => (
                    <PromptCard
                      key={p.id}
                      prompt={p}
                      category={catMap.get(p.categoryId)}
                      onOpen={() => setEditor({ kind: "edit", id: p.id })}
                      onFillVars={() => setFillId(p.id)}
                      onDelete={() => handleDelete(p)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : query || filter.kind !== "all" ? (
              <div className="glass mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-3xl px-8 py-14 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.05] text-mist-400">
                  <SearchX size={26} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="display text-lg font-extrabold text-mist-100">{t.emptyTitle}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-5 text-mist-500">{t.emptyDesc}</p>
                </div>
                <button
                  onClick={() => {
                    setQuery("");
                    setFilter({ kind: "all" });
                  }}
                  className="btn-quiet"
                >
                  {t.all}
                </button>
              </div>
            ) : (
              <div className="glass relative mx-auto mt-10 flex max-w-lg flex-col items-center gap-5 overflow-hidden rounded-3xl px-8 py-16 text-center">
                <div className="absolute -top-20 start-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-brand-400/15 blur-[70px]" />
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-300 to-brand-600 shadow-[0_16px_50px_-12px_rgb(45_212_191/0.5)]">
                  <Sparkles size={32} className="text-ink-950" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="display text-xl font-extrabold text-mist-50">{t.emptyAllTitle}</h3>
                  <p className="mx-auto mt-2 max-w-80 text-[13px] leading-6 text-mist-400">
                    {t.emptyAllDesc}
                  </p>
                </div>
                <button onClick={openNew} className="btn-primary">
                  <Plus size={15} strokeWidth={2.8} />
                  {t.newPrompt}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* overlays */}
      <AnimatePresence>
        {editor && (
          <EditorDrawer
            key={editor.kind === "edit" ? editor.id : "new"}
            state={editor}
            onClose={() => setEditor(null)}
            onDeleted={handleDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fillPrompt && <VariableModal prompt={fillPrompt} onClose={() => setFillId(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {paletteOpen && (
          <CommandPalette
            onClose={() => setPaletteOpen(false)}
            onOpenPrompt={(id) => setEditor({ kind: "edit", id })}
            onNew={openNew}
            onShowAll={() => setFilter({ kind: "all" })}
            onShowFav={() => setFilter({ kind: "fav" })}
            onOpenExport={() => setExportOpen(true)}
            onToggleLang={toggleLang}
            onExportJSON={() => exportJSON({ prompts: lib.prompts, categories: lib.categories })}
            onExportMD={() => exportMarkdown({ prompts: lib.prompts, categories: lib.categories }, lang)}
          />
        )}
      </AnimatePresence>

      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
