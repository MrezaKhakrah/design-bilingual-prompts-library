import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Braces, ClipboardCheck, X } from "lucide-react";
import type { Prompt } from "../types";
import { useLang, useLib } from "../state/app";
import { copyText, extractVars, fillVars, num } from "../lib/utils";
import { pushToast } from "../lib/toast";

export function VariableModal({
  prompt,
  onClose,
}: {
  prompt: Prompt;
  onClose: () => void;
}) {
  const { lang, t } = useLang();
  const { setDefaults, bumpUsage } = useLib();
  const vars = useMemo(() => extractVars(prompt.content), [prompt.content]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues({ ...prompt.defaults });
  }, [prompt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const preview = useMemo(() => fillVars(prompt.content, values), [prompt.content, values]);

  const submit = async () => {
    const ok = await copyText(preview);
    if (ok) {
      setDefaults(prompt.id, values);
      bumpUsage(prompt.id);
      pushToast({ title: t.copied, desc: t.copiedFilledDesc, kind: "success" });
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="glass relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-ink-900/95 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-sun-400/25 bg-sun-400/10 text-sun-300">
            <Braces size={17} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="display text-[15px] font-extrabold text-mist-50">{t.fillTitle}</h3>
            <p className="truncate text-[11.5px] text-mist-500">
              {prompt.title} · <span className="num">{num(vars.length, lang)}</span> {t.variablesCount}
            </p>
          </div>
          <button onClick={onClose} className="icon-btn" title={t.close}>
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto p-5 scroll-thin">
          <p className="text-[12px] leading-5 text-mist-400">{t.fillDesc}</p>
          {vars.map((v, i) => (
            <div key={v}>
              <label className="mb-1.5 block font-mono text-[11.5px] font-semibold text-sun-300" dir="ltr">
                {`{{${v}}}`}
              </label>
              <input
                className="field"
                autoFocus={i === 0}
                value={values[v] ?? ""}
                placeholder={t.fillEmpty}
                onChange={(e) => setValues((s) => ({ ...s, [v]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && void submit()}
              />
            </div>
          ))}
          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-mist-500">
              {t.preview}
            </span>
            <div
              dir="auto"
              className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-white/[0.08] bg-black/30 p-3.5 text-[12.5px] leading-6 text-mist-300 scroll-thin"
            >
              {preview}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-white/[0.07] p-4">
          <button onClick={onClose} className="btn-quiet px-4">
            {t.cancel}
          </button>
          <button onClick={() => void submit()} className="btn-primary">
            <ClipboardCheck size={15} strokeWidth={2.5} />
            {t.fillVars}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
