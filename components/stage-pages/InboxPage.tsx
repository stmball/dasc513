"use client";

import { useState, type MouseEvent } from "react";
import { DocumentReader, EmptyReader, emailPreview } from "../document/DocumentChrome";
import { ListDetailShell } from "./ListDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

const DECORATIVE_FOLDERS = ["Sent", "Drafts", "Snoozed", "Archived", "Trash"];

const AVATAR_COLORS = [
  "bg-[#1a73e8]",
  "bg-[#d93025]",
  "bg-[#188038]",
  "bg-[#e37400]",
  "bg-[#9334e6]",
  "bg-[#12b5cb]",
];

function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

type Density = "comfortable" | "compact";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 1.5l1.96 4.08 4.5.56-3.28 3.1.84 4.46L8 11.6l-4.02 2.1.84-4.46-3.28-3.1 4.5-.56L8 1.5z"
        fill={filled ? "#e37400" : "none"}
        stroke={filled ? "#e37400" : "#9aa0a6"}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A Gmail-shaped inbox, pushed past a literal facsimile: a real star/
 * "Starred" filter and a density toggle, rather than just the three-pane
 * list-and-reader shape with Google's colours on it. Deliberately not the
 * DASC513 navy/coral/teal brand, so it reads as an actual mail client. */
export function InboxPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [density, setDensity] = useState<Density>("comfortable");
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "starred">("all");

  const unread = stage.evidence.filter((item) => !opened.has(item.id)).length;
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;

  const visible = stage.evidence.filter((item) =>
    filter === "all" ? true : starred.has(item.id),
  );

  function select(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  function toggleStar(id: string, event: MouseEvent) {
    event.stopPropagation();
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const compact = density === "compact";

  return (
    <>
      <ListDetailShell
        containerClassName="bg-white font-[ui-sans-serif,system-ui,Arial,sans-serif]"
        detailClassName="bg-white"
        headerBar={
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d93025] text-sm font-bold text-white"
              >
                M
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{stage.chrome}</p>
                <p className="truncate text-[11px] text-slate-500">{session.subject.company}</p>
              </div>
            </div>
            <div className="hidden min-w-0 flex-1 max-w-sm items-center gap-2 rounded-full bg-[#eaf1fb] px-4 py-2 text-slate-500 sm:flex">
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className="shrink-0">
                <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.3" />
                <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="truncate text-xs">Search mail</span>
            </div>
            {unread > 0 ? (
              <span className="shrink-0 rounded-full bg-[#1a73e8] px-2.5 py-1 text-[10px] font-bold text-white">
                {unread} unread
              </span>
            ) : null}
          </header>
        }
        railClassName="border-r border-slate-200 bg-white"
        rail={
          <nav className="flex h-full flex-col p-3 text-sm">
            <button
              type="button"
              className="mb-3 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#d93025] shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                <path
                  d="M11.5 2.5l2 2-7.8 7.8-2.6.6.6-2.6 7.8-7.8z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
              Compose
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`flex items-center justify-between rounded-full px-3 py-2 text-left font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${
                filter === "all" ? "bg-[#d3e3fd] text-[#0b57d0]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Inbox
              <span className="text-xs">{stage.evidence.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("starred")}
              className={`mt-0.5 flex items-center justify-between rounded-full px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${
                filter === "starred" ? "bg-[#d3e3fd] font-semibold text-[#0b57d0]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Starred
              <span className="text-xs text-slate-400">{starred.size}</span>
            </button>
            <ul className="mt-0.5">
              {DECORATIVE_FOLDERS.map((folder) => (
                <li
                  key={folder}
                  className="cursor-default select-none rounded-full px-3 py-1.5 text-slate-300"
                >
                  {folder}
                </li>
              ))}
            </ul>
          </nav>
        }
        listClassName="border-r border-slate-200"
        list={
          <>
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-1.5">
              <p className="text-xs font-semibold text-slate-500">
                {filter === "all" ? "Primary" : "Starred"}
              </p>
              <div className="flex items-center gap-0.5 rounded-full border border-slate-200 p-0.5">
                <button
                  type="button"
                  aria-label="Comfortable density"
                  aria-pressed={!compact}
                  onClick={() => setDensity("comfortable")}
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    !compact ? "bg-[#d3e3fd] text-[#0b57d0]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Default
                </button>
                <button
                  type="button"
                  aria-label="Compact density"
                  aria-pressed={compact}
                  onClick={() => setDensity("compact")}
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    compact ? "bg-[#d3e3fd] text-[#0b57d0]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Compact
                </button>
              </div>
            </div>
            {visible.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">Nothing here.</p>
            ) : (
              <ul>
                {visible.map((item) => {
                  const isUnread = !opened.has(item.id);
                  const isSelected = selectedId === item.id;
                  const preview = emailPreview(item);
                  const initial = preview.from.trim().charAt(0).toUpperCase() || "?";
                  const isStarred = starred.has(item.id);
                  return (
                    <li key={item.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => select(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            select(item.id);
                          }
                        }}
                        className={`flex w-full cursor-pointer items-start gap-3 border-b border-slate-100 px-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-inset ${
                          compact ? "py-1.5" : "py-3"
                        } ${isSelected ? "bg-[#d3e3fd]" : "hover:bg-slate-50"}`}
                      >
                        <span
                          aria-hidden
                          className={`mt-0.5 flex shrink-0 items-center justify-center rounded-full font-bold text-white ${avatarColor(item.id)} ${
                            compact ? "h-5 w-5 text-[9px]" : "h-8 w-8 text-xs"
                          }`}
                        >
                          {initial}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span
                                className={`truncate text-sm ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}
                              >
                                {item.title}
                              </span>
                              {preview.count > 1 ? (
                                <span className="shrink-0 text-xs font-normal text-slate-400">({preview.count})</span>
                              ) : null}
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                aria-label={isStarred ? "Remove star" : "Add star"}
                                onClick={(event) => toggleStar(item.id, event)}
                                className="rounded p-0.5 hover:bg-slate-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
                              >
                                <StarIcon filled={isStarred} />
                              </button>
                              {isUnread ? (
                                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#1a73e8]" />
                              ) : null}
                            </span>
                          </span>
                          {!compact ? (
                            <>
                              <span className="mt-0.5 block truncate text-xs text-slate-500">{preview.from}</span>
                              <span className="mt-0.5 block truncate text-xs text-slate-400">
                                {truncate(preview.snippet, 90)}
                              </span>
                            </>
                          ) : (
                            <span className="mt-0.5 block truncate text-xs text-slate-400">
                              {preview.from} · {truncate(preview.snippet, 60)}
                            </span>
                          )}
                          {preview.date ? (
                            <span className="mt-0.5 block text-[10px] text-slate-400">{preview.date}</span>
                          ) : null}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        }
        detail={
          selected ? (
            <div className="flex h-full flex-col gap-2">
              <div className="flex items-center gap-1 text-slate-400">
                {["Archive", "Mark unread", "Snooze", "Delete"].map((label) => (
                  <span
                    key={label}
                    aria-hidden
                    title={label}
                    className="flex h-7 w-7 cursor-default items-center justify-center rounded-full hover:bg-slate-100"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16">
                      <rect x="2" y="4" width="12" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.1" />
                      <path d="M2 4l6 5 6-5" fill="none" stroke="currentColor" strokeWidth="1.1" />
                    </svg>
                  </span>
                ))}
              </div>
              <DocumentReader item={selected} />
            </div>
          ) : (
            <EmptyReader hint="Select a message to read it." />
          )
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← All messages"
      />
      <BackLink slug={session.slug} />
    </>
  );
}
