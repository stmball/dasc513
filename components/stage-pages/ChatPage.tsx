"use client";

import { useEffect, useMemo, useState } from "react";
import type { EvidenceItem } from "@/lib/types";
import { DocumentTable, TranscriptBody, hashId } from "../document/DocumentChrome";
import { ListDetailShell } from "./ListDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** Pulls the speaker name out of a transcript lead. Covers both conventions
 * this app's channel transcripts use: "P. Chen (engineer), 08:47" the first
 * time someone posts and "P. Chen, 08:58" after, in a disclosure-order chat
 * export; or "Dr Fenwick (oncologist)." / "Dr Fenwick." / "Dr Fenwick,
 * aside." in an MDT recording. Drops everything from the first comma, any
 * trailing "(role)", and a trailing full stop, so "Dr Fenwick." and "Dr
 * Fenwick, aside." both resolve to the same name instead of counting as two
 * different members. This is the same string DocumentChrome's own
 * `splitLead` isolates as the bold part of a message line, duplicated here
 * rather than imported, because it's a couple of splits and this file isn't
 * allowed to reach into DocumentChrome's internals. */
function speakerName(lead: string): string {
  const beforeTime = lead.split(",")[0];
  const i = beforeTime.indexOf(" (");
  const name = i === -1 ? beforeTime : beforeTime.slice(0, i);
  return name.replace(/\.$/, "").trim();
}

/** Every distinct person who posted in a channel — a real, data-derived
 * headcount rather than an invented one, the way Slack's own "members"
 * count is just whoever is actually in the channel. */
function membersOf(item: EvidenceItem): string[] {
  const names = new Set<string>();
  for (const paragraph of item.body) {
    const m = /^\*\*([^*]+)\*\*/.exec(paragraph.trim());
    if (m) names.add(speakerName(m[1]));
  }
  return Array.from(names);
}

/** A stable, small "pinned messages" count per channel — decoration, not
 * data, in the same spirit as `ticketRef` elsewhere in this app: consistent
 * across renders, never claimed as evidence. */
function pinnedCountOf(item: EvidenceItem): number {
  return (hashId(item.id) % 3) + 1;
}

/** The first handful of distinct names seen anywhere in the stage, for the
 * sidebar's decorative "Direct messages" section — real characters from this
 * company's world, not invented placeholder names, so the clutter still
 * feels like it belongs to the same office. */
function harvestNames(evidence: EvidenceItem[], max: number): string[] {
  const seen = new Set<string>();
  for (const item of evidence) {
    for (const name of membersOf(item)) {
      seen.add(name);
      if (seen.size >= max) return Array.from(seen);
    }
  }
  return Array.from(seen);
}

function presenceColor(name: string): string {
  return hashId(name) % 2 === 0 ? "bg-emerald-400" : "bg-white/20";
}

