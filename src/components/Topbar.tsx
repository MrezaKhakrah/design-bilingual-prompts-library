import { Menu, Plus, Search, Sparkles } from "lucide-react";
import { useLang } from "../state/app";

export function Topbar({
  query,
  setQuery,
  onNew,
  onOpenPalette,
  onOpenSidebar,
}: {
  query: string;
  setQuery: (q: string) => void;
  onNew: () => void;
  onOpenPalette: () => void;
  onOpenSidebar: () => void;
}) {
  const { t } = useLang();
  return (
    <header className="safe-top sticky top-0 z-30 -mx-4 mb-6 border-b border-white/[0.06] bg-ink-950/75 px-4 pb-3.5 backdrop-blur-xl sm:-mx-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="icon-btn lg:hidden"
          aria-label={t.menuTitle}
        >
          <Menu size={19} />
        </button>

        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-mist-500"
            strokeWidth={2.4}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field ps-10 pe-16"
            placeholder={t.searchPh}
            aria-label={t.search}
          />
          <button
            onClick={onOpenPalette}
            className="absolute end-2.5 top-1/2 hidden -translate-y-1/2 cursor-pointer items-center gap-1 sm:flex"
            title={t.palettePh}
          >
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </button>
        </div>

        <button onClick={onNew} className="btn-primary shrink-0">
          <Plus size={16} strokeWidth={2.8} className="sm:hidden" />
          <Sparkles size={15} strokeWidth={2.4} className="hidden sm:block" />
          <span className="hidden sm:inline">{t.newPrompt}</span>
        </button>
      </div>
    </header>
  );
}
