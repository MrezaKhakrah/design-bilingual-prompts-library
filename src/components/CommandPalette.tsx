import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CornerDownLeft,
  Database,
  FileJson2,
  FileText,
  Languages,
  LayoutGrid,
  Plus,
  Search,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLang, useLib } from "../state/app";
import { catLabel, searchPrompts } from "../lib/utils";

interface Item {
  key: string;
  icon: LucideIcon;
  title: string;
  hint?: string;
  group: "prompts" | "commands";
  run: () => void;
}

export function CommandPalette({
  onClose,
  onOpenPrompt,
  onNew,
  onShowAll,
  onShowFav,
  onOpenExport,
  onToggleLang,
  onExportJSON,
  onExportMD,
}: {
  onClose: () => void;
  onOpenPrompt: (id: string) => void;
  onNew: () => void;
  onShowAll: () => void;
  onShowFav: () => void;
  onOpenExport: () => void;
  onToggleLang: () => void;
  onExportJSON: () => void;
  onExportMD: () => void;
}) {
  const { lang, t } = useLang();
  const { prompts, categories } = useLib();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const items = useMemo<Item[]>(() => {
    const matched = searchPrompts(prompts, query, (p) =>
      catLabel(catMap.get(p.categoryId), lang)
    ).slice(0, 6);
    const promptItems: Item[] = matched.map((p) => ({
      key: `p-${p.id}`,
      icon: FileText,
      title: p.title || t.newPromptTitle,
      hint: catLabel(catMap.get(p.categoryId), lang),
      group: "prompts",
      run: () => onOpenPrompt(p.id),
    }));
    const q = query.trim().toLowerCase();
    const commands: Item[] = (
      [
        { key: "c-new", icon: Plus, title: t.cmdNew, run: onNew },
        { key: "c-fav", icon: Star, title: t.cmdFav, run: onShowFav },
        { key: "c-all", icon: LayoutGrid, title: t.cmdAll, run: onShowAll },
        { key: "c-center", icon: Database, title: t.cmdOpenExport, run: onOpenExport },
        { key: "c-json", icon: FileJson2, title: t.cmdExportJson, run: onExportJSON },
        { key: "c-md", icon: FileText, title: t.cmdExportMd, run: onExportMD },
        { key: "c-lang", icon: Languages, title: t.cmdLang, run: onToggleLang },
      ] as Item[]
    ).filter((c) => !q || c.title.toLowerCase().includes(q));
    return [...promptItems, ...commands];
  }, [query, prompts, catMap, lang, t, onOpenPrompt, onNew, onShowFav, onShowAll, onOpenExport, onExportJSON, onExportMD, onToggleLang]);

  useEffect(() => setIndex(0), [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${index}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const runItem = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    item.run();
  };

  let promptHeaderShown = false;
  let commandHeaderShown = false;

  return (
    <motion.div
      className="fixed inset-0 z-[80]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="relative mx-auto mt-[12vh] w-[min(92vw,36rem)] overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-[0_40px_100px_-20px_rgb(0_0_0/0.9)] backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
          <Search size={17} className="shrink-0 text-brand-300" strokeWidth={2.4} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                runItem(items[index]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder={t.palettePh}
            className="w-full bg-transparent text-[15px] font-medium text-mist-50 placeholder:text-mist-600 focus:outline-none"
          />
          <span className="kbd">esc</span>
        </div>

        <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-2 scroll-thin">
          {items.length === 0 && (
            <div className="py-10 text-center text-[13px] text-mist-500">{t.noCmd}</div>
          )}
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              let header: string | null = null;
              if (item.group === "prompts" && !promptHeaderShown) {
                header = t.promptsGroup;
                promptHeaderShown = true;
              } else if (item.group === "commands" && !commandHeaderShown) {
                header = t.commands;
                commandHeaderShown = true;
              }
              const active = i === index;
              return (
                <div key={item.key}>
                  {header && (
                    <div className="px-3 pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-600">
                      {header}
                    </div>
                  )}
                  <button
                    data-idx={i}
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => runItem(item)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${
                      active ? "bg-brand-400/12 text-mist-50" : "text-mist-300"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                        active ? "bg-brand-400 text-ink-950" : "bg-white/[0.05] text-mist-400"
                      }`}
                    >
                      <item.icon size={14} strokeWidth={2.3} />
                    </span>
                    <span className="flex-1 truncate text-[13.5px] font-semibold">{item.title}</span>
                    {item.hint && (
                      <span className="chip py-0.5 text-[10px]">{item.hint}</span>
                    )}
                    {active && <CornerDownLeft size={13} className="shrink-0 text-brand-300" />}
                  </button>
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4 border-t border-white/[0.06] px-5 py-3 text-[10.5px] font-semibold text-mist-600">
          <span className="flex items-center gap-1.5">
            <span className="kbd">↑↓</span>
            {lang === "fa" ? "حرکت" : "navigate"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="kbd">↵</span>
            {lang === "fa" ? "انتخاب" : "select"}
          </span>
          <span className="ms-auto">{t.palettePh}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