const SIDEBAR_LINKS = [
  {
    label: "Threads",
    icon: (
      <path d="M3 4h10M3 8h10M3 12h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    ),
  },
  {
    label: "Mentions & reactions",
    icon: <path d="M8 2.5l1.6 3.4 3.7.5-2.7 2.6.6 3.7L8 10.9l-3.2 1.8.6-3.7-2.7-2.6 3.7-.5L8 2.5z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round" />,
  },
];

/** A Slack-shaped workspace, elevated past a flat channel list with the
 * fittings a real export would still carry: a sidebar split into sections
 * (channels, then a decorative direct-messages list of the same people who
 * actually appear in the channels), and a channel header whose member and
 * pinned-message counts are read off the transcript itself rather than
 * invented — deliberately not the DASC513 navy/coral/teal brand, so it reads
 * as an actual chat client. Every item here is a real channel of real
 * messages — nothing sits in the sidebar as a pinned document instead of a
 * conversation. */
export function ChatPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const firstId = stage.evidence[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstId);
  const [tableOpen, setTableOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;

  const dmNames = useMemo(() => harvestNames(stage.evidence, 5), [stage.evidence]);

  useEffect(() => {
    if (firstId) onOpen(firstId);
    // Only on mount, for the channel opened by default.
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
    // A table popped out in one channel shouldn't still be open after
    // switching to a different one.
    setTableOpen(false);
    setMobileNavOpen(false);
    onOpen(id);
  }

  const channelRail = (
    <nav className="flex h-full flex-col py-3 text-sm">
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold text-white">{session.subject.company}</p>
          <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden className="shrink-0 text-white/50">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.3" fill="none" />
          </svg>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-white/50">
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          Active
        </p>
      </div>
      <ul className="px-1 pb-2">
        {SIDEBAR_LINKS.map(({ label, icon }) => (
          <li key={label}>
            <span className="flex cursor-default items-center gap-2.5 rounded px-3 py-1.5 text-white/40">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
                {icon}
              </svg>
              <span className="truncate">{label}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="px-4 pb-1 pt-1 text-[11px] font-semibold text-white/40">Channels</p>
      <ul>
        {stage.evidence.map((item) => {
          const isSelected = selectedId === item.id;
          const isUnread = !opened.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => select(item.id)}
                className={`flex w-full items-start gap-2 px-4 py-1.5 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50 ${
                  isSelected ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                <span aria-hidden className="mt-0.5 w-3 shrink-0 text-center text-white/50">
                  #
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${isUnread ? "font-bold" : ""} ${isSelected ? "text-white" : ""}`}
                >
                  {item.title}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {dmNames.length > 0 ? (
        <>
          <p className="px-4 pb-1 pt-4 text-[11px] font-semibold text-white/40">Direct messages</p>
          <ul>
            {dmNames.map((name) => (
              <li key={name}>
                <span className="flex cursor-default items-center gap-2.5 px-4 py-1.5 text-white/50">
                  <span className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white/10 text-[9px] font-bold text-white/70">
                    {name.charAt(0)}
                    <span
                      aria-hidden
                      className={`absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-[#3f0e40] ${presenceColor(name)}`}
                    />
                  </span>
                  <span className="truncate">{name}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </nav>
  );

  return (
    <>
      <ListDetailShell
        headerBar={
          <header className="flex items-center justify-between gap-2 border-b border-black/10 bg-[#3f0e40] px-3 py-2.5 md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open channel list"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-white">
              {selected ? `# ${selected.title}` : stage.chrome}
            </p>
            <span aria-hidden className="h-8 w-8 shrink-0" />
          </header>
        }
        containerClassName="bg-white"
        detailClassName="bg-white"
        railClassName="bg-[#3f0e40]"
        railWidthClassName="md:w-64"
        rail={channelRail}
        listWidthClassName="md:w-[300px]"
        detail={
          selected ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="hidden text-lg font-bold text-slate-900 md:block"># {selected.title}</h2>
                <p className="mt-1 text-xs italic text-slate-400">No topic has been set for this channel.</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
                      <circle cx="8" cy="5.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M3 13.5c0-2.5 2.2-4 5-4s5 1.5 5 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    {membersOf(selected).length} members
                  </span>
                  <span aria-hidden>·</span>
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
                      <path
                        d="M8 1.5v9M4 5l4-3.5L12 5M4.5 9h7l.8 5.5H3.7L4.5 9z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.1"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {pinnedCountOf(selected)} pinned
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
                  <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden className="shrink-0">
                    <rect x="3" y="7" width="10" height="7" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  {selected.source}
                  {selected.date ? ` · ${selected.date}` : ""}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pt-2">
                <TranscriptBody
                  item={selected}
                  onOpenTable={selected.table ? () => setTableOpen(true) : undefined}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Pick a channel on the left.</p>
          )
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← All channels"
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
              <p className="text-[11px] font-semibold text-slate-500">Shared in #{selected.title}</p>
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
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-label="Channels">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <div className="relative h-full w-72 max-w-[80vw] overflow-y-auto bg-[#3f0e40] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close channel list"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded text-white/70 hover:bg-white/10"
            >
              ✕
            </button>
            {channelRail}
          </div>
        </div>
      ) : null}
      <BackLink slug={session.slug} />
    </>
  );
}
