import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Braces,
  Check,
  ClipboardCopy,
  FileCode2,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
  Copy as CopyIcon,
  Repeat2,
} from "lucide-react";
import type { Category, Prompt } from "../types";
import { useLang, useLib } from "../state/app";
import { catLabel, copyText, extractVars, num } from "../lib/utils";
import { pushToast } from "../lib/toast";
import { promptToMarkdown } from "../lib/exporters";
import { CategoryIcon } from "./CategoryIcon";

export function PromptCard({
  prompt,
  category,
  onOpen,
  onFillVars,
  onDelete,
}: {
  prompt: Prompt;
  category: Category | undefined;
  onOpen: () => void;
  onFillVars: () => void;
  onDelete: () => void;
}) {
  const { lang, t } = useLang();
  const { toggleFavorite, duplicatePrompt, bumpUsage } = useLib();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const vars = useMemo(() => extractVars(prompt.content), [prompt.content]);
  const color = category?.color ?? "#7f8a9c";

  /* close the dropdown on any outside interaction */
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  const track = (e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const doCopy = async () => {
    if (vars.length > 0) {
      onFillVars();
      return;
    }
    const ok = await copyText(prompt.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      bumpUsage(prompt.id);
      pushToast({ title: t.copied, desc: t.copiedDesc, kind: "success" });
    }
  };

  const copyMd = async () => {
    await copyText(promptToMarkdown(prompt, catLabel(category, lang)));
    setMenuOpen(false);
    pushToast({ title: t.copied, desc: t.copyMd, kind: "success" });
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      onMouseMove={track}
      onClick={() => {
        if (menuOpen) return;
        onOpen();
      }}
      className={`spot-card group relative flex cursor-pointer flex-col gap-3 rounded-2xl border bg-white/[0.025] p-5 transition duration-300 ${
        menuOpen
          ? "border-white/[0.14]"
          : "border-white/[0.07] hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.045] hover:shadow-[0_24px_60px_-24px_rgb(0_0_0/0.8)]"
      }`}
    >
      {/* top row */}
      <div className="relative z-[2] flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ backgroundColor: `${color}1c`, color }}
        >
          <CategoryIcon icon={category?.icon ?? "tag"} size={11} />
          {catLabel(category, lang)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(prompt.id);
            }}
            aria-label={t.favorites}
            className={`icon-btn h-7 w-7 ${
              prompt.favorite ? "text-sun-400 hover:text-sun-300" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <motion.span whileTap={{ scale: 1.5 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="grid place-items-center">
              <Star size={15} strokeWidth={2.2} fill={prompt.favorite ? "currentColor" : "none"} />
            </motion.span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label={t.menuTitle}
            className="icon-btn h-7 w-7 opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* body */}
      <div className="relative z-[2]">
        <h3 className="display truncate text-[15px] font-bold text-mist-50">
          {prompt.title || t.newPromptTitle}
        </h3>
        <p className="mt-1.5 line-clamp-2 min-h-10 text-[12.5px] leading-5 text-mist-400">
          {prompt.desc || prompt.content}
        </p>
      </div>

      {/* tags */}
      <div className="relative z-[2] flex min-h-6 flex-wrap items-center gap-1.5">
        {prompt.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="chip py-0.5 text-[10px] text-mist-500">
            #{tag}
          </span>
        ))}
        {vars.length > 0 && (
          <span className="chip border-sun-400/25 bg-sun-400/10 py-0.5 text-[10px] text-sun-300">
            <Braces size={10} strokeWidth={2.4} />
            <span className="num">{num(vars.length, lang)}</span> {t.variablesCount}
          </span>
        )}
      </div>

      {/* footer */}
      <div className="relative z-[2] mt-auto flex items-center justify-between border-t border-white/[0.05] pt-3">
        <span className="num inline-flex items-center gap-1.5 text-[11px] font-semibold text-mist-500">
          <Repeat2 size={12} strokeWidth={2.2} />
          {num(prompt.usage, lang)} {t.useTimes}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            void doCopy();
          }}
          className={`relative inline-flex h-8 cursor-pointer items-center gap-2 overflow-hidden rounded-lg px-3 text-xs font-bold transition duration-200 active:scale-95 ${
            copied
              ? "bg-brand-400 text-ink-950"
              : "bg-white/[0.07] text-mist-200 hover:bg-brand-400 hover:text-ink-950"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="ok"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5"
              >
                <Check size={13} strokeWidth={3} /> {t.copied}
              </motion.span>
            ) : (
              <motion.span
                key="cp"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5"
              >
                {vars.length > 0 ? (
                  <FileCode2 size={13} strokeWidth={2.4} />
                ) : (
                  <ClipboardCopy size={13} strokeWidth={2.4} />
                )}
                {vars.length > 0 ? t.fillVars : t.copy}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-[5]"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute end-3 top-12 z-[6] w-44 overflow-hidden rounded-xl border border-white/10 bg-ink-800/95 p-1.5 shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {[
                {
                  icon: Pencil,
                  label: t.edit,
                  run: () => {
                    setMenuOpen(false);
                    onOpen();
                  },
                },
                {
                  icon: CopyIcon,
                  label: t.duplicate,
                  run: () => {
                    duplicatePrompt(prompt.id);
                    setMenuOpen(false);
                    pushToast({ title: t.duplicated, kind: "success" });
                  },
                },
                { icon: FileCode2, label: t.copyMd, run: () => void copyMd() },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.run}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-mist-300 transition hover:bg-white/[0.07] hover:text-mist-50"
                >
                  <item.icon size={14} strokeWidth={2.2} />
                  {item.label}
                </button>
              ))}
              <div className="my-1 h-px bg-white/[0.06]" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-rose-300 transition hover:bg-rose-500/15"
              >
                <Trash2 size={14} strokeWidth={2.2} />
                {t.deletePrompt}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
