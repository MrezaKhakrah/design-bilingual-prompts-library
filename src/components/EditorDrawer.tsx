import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Braces,
  ClipboardCopy,
  FlaskConical,
  History,
  PenLine,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";
import type { Prompt, PromptVersion } from "../types";
import { useLang, useLib } from "../state/app";
import { catLabel, copyText, extractVars, num, relTime, VAR_RE } from "../lib/utils";
import { pushToast } from "../lib/toast";
import { VariablesPanel } from "./drawer/VariablesPanel";
import { VersionsPanel } from "./drawer/VersionsPanel";
import { AiLab } from "./drawer/AiLab";
import { CategoryIcon } from "./CategoryIcon";

export type EditorState = { kind: "new"; categoryId?: string } | { kind: "edit"; id: string };

type TabId = "edit" | "vars" | "versions" | "ai";

interface Draft {
  title: string;
  desc: string;
  content: string;
  categoryId: string;
  tags: string[];
  note: string;
}

const EMPTY: Draft = {
  title: "",
  desc: "",
  content: "",
  categoryId: "",
  tags: [],
  note: "",
};

/** Splits content into highlighted {{variable}} tokens for the overlay <pre>. */
function useTokens(text: string): ReactNode[] {
  return useMemo(() => {
    const parts: ReactNode[] = [];
    let last = 0;
    let i = 0;
    const re = new RegExp(VAR_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) {
        parts.push(<span key={i++}>{text.slice(last, m.index)}</span>);
      }
      parts.push(
        <mark
          key={i++}
          className="rounded-[4px] bg-sun-400/[0.16] px-[1px] text-sun-300 box-decoration-clone"
        >
          {m[0]}
        </mark>
      );
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(<span key={i++}>{text.slice(last)}</span>);
    return parts;
  }, [text]);
}

