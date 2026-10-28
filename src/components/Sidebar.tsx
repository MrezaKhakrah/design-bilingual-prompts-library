import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Clock3,
  Database,
  LayoutGrid,
  Plus,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useLang, useLib } from "../state/app";
import { CAT_COLORS, catLabel, num } from "../lib/utils";
import { pushToast } from "../lib/toast";
import { CategoryIcon } from "./CategoryIcon";
import { InstallSection } from "./InstallSection";
import type { Filter } from "../types";

const WEEK = 7 * 86400000;

export function Sidebar({
  filter,
  setFilter,
  onOpenExport,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  onOpenExport: () => void;
}) {
  const { lang, toggleLang, t } = useLang();
  const { prompts, categories, addCategory, removeCategory } = useLib();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(CAT_COLORS[3]);

  const counts = useMemo(() => {
    const fav = prompts.filter((p) => p.favorite).length;
    const recent = prompts.filter((p) => Date.now() - p.updatedAt < WEEK).length;
    const perCat = new Map<string, number>();
    prompts.forEach((p) => perCat.set(p.categoryId, (perCat.get(p.categoryId) || 0) + 1));
    return { fav, recent, perCat };
  }, [prompts]);

  const navItems = [
    { key: "all" as const, label: t.all, icon: LayoutGrid, count: prompts.length },
    { key: "fav" as const, label: t.favorites, icon: Star, count: counts.fav },
    { key: "recent" as const, label: t.recent, icon: Clock3, count: counts.recent },
  ];

  const submitCategory = () => {
    const name = newName.trim();
    if (!name) return;
    const c = addCategory(name, newColor);
    setNewName("");
    setAdding(false);
    setFilter({ kind: "cat", catId: c.id });
    pushToast({ title: t.catAdded, desc: name, kind: "success" });
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto p-5 scroll-thin">
      {/* Brand */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600 shadow-[0_10px_32px_-8px_rgb(45_212_191/0.55)]">
          <Sparkles size={20} className="text-ink-950" strokeWidth={2.4} />
          <span className="absolute -end-1 -top-1 h-3 w-3 rounded-full border-2 border-ink-950 bg-sun-400" />
        </div>
        <div>
          <div className="display text-[17px] font-extrabold leading-tight text-mist-50">
            {t.brandName}
          </div>
          <div className="text-[11px] font-medium text-mist-500">{t.brandTag}</div>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = filter.kind === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setFilter({ kind: item.key })}
              className={`group relative flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition duration-200 ${
                active
                  ? "bg-white/[0.07] text-mist-50"
                  : "text-mist-400 hover:bg-white/[0.04] hover:text-mist-100"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-gradient-to-b from-brand-300 to-brand-500"
                />
              )}
              <Icon
                size={17}
                strokeWidth={2.2}
                className={active ? "text-brand-300" : "text-mist-500 group-hover:text-mist-300"}
              />
              <span className="flex-1 text-start">{item.label}</span>
              <span className="num text-[11px] font-bold text-mist-500">
                {num(item.count, lang)}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Categories */}
      <div className="flex flex-col gap-1.5">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist-500">
            {t.categories}
          </span>
          <button
            onClick={() => setAdding((v) => !v)}
            className="icon-btn h-6 w-6"
            title={t.newCategory}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>

        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="glass mb-2 flex flex-col gap-2.5 rounded-xl p-3">
                <input
                  className="field px-3 py-2 text-[13px]"
                  placeholder={t.categoryNamePh}
                  value={newName}
                  autoFocus
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitCategory()}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {CAT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        aria-label={c}
                        className={`grid h-5 w-5 cursor-pointer place-items-center rounded-full transition ${
                          newColor === c ? "ring-2 ring-white/70 ring-offset-2 ring-offset-ink-900" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {newColor === c && <Check size={10} strokeWidth={3.5} className="text-ink-950" />}
                      </button>
                    ))}
                  </div>
                  <button onClick={submitCategory} className="btn-primary px-3 py-1.5 text-xs">
                    {t.add}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {categories.map((c) => {
          const active = filter.kind === "cat" && filter.catId === c.id;
          return (
            <div key={c.id} className="group relative">
              <button
                onClick={() => setFilter({ kind: "cat", catId: c.id })}
                className={`relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200 ${
                  active
                    ? "bg-white/[0.07] text-mist-50"
                    : "text-mist-400 hover:bg-white/[0.04] hover:text-mist-100"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-gradient-to-b from-brand-300 to-brand-500"
                  />
                )}
                <span
                  className="grid h-6 w-6 place-items-center rounded-lg"
                  style={{ backgroundColor: `${c.color}1f`, color: c.color }}
                >
                  <CategoryIcon icon={c.icon} size={12.5} />
                </span>
                <span className="flex-1 truncate text-start">{catLabel(c, lang)}</span>
                <span className="num text-[11px] font-bold text-mist-500 group-hover:hidden">
                  {num(counts.perCat.get(c.id) || 0, lang)}
                </span>
              </button>
              {categories.length > 1 && (
                <button
                  onClick={() => {
                    removeCategory(c.id);
                    if (active) setFilter({ kind: "all" });
                    pushToast({ title: t.catDeleted, kind: "danger" });
                  }}
                  className="absolute end-2 top-1/2 hidden -translate-y-1/2 rounded-md p-1 text-mist-500 hover:bg-rose-500/20 hover:text-rose-300 group-hover:block"
                  title={t.deleteCat}
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Footer */}
      <div className="flex flex-col gap-2.5 border-t border-white/[0.06] pt-4">
        <InstallSection />
        <button onClick={onOpenExport} className="btn-quiet w-full justify-start">
          <Database size={16} strokeWidth={2.2} className="text-mist-400" />
          {t.exportTitle}
        </button>
        <div className="flex items-center justify-between">
          <span className="chip border-brand-400/20 bg-brand-400/10 text-brand-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-300 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-300" />
            </span>
            {t.offlineBadge}
          </span>
          <button
            onClick={toggleLang}
            className="flex cursor-pointer items-center overflow-hidden rounded-full border border-white/10 text-[11px] font-bold transition hover:border-white/25"
            title="Language / زبان"
          >
            <span
              className={`px-2.5 py-1.5 transition ${
                lang === "fa" ? "bg-brand-400 text-ink-950" : "text-mist-400 hover:text-mist-100"
              }`}
            >
              فا
            </span>
            <span
              className={`px-2.5 py-1.5 transition ${
                lang === "en" ? "bg-brand-400 text-ink-950" : "text-mist-400 hover:text-mist-100"
              }`}
            >
              EN
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
