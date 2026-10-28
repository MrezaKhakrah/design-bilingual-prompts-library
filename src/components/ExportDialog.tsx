import { useRef } from "react";
import { motion } from "framer-motion";
import { Database, FileJson2, FileText, ShieldCheck, Upload, X } from "lucide-react";
import { useLang, useLib } from "../state/app";
import { exportJSON, exportMarkdown, parseBackup } from "../lib/exporters";
import { pushToast } from "../lib/toast";
import { num } from "../lib/utils";

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const { lang, t } = useLang();
  const { prompts, categories, importData } = useLib();
  const fileRef = useRef<HTMLInputElement>(null);

  const options = [
    {
      icon: FileJson2,
      title: t.exportJson,
      desc: t.exportJsonD,
      run: () => {
        exportJSON({ prompts, categories });
        pushToast({ title: t.exportJson, kind: "success" });
        onClose();
      },
    },
    {
      icon: FileText,
      title: t.exportMd,
      desc: t.exportMdD,
      run: () => {
        exportMarkdown({ prompts, categories }, lang);
        pushToast({ title: t.exportMd, kind: "success" });
        onClose();
      },
    },
    {
      icon: Upload,
      title: t.importJson,
      desc: t.importJsonD,
      run: () => fileRef.current?.click(),
    },
  ];

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseBackup(String(reader.result ?? ""));
      if (!parsed || parsed.prompts.length === 0) {
        pushToast({ title: t.invalidFile, kind: "danger" });
        return;
      }
      const count = importData(parsed);
      pushToast({
        title: `${num(count, lang)} ${t.imported}`,
        kind: "success",
      });
      onClose();
    };
    reader.readAsText(file);
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
        className="glass relative w-full max-w-md overflow-hidden rounded-2xl bg-ink-900/95 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-brand-400/25 bg-brand-400/10 text-brand-300">
            <Database size={17} strokeWidth={2.2} />
          </span>
          <div className="flex-1">
            <h3 className="display text-[15px] font-extrabold text-mist-50">{t.exportTitle}</h3>
            <p className="text-[11.5px] text-mist-500">
              <span className="num">{num(prompts.length, lang)}</span> {t.statPrompts.toLowerCase?.() ?? t.statPrompts} ·{" "}
              <span className="num">{num(categories.length, lang)}</span> {t.categories.toLowerCase?.() ?? t.categories}
            </p>
          </div>
          <button onClick={onClose} className="icon-btn" title={t.close}>
            <X size={17} />
          </button>
        </div>

        <div className="space-y-2.5 p-5">
          <p className="flex items-start gap-2 text-[12px] leading-5 text-mist-400">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-300" />
            {t.exportDesc}
          </p>
          {options.map((o) => (
            <button
              key={o.title}
              onClick={o.run}
              className="group flex w-full cursor-pointer items-center gap-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-start transition duration-200 hover:border-brand-400/35 hover:bg-brand-400/[0.07]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-brand-300 transition group-hover:bg-brand-400 group-hover:text-ink-950">
                <o.icon size={17} strokeWidth={2} />
              </span>
              <span>
                <span className="block text-[13.5px] font-bold text-mist-100">{o.title}</span>
                <span className="mt-0.5 block text-[11.5px] leading-4 text-mist-500">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </motion.div>
    </motion.div>
  );
}
