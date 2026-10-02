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

/** Severity, separate from lifecycle status — the other axis a real ITSM
 * console always tracks, derived deterministically so the same ticket
 * always carries the same priority rather than a random one per render. */
const PRIORITIES = [
  { code: "P1", label: "Critical", hours: 4, className: "bg-red-600 text-white" },
  { code: "P2", label: "High", hours: 8, className: "bg-[#ea580c] text-white" },
  { code: "P3", label: "Medium", hours: 24, className: "bg-amber-500 text-white" },
  { code: "P4", label: "Low", hours: 72, className: "bg-slate-400 text-white" },
] as const;

function priorityOf(item: EvidenceItem): (typeof PRIORITIES)[number] {
  return PRIORITIES[hashId(item.id) % PRIORITIES.length];
}

/** A small, fixed roster of service-desk staff a ticket is deterministically
 * "assigned" to — decoration, not data, the same spirit as `ticketRef`:
 * stable per ticket, never read by any question. Kept distinct from any
 * named character in the session's own evidence. */
const ASSIGNEES = ["J. Udo", "R. Fenwick", "A. Szabo", "L. Byrne", "C. Marsh"];

function assigneeOf(item: EvidenceItem): string {
  return ASSIGNEES[hashId(`${item.id}-assignee`) % ASSIGNEES.length];
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.replace(/\./g, "").charAt(0))
    .join("")
    .toUpperCase();
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

/** Column template shared by the header row and every ticket row beneath it
 * — three columns on narrow screens (priority, subject, status), five from
 * `sm` up (priority, subject, priority label, assignee, status). Declared
 * once so the header can never silently drift out of alignment with the
 * rows under it. */
const ROW_GRID = "grid grid-cols-[1.1rem_1fr_auto] items-center gap-x-3 sm:grid-cols-[1.1rem_1fr_5.5rem_2rem_6.5rem]";

/**
 * A ServiceNow/Freshservice-shaped service desk, pushed past a card-list into
 * the thing those tools actually are: a dense tabular queue with its own
 * priority axis (separate from lifecycle status), an assigned-to roster, and
 * an SLA clock in the ticket detail — a dark charcoal header and rail,
 * amber/rust status chips, monospace ticket references — deliberately not
 * the DASC513 navy/coral/teal brand, and deliberately not any of the other
 * stage pages' palettes, so this reads as its own enterprise ITSM tool.
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
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-white/60 sm:inline">
                + New request
              </span>
              <span className="rounded px-2.5 py-1 text-[10px] font-bold bg-[#ea580c] text-white">
                {open} open
              </span>
            </div>
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
            <p className="px-2.5 pb-1 pt-3 text-[11px] font-semibold text-slate-500">Queues</p>
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
            <p className="px-2.5 pb-1 pt-3 text-[11px] font-semibold text-slate-500">Saved views</p>
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
        listWidthClassName="md:w-[440px]"
        listClassName="border-r border-black/10 bg-white"
        list={
          <>
            <div
              className={`${ROW_GRID} sticky top-0 z-10 border-b border-black/10 bg-[#faf9f7] px-4 py-2 text-[11px] font-semibold text-slate-500`}
            >
              <span aria-hidden />
              <span>Ticket</span>
              <span className="hidden text-center sm:inline">Priority</span>
              <span className="hidden text-center sm:inline">Owner</span>
              <span>Status</span>
            </div>
            <ul>
              {visible.map((item) => {
                const isUnread = !opened.has(item.id);
                const isSelected = selectedId === item.id;
                const preview = ticketPreview(item);
                const status = statusOf(item);
                const priority = priorityOf(item);
                const assignee = assigneeOf(item);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => select(item.id)}
                      className={`${ROW_GRID} w-full border-b border-black/10 px-4 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] focus-visible:ring-inset ${
                        isSelected ? "bg-[#fff1e6]" : "hover:bg-[#faf9f7]"
                      }`}
                    >
                      <span
                        aria-hidden
                        title={`${priority.code} · ${priority.label}`}
                        className={`flex h-[1.1rem] w-[1.1rem] items-center justify-center rounded-[3px] text-[8px] font-bold ${priority.className}`}
                      >
                        {priority.code[1]}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-slate-400">
                            {ticketRef(item)}
                          </span>
                          {isUnread ? <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ea580c]" /> : null}
                        </span>
                        <span
                          className={`block truncate text-sm ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}
                        >
                          {item.title}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="truncate">{preview.opener}</span>
                          <span aria-hidden>·</span>
                          <span className="truncate text-slate-400">{queueOf(item)}</span>
                        </span>
                        <span className="block truncate text-xs text-slate-400 sm:hidden">
                          {truncate(preview.snippet, 70)}
                        </span>
                      </span>
                      <span className="hidden text-center text-[11px] font-semibold text-slate-500 sm:block">
                        {priority.label}
                      </span>
                      <span
                        aria-hidden
                        title={assignee}
                        className="mx-auto hidden h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-white sm:flex"
                      >
                        {initialsOf(assignee)}
                      </span>
                      <span className={`justify-self-start rounded px-1.5 py-0.5 text-[10px] font-bold ${statusClass(status)}`}>
                        {status}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        }
        detail={
          selected ? (
            <div className="flex h-full flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-xs">
                <span className="font-mono font-semibold text-slate-500">{ticketRef(selected)}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${statusClass(statusOf(selected))}`}>
                  {statusOf(selected)}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${priorityOf(selected).className}`}>
                  {priorityOf(selected).code} · {priorityOf(selected).label}
                </span>
                <span className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  {selected.queue ?? UNQUEUED}
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-slate-500">
                  <span
                    aria-hidden
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[8px] font-bold text-white"
                  >
                    {initialsOf(assigneeOf(selected))}
                  </span>
                  {assigneeOf(selected)}
                </span>
              </div>
              <p className="rounded-lg border border-black/10 bg-white px-4 py-2 text-[11px] text-slate-500">
                SLA target: resolve within {priorityOf(selected).hours}h of logging ({priorityOf(selected).label} priority)
              </p>
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
