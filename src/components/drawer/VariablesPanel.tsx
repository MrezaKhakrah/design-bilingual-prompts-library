import { useMemo } from "react";
import { Braces, ClipboardCheck } from "lucide-react";
import { useLang } from "../../state/app";
import { copyText, extractVars, fillVars } from "../../lib/utils";
import { pushToast } from "../../lib/toast";

export function VariablesPanel({
  content,
  defaults,
  onDefaults,
  onCopiedFilled,
}: {
  content: string;
  defaults: Record<string, string>;
  onDefaults: (d: Record<string, string>) => void;
  onCopiedFilled: () => void;
}) {
  const { t } = useLang();
  const vars = useMemo(() => extractVars(content), [content]);
  const preview = useMemo(() => fillVars(content, defaults), [content, defaults]);

  if (vars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="relative grid h-20 w-20 place-items-center rounded-3xl border border-sun-400/20 bg-sun-400/[0.07]">
          <Braces size={30} className="text-sun-300" strokeWidth={1.8} />
          <span className="absolute -end-2 -top-2 rounded-lg border border-white/10 bg-ink-800 px-2 py-1 font-mono text-[10px] text-sun-300 shadow-lg">
            {"{{…}}"}
          </span>
        </div>
        <p className="max-w-60 text-[13px] leading-6 text-mist-400">{t.noVarsYet}</p>
        <code className="chip border-sun-400/25 bg-sun-400/10 font-mono text-sun-300" dir="ltr">
          {"{{موضوع}}"} · {"{{topic}}"}
        </code>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3">
        {vars.map((v) => (
          <div
            key={v}
            className="glass flex flex-col gap-2 rounded-xl p-3.5 sm:flex-row sm:items-center sm:gap-4"
          >
            <code className="inline-flex w-fit shrink-0 items-center rounded-lg border border-sun-400/25 bg-sun-400/10 px-2.5 py-1 font-mono text-[12px] font-semibold text-sun-300" dir="ltr">
              {`{{${v}}}`}
            </code>
            <input
              className="field py-2 text-[13px]"
              placeholder={t.defaultValue}
              value={defaults[v] ?? ""}
              onChange={(e) => onDefaults({ ...defaults, [v]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-mist-500">
            {t.preview}
          </span>
          <button
            onClick={async () => {
              const ok = await copyText(preview);
              if (ok) {
                onCopiedFilled();
                pushToast({ title: t.copied, desc: t.copiedFilledDesc, kind: "success" });
              }
            }}
            className="btn-primary py-2"
          >
            <ClipboardCheck size={14} strokeWidth={2.4} />
            {t.fillVars}
          </button>
        </div>
        <div
          dir="auto"
          className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-white/[0.08] bg-black/30 p-4 text-[13px] leading-7 text-mist-200 scroll-thin"
        >
          {preview || <span className="text-mist-600">…</span>}
        </div>
      </div>
    </div>
  );
}

