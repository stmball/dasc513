import type { ReactNode } from "react";

/**
 * The dense, app-like shape: an optional narrow rail (folders, channels,
 * categories), a scrolling list/table column, and a persistent reading
 * pane — the shape of a mail client, a wiki or a chat app. Powers
 * InboxPage, ChatPage and WikiPage; each supplies its own colours via the
 * `*ClassName` props, so the formats can look like genuinely different
 * products rather than one skin relabelled. The outer container is a fixed
 * `h-screen`, not `min-h-screen` — only a definite height lets the list and
 * detail panes scroll internally; `min-h-screen` would let them grow the
 * whole page instead of scrolling within it.
 *
 * On mobile the list (or rail, for chat) and the detail pane are mutually
 * exclusive — picking an item slides you into the reading pane, with a back
 * button to return, the way a real mobile mail or chat app behaves. On
 * desktop both are visible at once.
 */
export function ListDetailShell({
  headerBar,
  rail,
  railWidthClassName = "md:w-48",
  railClassName = "border-r border-slate-200 bg-slate-50",
  list,
  listWidthClassName = "md:w-[380px]",
  listClassName = "border-r border-slate-200",
  containerClassName = "bg-white",
  detailClassName = "bg-white",
  detail,
  hasSelection,
  onBack,
  backLabel = "← All items",
}: {
  headerBar: ReactNode;
  rail?: ReactNode;
  railWidthClassName?: string;
  railClassName?: string;
  list?: ReactNode;
  listWidthClassName?: string;
  listClassName?: string;
  containerClassName?: string;
  detailClassName?: string;
  detail: ReactNode;
  hasSelection: boolean;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <div className={`flex h-screen flex-col ${containerClassName}`}>
      {headerBar}
      <div className="flex flex-1 overflow-hidden">
        {rail ? (
          <div
            className={`hidden shrink-0 flex-col overflow-y-auto md:flex ${railWidthClassName} ${railClassName}`}
          >
            {rail}
          </div>
        ) : null}
        {list ? (
          <div
            className={`w-full shrink-0 flex-col overflow-y-auto ${listWidthClassName} ${listClassName} ${
              hasSelection ? "hidden md:flex" : "flex"
            }`}
          >
            {list}
          </div>
        ) : null}
        <div
          className={`flex-1 flex-col overflow-y-auto p-4 md:p-6 ${detailClassName} ${
            !list || hasSelection ? "flex" : "hidden md:flex"
          }`}
        >
          {hasSelection && onBack && list ? (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 self-start text-xs font-semibold text-slate-500 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 md:hidden"
            >
              {backLabel}
            </button>
          ) : null}
          {detail}
        </div>
      </div>
    </div>
  );
}
