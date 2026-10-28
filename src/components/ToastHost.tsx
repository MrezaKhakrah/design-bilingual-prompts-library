import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { subscribeToasts } from "../lib/toast";
import type { Toast } from "../lib/toast";

const ICONS = {
  default: Info,
  success: CheckCircle2,
  danger: AlertTriangle,
} as const;

const COLORS = {
  default: "text-mist-300",
  success: "text-brand-300",
  danger: "text-rose-300",
} as const;

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const unsub = subscribeToasts((t) => {
      setToasts((prev) => [...prev.slice(-3), t]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
        timers.current.delete(t.id);
      }, 5200);
      timers.current.set(t.id, timer);
    });
    const map = timers.current;
    return () => {
      unsub();
      map.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  };

  return (
    <div className="safe-b pointer-events-none fixed end-5 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2.5">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.kind ?? "default"];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/10 bg-ink-800/95 p-4 shadow-[0_20px_60px_-16px_rgb(0_0_0/0.9)] backdrop-blur-xl"
            >
              <Icon size={18} strokeWidth={2.2} className={`mt-0.5 shrink-0 ${COLORS[t.kind ?? "default"]}`} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-mist-50">{t.title}</div>
                {t.desc && <div className="mt-0.5 text-[11.5px] leading-4 text-mist-400">{t.desc}</div>}
                {t.action && (
                  <button
                    onClick={() => {
                      t.action!.run();
                      dismiss(t.id);
                    }}
                    className="mt-2 cursor-pointer rounded-lg bg-brand-400/15 px-3 py-1.5 text-[11.5px] font-bold text-brand-300 transition hover:bg-brand-400/25"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button onClick={() => dismiss(t.id)} className="icon-btn h-6 w-6 shrink-0">
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
