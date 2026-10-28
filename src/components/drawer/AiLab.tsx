import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Cpu,
  FlaskConical,
  ListOrdered,
  Minimize2,
  RotateCcw,
  ScrollText,
  UserRound,
  Wand2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { runTransform, TRANSFORMS } from "../../lib/ai";
import type { TransformId } from "../../lib/ai";
import { useLang } from "../../state/app";
import { num, wordCount } from "../../lib/utils";
import { pushToast } from "../../lib/toast";
import type { Dict } from "../../lib/i18n";

const ICONS: Record<TransformId, LucideIcon> = {
  structure: ScrollText,
  condense: Minimize2,
  role: UserRound,
  steps: ListOrdered,
  varify: Wand2,
};

export function AiLab({
  content,
  onApply,
}: {
  content: string;
  onApply: (next: string) => void;
}) {
  const { lang, t } = useLang();
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState<TransformId | null>(null);
  const [done, setDone] = useState<TransformId | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const run = (id: TransformId) => {
    if (!content.trim()) return;
    if (timer.current) clearInterval(timer.current);
    setBusy(id);
    setDone(null);
    setOutput("");
    const target = runTransform(id, content);
    let i = 0;
    timer.current = setInterval(() => {
      i += Math.max(2, Math.round(target.length / 110)) + Math.floor(Math.random() * 3);
      if (i >= target.length) {
        setOutput(target);
        setBusy(null);
        setDone(id);
        if (timer.current) clearInterval(timer.current);
      } else {
        setOutput(target.slice(0, i));
      }
    }, 16);
  };

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    setBusy(null);
    setDone(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-xl border border-brand-400/20 bg-brand-400/[0.06] p-3.5">
        <Cpu size={16} className="mt-0.5 shrink-0 text-brand-300" strokeWidth={2.2} />
        <p className="text-[12px] leading-5 text-mist-300">{t.aiIntro}</p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {TRANSFORMS.map((id) => {
          const Icon = ICONS[id];
          const active = busy === id || done === id;
          return (
            <button
              key={id}
              onClick={() => run(id)}
              disabled={!!busy || !content.trim()}
              className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-start transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-brand-400/40 bg-brand-400/10"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-brand-400/30 hover:bg-brand-400/[0.06]"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${
                  active ? "bg-brand-400 text-ink-950" : "bg-white/[0.06] text-brand-300 group-hover:bg-brand-400 group-hover:text-ink-950"
                }`}
              >
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <span>
                <span className="block text-[13px] font-bold text-mist-100">
                  {t[`tf_${id}` as keyof Dict] as string}
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-mist-500">
                  {t[`tf_${id}_d` as keyof Dict] as string}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-black/30">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-mist-500">
            <FlaskConical size={13} className="text-brand-300" />
            {t.aiAfter}
          </span>
          {(output || busy) && (
            <span className="num text-[11px] font-semibold text-mist-500">
              {num(wordCount(output), lang)} / {num(wordCount(content), lang)}
            </span>
          )}
        </div>
        <div dir="auto" className="max-h-72 min-h-32 overflow-y-auto whitespace-pre-wrap break-words p-4 text-[13px] leading-7 text-mist-200 scroll-thin">
          {output ? (
            <>
              {output}
              {busy && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9 }}
                  className="ms-1 inline-block h-4 w-2 rounded-sm bg-brand-300 align-middle"
                />
              )}
            </>
          ) : (
            <span className="text-mist-600">{busy ? t.aiWorking : t.aiEmpty}</span>
          )}
        </div>
        <AnimatePresence>
          {done && !busy && output && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-end gap-2 overflow-hidden border-t border-white/[0.06] px-4 py-3"
            >
              <button onClick={() => { setOutput(""); setDone(null); }} className="btn-quiet px-3.5 py-2 text-xs">
                <RotateCcw size={13} strokeWidth={2.4} />
                {t.aiDiscard}
              </button>
              <button
                onClick={() => {
                  onApply(output);
                  stop();
                  setOutput("");
                  pushToast({ title: t.aiApplied, desc: t.noteAi, kind: "success" });
                }}
                className="btn-primary px-3.5 py-2 text-xs"
              >
                <Check size={13} strokeWidth={3} />
                {t.aiApply}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {busy && (
        <button onClick={stop} className="btn-danger mx-auto px-4 py-2 text-xs">
          <X size={13} strokeWidth={2.6} />
          {t.cancel}
        </button>
      )}
    </div>
  );
}
