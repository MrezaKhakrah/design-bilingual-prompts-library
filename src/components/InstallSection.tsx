import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AppWindow,
  Check,
  Download,
  MonitorDown,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { useLang } from "../state/app";
import {
  canPromptInstall,
  detectPlatform,
  isStandalone,
  promptInstall,
  subscribeInstall,
} from "../lib/install";
import { pushToast } from "../lib/toast";
import { num } from "../lib/utils";

export function InstallSection() {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [installable, setInstallable] = useState(canPromptInstall());
  const standalone = isStandalone();

  useEffect(() => subscribeInstall(() => setInstallable(canPromptInstall())), []);

  if (standalone) {
    return (
      <span className="chip w-full justify-center border-brand-400/25 bg-brand-400/10 py-2 text-brand-300">
        <AppWindow size={13} strokeWidth={2.4} />
        {t.appMode}
      </span>
    );
  }

  const runInstall = async () => {
    if (!installable) {
      setOpen(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      pushToast({ title: t.installed, desc: t.installedDesc, kind: "success" });
    } else if (outcome === "dismissed") {
      setOpen(false);
    } else {
      setOpen(true);
    }
  };

  const platform = detectPlatform();
  const steps =
    platform === "ios" ? t.iosSteps : platform === "android" ? t.androidSteps : t.desktopSteps;
  const PlatformIcon = platform === "desktop" ? MonitorDown : Smartphone;

  return (
    <>
      <button onClick={() => void runInstall()} className="btn-quiet w-full justify-start">
        <Download size={16} strokeWidth={2.2} className="text-brand-300" />
        {t.installApp}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[75] grid place-items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="glass relative w-full max-w-sm overflow-hidden rounded-2xl bg-ink-900/95 shadow-2xl"
            >
              <div className="relative overflow-hidden border-b border-white/[0.07] p-5">
                <div className="absolute -end-10 -top-10 h-32 w-32 rounded-full bg-brand-400/15 blur-3xl" />
                <div className="flex items-center gap-3.5">
                  <img
                    src="icons/app-icon.png"
                    alt=""
                    className="h-14 w-14 rounded-2xl border border-white/10 shadow-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="display text-[15px] font-extrabold text-mist-50">{t.installTitle}</h3>
                    <p className="mt-0.5 text-[11.5px] leading-4 text-mist-500">{t.installHint}</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="icon-btn self-start" title={t.close}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-mist-500">
                  <PlatformIcon size={13} className="text-brand-300" />
                  {t.installHow}
                </div>
                {platform === "ios" && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[12px] text-mist-300">
                    <Share size={14} className="shrink-0 text-brand-300" />
                    {lang === "fa" ? "فقط در مرورگر سافاری iOS" : "Safari on iOS only"}
                  </div>
                )}
                <ol className="space-y-2.5">
                  {steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="num mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-brand-400/30 bg-brand-400/10 text-[11px] font-black text-brand-300">
                        {num(i + 1, lang)}
                      </span>
                      <span className="text-[12.5px] leading-6 text-mist-300">{s}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 flex items-start gap-2 rounded-xl border border-brand-400/20 bg-brand-400/[0.06] p-3 text-[11.5px] leading-5 text-mist-400">
                  <Check size={14} className="mt-0.5 shrink-0 text-brand-300" strokeWidth={2.6} />
                  {t.installDesc}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
