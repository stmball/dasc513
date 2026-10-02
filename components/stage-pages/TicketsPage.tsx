"use client";

import { useMemo, useState } from "react";
import type { EvidenceItem } from "@/lib/types";
import { DocumentReader, EmptyReader, hashId } from "../document/DocumentChrome";
import { ListDetailShell } from "./ListDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** Queue every ticket without an explicit `queue` falls into — keeps the
 * page working for a stage whose content hasn't been organised into queues
 * yet, rather than silently dropping items. */
const UNQUEUED = "Unassigned";

/** Decorative saved views that sit under the real queues in the sidebar —
 * the clutter of a real service-desk tool, never backed by any data. */
const DECORATIVE_VIEWS = ["My approvals", "Watching", "Closed this month"];

const STATUS_STYLE: Record<string, string> = {
  Open: "bg-[#c2410c] text-white",
  "In progress": "bg-[#b45309] text-white",
  Pending: "bg-[#92400e] text-white",
  Resolved: "bg-[#3f6212] text-white",
  Closed: "bg-slate-500 text-white",
};

function statusOf(item: EvidenceItem): string {
  return item.status ?? "Open";
}

function statusClass(status: string): string {
  return STATUS_STYLE[status] ?? "bg-slate-500 text-white";
}

/** A deterministic "INC-nnnnn" ticket number, stable per item. */
function ticketRef(item: EvidenceItem): string {
  return `INC-${((hashId(item.id) % 90000) + 10000)}`;
}

/** What a ticket row shows: whoever raised it and the gist of the first
 * comment, stripped of the `**Name.**` turn marker the full reader uses to
 * tell speakers apart. */
function ticketPreview(item: EvidenceItem): { opener: string; snippet: string } {
  const first = item.body[0] ?? "";
  const m = /^\*\*([^*]+)\*\*\s*([\s\S]*)$/.exec(first.trim());
  const opener = m ? m[1].replace(/\.$/, "") : item.source || "Unknown";
  const rest = (m ? m[2] : first).replace(/[*_`]/g, "");
  return { opener, snippet: rest };
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * A ServiceNow/Freshservice-shaped service desk: a dark charcoal header and
 * rail, amber/rust status chips, monospace ticket references — deliberately
 * not the DASC513 navy/coral/teal brand, and deliberately not any of the
 * other stage pages' palettes, so this reads as its own enterprise ITSM tool.
 */
export function TicketsPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeQueue, setActiveQueue] = useState<string | "all">("all");
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;

  const queueOf = (item: EvidenceItem) => item.queue ?? UNQUEUED;

  const queues = useMemo(() => {
    const names = Array.from(new Set(stage.evidence.map(queueOf)));
    return names.sort((a, b) => (a === UNQUEUED ? 1 : b === UNQUEUED ? -1 : a.localeCompare(b)));
  }, [stage.evidence]);

  const visible =
    activeQueue === "all" ? stage.evidence : stage.evidence.filter((item) => queueOf(item) === activeQueue);

  const open = stage.evidence.filter((item) => statusOf(item) !== "Closed" && statusOf(item) !== "Resolved").length;

  function select(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  function railButtonClass(active: boolean) {
    return `flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[13px] transition-colors ${
      active ? "bg-[#ea580c] text-white" : "text-slate-200 hover:bg-white/10"
    }`;
  }

  return (
    <>
      <ListDetailShell
        containerClassName="bg-[#f4f3f1] font-sans"
        detailClassName="bg-[#f4f3f1]"
        headerBar={
          <header className="flex items-center justify-between gap-3 border-b border-black/20 bg-[#1c1917] px-5 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#ea580c] text-sm font-bold text-white"
              >
                ⚙
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{stage.chrome}</p>
                <p className="truncate text-[11px] text-slate-400">{session.subject.company}</p>
              </div>
            </div>
            <span className="shrink-0 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-[#ea580c] text-white">
              {open} open
            </span>
          </header>
        }
        railClassName="bg-[#292524]"
        rail={
          <nav className="p-3 text-sm">
            <button
              type="button"
              onClick={() => setActiveQueue("all")}
              className={railButtonClass(activeQueue === "all")}
            >
              All tickets
              <span className="ml-auto text-[11px] opacity-70">{stage.evidence.length}</span>
            </button>
            <p className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Queues
            </p>
            <ul className="space-y-0.5">
              {queues.map((name) => {
                const count = stage.evidence.filter((item) => queueOf(item) === name).length;
                return (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => setActiveQueue(name)}
                      className={railButtonClass(activeQueue === name)}
                    >
                      <span className="truncate">{name}</span>
                      <span className="ml-auto text-[11px] opacity-70">{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Saved views
            </p>
            <ul className="space-y-0.5">
              {DECORATIVE_VIEWS.map((view) => (
                <li
                  key={view}
                  className="cursor-default select-none rounded px-2.5 py-1.5 text-slate-500"
                >
                  {view}
                </li>
              ))}
            </ul>
          </nav>
        }
        listClassName="border-r border-black/10 bg-white"
        list={
          <ul>
            {visible.map((item) => {
              const isUnread = !opened.has(item.id);
              const isSelected = selectedId === item.id;
              const preview = ticketPreview(item);
              const status = statusOf(item);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => select(item.id)}
                    className={`flex w-full flex-col gap-1 border-b border-black/10 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] focus-visible:ring-inset ${
                      isSelected ? "bg-[#fff1e6]" : "hover:bg-[#faf9f7]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-slate-400">
                        {ticketRef(item)}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass(status)}`}>
                        {status}
                      </span>
                      {isUnread ? (
                        <span aria-hidden className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[#ea580c]" />
                      ) : null}
                    </span>
                    <span
                      className={`truncate text-sm ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}
                    >
                      {item.title}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="truncate">{preview.opener}</span>
                      <span aria-hidden>·</span>
                      <span className="truncate text-slate-400">{queueOf(item)}</span>
                    </span>
                    <span className="truncate text-xs text-slate-400">{truncate(preview.snippet, 100)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        }
        detail={
          selected ? (
            <div className="flex h-full flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-xs">
                <span className="font-mono font-semibold text-slate-500">{ticketRef(selected)}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass(statusOf(selected))}`}>
                  {statusOf(selected)}
                </span>
                <span className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {selected.queue ?? UNQUEUED}
                </span>
              </div>
              <DocumentReader item={selected} />
            </div>
          ) : (
            <EmptyReader hint="Select a ticket to read it." />
          )
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← All tickets"
      />
      <BackLink slug={session.slug} />
    </>
  );
}
