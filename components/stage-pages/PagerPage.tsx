"use client";

import { useEffect, useState } from "react";
import { DocumentTable, TranscriptBody, hashId } from "../document/DocumentChrome";
import { ListDetailShell } from "./ListDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** Avatar accent colours for the conversation list — NHS-blue adjacent but
 * deliberately not the exact brand navy, and not the palette any other stage
 * page uses for its own avatars. */
const AVATAR_COLORS = [
  "bg-[#005EB8]",
  "bg-[#41B6E6]",
  "bg-[#003087]",
  "bg-[#768692]",
  "bg-[#330072]",
  "bg-[#7C2855]",
];

function avatarColor(id: string): string {
  return AVATAR_COLORS[hashId(id) % AVATAR_COLORS.length];
}

/** The gist of a conversation's first message, stripped of its `**Name.**`
 * speaker marker — the same convention `TicketsPage`'s `ticketPreview` uses,
 * reused here for the conversation list's preview line. */
function preview(body: string[]): { opener: string | null; snippet: string } {
  const first = (body.find((p) => !(p.trim().startsWith("*") && !p.trim().startsWith("**"))) ?? body[0] ?? "").trim();
  const m = /^\*\*([^*]+)\*\*\s*([\s\S]*)$/.exec(first);
  if (!m) return { opener: null, snippet: first.replace(/[*_`]/g, "") };
  return { opener: m[1].replace(/[.,]$/, ""), snippet: m[2].replace(/[*_`]/g, "") };
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Splits a stage's `chrome` string ("App name — tagline") the same way
 * `BlogPage` does, so the app bar can show a real product name plus a
 * subtitle rather than the whole string run together. */
function parseChrome(chrome: string): { name: string; tagline?: string } {
  const i = chrome.indexOf(" — ");
  if (i === -1) return { name: chrome };
  return { name: chrome.slice(0, i), tagline: chrome.slice(i + 3) };
}

/** A secure clinical messaging app — NHS blue, a flat conversation list
 * (1:1 and group threads, not team channels), delivery-style metadata —
 * deliberately not the Slack shape `ChatPage` uses and not the DASC513 navy/
 * coral/teal brand, so this reads as the Trust's own secure-messaging
 * platform rather than a relabelled workspace chat. Every item here is a
 * real conversation of real messages, the same convention `ChatPage` keeps:
 * nothing sits in the list as a pinned document instead of a thread. */
export function PagerPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const firstId = stage.evidence[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstId);
  const [tableOpen, setTableOpen] = useState(false);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;
  const { name, tagline } = parseChrome(stage.chrome);

  useEffect(() => {
    if (firstId) onOpen(firstId);
    // Only on mount, for the conversation opened by default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tableOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setTableOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tableOpen]);

  function select(id: string) {
    setSelectedId(id);
    setTableOpen(false);
    onOpen(id);
  }

  return (
    <>
      <ListDetailShell
        containerClassName="bg-white"
        detailClassName="bg-[#f0f4f5]"
        headerBar={
          <header className="flex items-center gap-3 border-b border-slate-200 bg-[#003087] px-4 py-3 sm:px-6">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{name}</p>
              {tagline ? <p className="truncate text-[11px] text-white/60">{tagline}</p> : null}
            </div>
          </header>
        }
        listWidthClassName="md:w-[340px]"
        listClassName="border-r border-slate-200 bg-white"
        list={
          <div>
            <div className="border-b border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-400">
                <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
                  <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Search conversations
              </div>
            </div>
            <ul>
              {stage.evidence.map((item) => {
                const isSelected = selectedId === item.id;
                const isUnread = !opened.has(item.id);
                const { opener, snippet } = preview(item.body);
                const initial = item.title.trim().charAt(0).toUpperCase() || "?";
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => select(item.id)}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005EB8] focus-visible:ring-inset ${
                        isSelected ? "bg-[#e8f1fb]" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(item.id)}`}
                      >
                        {initial}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm ${isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                            {item.title}
                          </span>
                          {item.date ? (
                            <span className="shrink-0 text-[10px] text-slate-400">{item.date}</span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          {isUnread ? (
                            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#005EB8]" />
                          ) : null}
                          <span className={`truncate text-xs ${isUnread ? "text-slate-600" : "text-slate-400"}`}>
                            {opener ? `${opener}: ` : ""}
                            {truncate(snippet, 56)}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        }
        detail={
          selected ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <span
                  aria-hidden
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(selected.id)}`}
                >
                  {selected.title.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-900">{selected.title}</h2>
                  <p className="truncate text-xs text-slate-500">
                    {selected.source}
                    {selected.date ? ` · ${selected.date}` : ""}
                  </p>
                </div>
                <span className="ml-auto shrink-0 rounded-full border border-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Encrypted
                </span>
              </div>
              <div className="mt-3 flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white px-3 py-2">
                <TranscriptBody item={selected} onOpenTable={selected.table ? () => setTableOpen(true) : undefined} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Pick a conversation on the left.</p>
          )
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← All conversations"
      />
      {selected?.table && tableOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setTableOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Shared in {selected.title}
              </p>
              <button
                type="button"
                onClick={() => setTableOpen(false)}
                aria-label="Close table"
                className="shrink-0 rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                ✕
              </button>
            </div>
            <DocumentTable item={selected} />
          </div>
        </div>
      ) : null}
      <BackLink slug={session.slug} />
    </>
  );
}
