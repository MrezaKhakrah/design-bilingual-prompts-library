import { History, RotateCcw, ClipboardCopy } from "lucide-react";
import { motion } from "framer-motion";
import type { Prompt, PromptVersion } from "../../types";
import { useLang, useLib } from "../../state/app";
import { copyText, num, relTime } from "../../lib/utils";
import { pushToast } from "../../lib/toast";

export function VersionsPanel({
  prompt,
  onRestore,
}: {
  prompt: Prompt | null;
  onRestore: (v: PromptVersion) => void;
}) {
  const { lang, t } = useLang();
  const { applyContent } = useLib();

  if (!prompt || prompt.versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/[0.04]">
          <History size={30} className="text-mist-400" strokeWidth={1.8} />
        </div>
        <p className="max-w-60 text-[13px] leading-6 text-mist-400">
          {lang === "fa"
            ? "بعد از نخستین ذخیره، تاریخچه نسخه‌ها اینجا ساخته می‌شود."
            : "Version history will appear here after your first save."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-3">
      <span className="absolute bottom-4 start-[15px] top-4 w-px bg-gradient-to-b from-brand-400/40 via-white/10 to-transparent" />
      {prompt.versions.map((v, i) => {
        const isCurrent = i === 0;
        const older = prompt.versions[i + 1];
        const delta = older ? v.content.length - older.content.length : 0;
        return (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, x: lang === "fa" ? 14 : -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex gap-4 ps-0"
          >
            <span
              className={`relative z-[1] mt-4 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[10px] font-black ${
                isCurrent
                  ? "border-brand-400/50 bg-brand-400/15 text-brand-300 shadow-[0_0_18px_rgb(45_212_191/0.3)]"
                  : "border-white/10 bg-ink-800 text-mist-500"
              }`}
            >
              <span className="num">{num(v.n, lang)}</span>
            </span>
            <div
              className={`flex-1 rounded-xl border p-4 ${
                isCurrent
                  ? "border-brand-400/25 bg-brand-400/[0.05]"
                  : "border-white/[0.07] bg-white/[0.02]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-bold text-mist-100">
                  {t.version} <span className="num">{num(v.n, lang)}</span>
                </span>
                {isCurrent && (
                  <span className="chip border-brand-400/30 bg-brand-400/15 py-0.5 text-[10px] text-brand-300">
                    {t.currentVer}
                  </span>
                )}
                {delta !== 0 && (
                  <span className={`num text-[10.5px] font-bold ${delta > 0 ? "text-brand-300" : "text-rose-300"}`} dir="ltr">
                    {delta > 0 ? "+" : "−"}
                    {num(Math.abs(delta), lang)} {t.chars}
                  </span>
                )}
                <span className="ms-auto text-[11px] font-medium text-mist-500">
                  {relTime(v.createdAt, lang, (k) => String(t[k as keyof typeof t]))}
                </span>
              </div>
              {v.note ? (
                <p className="mt-1 text-[12px] font-semibold text-sun-300/90">{v.note}</p>
              ) : null}
              <p dir="auto" className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-[12px] leading-6 text-mist-400">
                {v.content}
              </p>
              <div className="mt-3 flex items-center gap-2">
                {!isCurrent && (
                  <button
                    onClick={() => {
                      onRestore(v);
                      applyContent(prompt.id, v.content, t.noteRestore);
                      pushToast({ title: t.restoredVer, kind: "success" });
                    }}
                    className="btn-quiet px-3 py-1.5 text-[11.5px]"
                  >
                    <RotateCcw size={12.5} strokeWidth={2.4} />
                    {t.restoreVer}
                  </button>
                )}
                <button
                  onClick={async () => {
                    const ok = await copyText(v.content);
                    if (ok) pushToast({ title: t.copied, kind: "success" });
                  }}
                  className="btn-quiet px-3 py-1.5 text-[11.5px]"
                >
                  <ClipboardCopy size={12.5} strokeWidth={2.4} />
                  {t.copyThisVer}
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
