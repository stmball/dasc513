import type { ReactNode } from "react";

/**
 * The website shape: a full-width browse view (a post grid, a feature
 * grid) that swaps for a full-width reading view on selection, the way an
 * actual site navigates from an index page to an article page, rather than
 * splitting the screen. Powers BlogPage and BrochurePage; each supplies its
 * own colours so the two read as genuinely different sites.
 */
export function GridDetailShell({
  headerBar,
  grid,
  detail,
  hasSelection,
  onBack,
  backLabel = "← Back to the front page",
  containerClassName = "bg-white",
  backButtonClassName = "text-slate-500 hover:text-slate-900",
}: {
  headerBar: ReactNode;
  grid: ReactNode;
  detail: ReactNode;
  hasSelection: boolean;
  onBack: () => void;
  backLabel?: string;
  containerClassName?: string;
  backButtonClassName?: string;
}) {
  return (
    <div className={`flex min-h-screen flex-col ${containerClassName}`}>
      {headerBar}
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
        {hasSelection ? (
          <div>
            <button
              type="button"
              onClick={onBack}
              className={`mb-5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${backButtonClassName}`}
            >
              {backLabel}
            </button>
            {detail}
          </div>
        ) : (
          grid
        )}
      </div>
    </div>
  );
}