export function EditorDrawer({
  state,
  onClose,
  onDeleted,
}: {
  state: EditorState;
  onClose: () => void;
  onDeleted: (p: Prompt) => void;
}) {
  const { lang, dir, t } = useLang();
  const { prompts, categories, createPrompt, savePrompt, setDefaults, applyContent, bumpUsage } =
    useLib();
  const prompt = state.kind === "edit" ? prompts.find((p) => p.id === state.id) ?? null : null;

  const [draft, setDraft] = useState<Draft>(() =>
    state.kind === "edit"
      ? { title: "", desc: "", content: "", categoryId: "", tags: [], note: "" }
      : { ...EMPTY, categoryId: state.categoryId ?? categories[0]?.id ?? "" }
  );
  const [defsDraft, setDefsDraft] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<TabId>("edit");
  const [tagInput, setTagInput] = useState("");
  const [initialized, setInitialized] = useState(false);

  const preRef = useRef<HTMLPreElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.kind === "edit" && prompt && !initialized) {
      setDraft({
        title: prompt.title,
        desc: prompt.desc,
        content: prompt.content,
        categoryId: prompt.categoryId,
        tags: prompt.tags,
        note: "",
      });
      setDefsDraft(prompt.defaults);
      setInitialized(true);
    }
  }, [state, prompt, initialized]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const vars = useMemo(() => extractVars(draft.content), [draft.content]);
  const tokens = useTokens(draft.content);

  const dirty = useMemo(() => {
    if (state.kind === "new") {
      return Boolean(draft.title || draft.content);
    }
    if (!prompt) return false;
    return (
      draft.title !== prompt.title ||
      draft.desc !== prompt.desc ||
      draft.content !== prompt.content ||
      draft.categoryId !== prompt.categoryId ||
      draft.tags.join("\n") !== prompt.tags.join("\n")
    );
  }, [draft, prompt, state.kind]);

  const syncScroll = () => {
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  const commitDefaults = (d: Record<string, string>) => {
    setDefsDraft(d);
    if (prompt) setDefaults(prompt.id, d);
  };

  const save = () => {
    const finalTitle = draft.title.trim() || t.newPromptTitle;
    const patch = {
      title: finalTitle,
      desc: draft.desc.trim(),
      content: draft.content,
      categoryId: draft.categoryId || categories[0]?.id || "",
      tags: draft.tags,
    };
    if (state.kind === "new") {
      const created = createPrompt({ categoryId: patch.categoryId });
      savePrompt(created.id, patch, draft.note.trim() || t.noteInitial);
      if (Object.keys(defsDraft).length) setDefaults(created.id, defsDraft);
      pushToast({ title: t.created, desc: finalTitle, kind: "success" });
      onClose();
    } else if (prompt) {
      savePrompt(prompt.id, patch, draft.note.trim());
      setDraft((d) => ({ ...d, title: finalTitle, note: "" }));
      pushToast({ title: t.saved, desc: finalTitle, kind: "success" });
    }
  };

  const copyCurrent = async () => {
    const ok = await copyText(draft.content);
    if (ok) {
      if (prompt) bumpUsage(prompt.id);
      pushToast({ title: t.copied, desc: t.copiedDesc, kind: "success" });
    }
  };

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, "");
    if (tag && !draft.tags.includes(tag) && draft.tags.length < 8) {
      setDraft((d) => ({ ...d, tags: [...d.tags, tag] }));
    }
    setTagInput("");
  };

  const tabs: { id: TabId; label: string; icon: typeof PenLine; badge?: number }[] = [
    { id: "edit", label: t.tabEdit, icon: PenLine },
    { id: "vars", label: t.tabVars, icon: Braces, badge: vars.length },
    { id: "versions", label: t.tabVersions, icon: History, badge: prompt?.versions.length },
    { id: "ai", label: t.tabAi, icon: FlaskConical },
  ];

  const lastVersion = prompt?.versions[0];
  const ready = state.kind === "new" || initialized;

  return (
    <motion.div
      className="fixed inset-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: dir === "rtl" ? "-106%" : "106%" }}
        animate={{ x: 0 }}
        exit={{ x: dir === "rtl" ? "-106%" : "106%" }}
        transition={{ type: "spring", stiffness: 300, damping: 34 }}
        className="absolute inset-y-0 end-0 flex w-full max-w-2xl flex-col border-s border-white/10 bg-ink-900 shadow-[0_0_80px_rgb(0_0_0/0.6)]"
      >
        {/* header */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 pb-1 pt-5">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-mist-500">
              {state.kind === "new" ? t.newPrompt : t.edit}
              {dirty && (
                <span className="flex items-center gap-1.5 text-sun-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-sun-400" />
                  {t.unsaved}
                </span>
              )}
            </div>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder={t.titlePh}
              className="display w-full bg-transparent pb-1 text-xl font-extrabold text-mist-50 placeholder:text-mist-600 focus:outline-none"
            />
          </div>
          <button onClick={onClose} className="icon-btn h-9 w-9 shrink-0" title={t.close}>
            <X size={18} />
          </button>
        </div>

        {/* tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
            {tabs.map((tb) => {
              const active = tab === tb.id;
              return (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-bold transition ${
                    active ? "text-mist-50" : "text-mist-500 hover:text-mist-200"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="drawer-tab"
                      className="absolute inset-0 rounded-lg bg-white/[0.08] shadow-inner"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <tb.icon size={13.5} strokeWidth={2.3} className="relative z-[1] shrink-0" />
                  <span className="relative z-[1] hidden sm:inline">{tb.label}</span>
                  {typeof tb.badge === "number" && tb.badge > 0 && (
                    <span className="num relative z-[1] rounded-md bg-white/10 px-1.5 text-[10px] font-black text-mist-300">
                      {num(tb.badge, lang)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-6 scroll-thin">
          {!ready ? null : tab === "edit" ? (
            <div className="flex flex-col gap-5">
              {/* category */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-mist-500">
                  {t.categoryField}
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const active = draft.categoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setDraft((d) => ({ ...d, categoryId: c.id }))}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-bold transition duration-200 ${
                          active
                            ? "border-transparent text-mist-50"
                            : "border-white/10 bg-white/[0.03] text-mist-400 hover:text-mist-100"
                        }`}
                        style={active ? { backgroundColor: `${c.color}26`, boxShadow: `inset 0 0 0 1.5px ${c.color}` } : {}}
                      >
                        <CategoryIcon icon={c.icon} size={12} className="shrink-0" />
                        {catLabel(c, lang)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* desc */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-mist-500">
                  {t.descField}
                </label>
                <input
                  className="field"
                  value={draft.desc}
                  onChange={(e) => setDraft((d) => ({ ...d, desc: e.target.value }))}
                  placeholder={t.descPh}
                />
              </div>

              {/* content with live variable highlighting */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-mist-500">
                    {t.contentField}
                  </label>
                  <span className="num text-[11px] font-semibold text-mist-500">
                    {num(draft.content.length, lang)} {t.chars}
                  </span>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30 transition focus-within:border-brand-400/50 focus-within:ring-4 focus-within:ring-brand-400/10">
                  <pre
                    ref={preRef}
                    aria-hidden
                    dir="auto"
                    className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words p-4 font-[inherit] text-[13.5px] leading-7 text-mist-200"
                  >
                    {tokens}
                    {"\n"}
                  </pre>
                  <textarea
                    ref={taRef}
                    dir="auto"
                    value={draft.content}
                    rows={12}
                    onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                    onScroll={syncScroll}
                    className="relative block min-h-72 w-full resize-y bg-transparent p-4 font-[inherit] text-[13.5px] leading-7 text-transparent caret-sun-300 outline-none selection:bg-brand-400/25"
                    placeholder={t.contentHint}
                    spellCheck={false}
                  />
                </div>
                <p className="mt-2 text-[11.5px] leading-5 text-mist-500">{t.contentHint}</p>
                {vars.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-mist-500">
                      <span className="num">{num(vars.length, lang)}</span> {t.varsDetected}:
                    </span>
                    {vars.map((v) => (
                      <code
                        key={v}
                        dir="ltr"
                        className="rounded-md border border-sun-400/25 bg-sun-400/10 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-sun-300"
                      >
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                )}
              </div>

              {/* tags */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-mist-500">
                  {t.tagsField}
                </label>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition focus-within:border-brand-400/50">
                  <TagIcon size={14} className="ms-1 shrink-0 text-mist-500" />
                  {draft.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/[0.07] px-2 py-1 text-[11.5px] font-semibold text-mist-200"
                    >
                      #{tag}
                      <button
                        onClick={() =>
                          setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== tag) }))
                        }
                        className="cursor-pointer text-mist-500 transition hover:text-rose-300"
                      >
                        <X size={11} strokeWidth={3} />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagInput);
                      } else if (e.key === "Backspace" && !tagInput && draft.tags.length) {
                        setDraft((d) => ({ ...d, tags: d.tags.slice(0, -1) }));
                      }
                    }}
                    onBlur={() => tagInput.trim() && addTag(tagInput)}
                    placeholder={draft.tags.length ? "" : t.tagsPh}
                    className="min-w-24 flex-1 bg-transparent px-1 py-1 text-[12.5px] text-mist-100 placeholder:text-mist-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* version note */}
              <div>
                <input
                  className="field text-[12.5px]"
                  value={draft.note}
                  onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                  placeholder={t.versionNotePh}
                />
              </div>
            </div>
          ) : tab === "vars" ? (
            <VariablesPanel
              content={draft.content}
              defaults={defsDraft}
              onDefaults={commitDefaults}
              onCopiedFilled={() => prompt && bumpUsage(prompt.id)}
            />
          ) : tab === "versions" ? (
            <VersionsPanel
              prompt={prompt}
              onRestore={(v: PromptVersion) => setDraft((d) => ({ ...d, content: v.content }))}
            />
          ) : (
            <AiLab
              content={draft.content}
              onApply={(next) => {
                setDraft((d) => ({ ...d, content: next }));
                if (prompt) applyContent(prompt.id, next, t.noteAi);
              }}
            />
          )}
        </div>

        {/* footer */}
        <div className="flex items-center gap-3 border-t border-white/[0.06] px-6 py-4">
          <div className="hidden min-w-0 flex-1 items-center gap-3 text-[11px] font-medium text-mist-500 sm:flex">
            {prompt && lastVersion ? (
              <>
                <span>
                  {t.lastEdit} · {relTime(prompt.updatedAt, lang, (k) => String(t[k as keyof typeof t]))}
                </span>
                <span className="h-3 w-px bg-white/10" />
                <span className="num">
                  {t.version} {num(lastVersion.n, lang)}
                </span>
              </>
            ) : (
              <span>{t.saveCloseHint}</span>
            )}
          </div>
          {prompt && (
            <button
              onClick={() => onDeleted(prompt)}
              className="icon-btn h-9 w-9 text-rose-400/80 hover:bg-rose-500/15 hover:text-rose-300"
              title={t.deletePrompt}
            >
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={() => void copyCurrent()} className="btn-quiet px-3.5">
            <ClipboardCopy size={14} strokeWidth={2.4} />
            <span className="hidden sm:inline">{t.copy}</span>
          </button>
          <button onClick={save} className="btn-primary">
            {state.kind === "new" ? t.create : t.save}
          </button>
        </div>
      </motion.aside>
    </motion.div>
  );
}
