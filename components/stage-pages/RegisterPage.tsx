"use client";

import { useMemo, useState } from "react";
import type { EvidenceItem, EvidenceKind } from "@/lib/types";
import { DocumentBody, DocumentHeader, DocumentTable, hashId } from "../document/DocumentChrome";
import { GridDetailShell } from "./GridDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** The workstream every item without an explicit `folder` falls into — keeps
 * the page working for a stage whose content hasn't been organised into
 * workstreams yet, rather than silently dropping items. */
const UNFILED = "General";

const CLASSIFICATION: Record<EvidenceKind, string> = {
  email: "Correspondence",
  memo: "Internal note",
  dataset: "Data extract",
  report: "Formal report",
  policy: "Compliance record",
  transcript: "Recording transcript",
  code: "Technical specification",
  ticket: "Incident log",
  press: "Public record",
  forum: "External correspondence",
};

const SEVERITIES = ["Low", "Moderate", "High"] as const;
const SEVERITY_STYLE: Record<(typeof SEVERITIES)[number], string> = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-600/30",
  Moderate: "bg-amber-50 text-amber-800 ring-amber-600/30",
  High: "bg-rose-50 text-rose-800 ring-rose-600/40",
};

const STATUSES = ["Open", "Under review", "Closed"] as const;

/** Deterministic, cosmetic case metadata — the same trick `ArchivePage`'s
 * `referenceOf`/`estimateSize` use, so every case reads as a filed, tracked
 * record without any of it being real data a question could be asked about. */
function caseRef(item: EvidenceItem): string {
  return `SI-${2000 + (hashId(item.id) % 24)}-${((hashId(item.id) >>> 3) % 900) + 100}`;
}
function severityOf(item: EvidenceItem): (typeof SEVERITIES)[number] {
  return SEVERITIES[hashId(item.id) % SEVERITIES.length];
}
function statusOf(item: EvidenceItem): (typeof STATUSES)[number] {
  return STATUSES[(hashId(item.id) >>> 2) % STATUSES.length];
}

function folderOf(item: EvidenceItem): string {
  return item.folder ?? UNFILED;
}

/** A case file cover sheet: reference, severity and status above the fold,
 * then the same `DocumentHeader`/`DocumentBody`/`DocumentTable` every other
 * stage uses, dropped in untouched. */
function CaseFile({ item }: { item: EvidenceItem }) {
  const ref = caseRef(item);
  const severity = severityOf(item);
  const status = statusOf(item);
  return (
    <div className="overflow-hidden rounded-sm border border-slate-300 bg-white shadow-sm">
      <div className="border-b-4 border-[#7f1d1d] bg-[#fdf2f2] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold text-[#7f1d1d]">{ref}</span>
          <div className="flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${SEVERITY_STYLE[severity]}`}>
              {severity} risk
            </span>
            <span className="rounded border border-slate-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              {status}
            </span>
          </div>
        </div>
        <h2 className="mt-3 text-xl font-bold leading-snug text-slate-900">{item.title}</h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {folderOf(item)} · {CLASSIFICATION[item.kind]}
        </p>
      </div>
      <DocumentHeader item={item} />
      <div className="px-6 py-5">
        <DocumentBody item={item} />
        <DocumentTable item={item} />
      </div>
      <div className="border-t border-dashed border-slate-300 bg-slate-50 px-6 py-2 text-[10px] text-slate-400">
        Logged in the assurance register · {ref} · this session only
      </div>
    </div>
  );
}

function CaseRow({
  item,
  isUnread,
  onSelect,
}: {
  item: EvidenceItem;
  isUnread: boolean;
  onSelect: (id: string) => void;
}) {
  const severity = severityOf(item);
  const status = statusOf(item);
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className="flex w-full flex-col gap-1.5 border-b border-slate-200 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#fdf2f2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7f1d1d] focus-visible:ring-inset sm:flex-row sm:items-center sm:gap-4"
    >
      <span className="shrink-0 font-mono text-[11px] text-slate-400 sm:w-28">{caseRef(item)}</span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>
          {item.title}
        </span>
        <span className="mt-0.5 block text-[11px] text-slate-400">{CLASSIFICATION[item.kind]}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${SEVERITY_STYLE[severity]}`}>
          {severity}
        </span>
        <span className="w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{status}</span>
        {isUnread ? <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#7f1d1d]" /> : null}
      </span>
    </button>
  );
}

/**
 * A clinical-governance risk-and-incident register — a formal white-and-
 * burgundy case-management system, cases filed by workstream and tagged
 * with a severity and a status, rather than `ArchivePage`'s Finder-icon
 * folders — deliberately not the DASC513 navy/coral/teal brand, and
 * deliberately not any of the other stage pages' palettes, so the formal
 * audit trail reads as a real patient-safety register rather than a themed
 * file browser.
 */
export function RegisterPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;

  const workstreams = useMemo(() => {
    const names = Array.from(new Set(stage.evidence.map(folderOf)));
    return names.sort((a, b) => (a === UNFILED ? 1 : b === UNFILED ? -1 : a.localeCompare(b)));
  }, [stage.evidence]);

  function openCase(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  const openCount = stage.evidence.filter((item) => statusOf(item) !== "Closed").length;

  return (
    <>
      <GridDetailShell
        containerClassName="bg-[#f7f5f4] font-sans"
        backButtonClassName="text-[#7f1d1d] hover:text-slate-900"
        headerBar={
          <div className="border-b-4 border-[#7f1d1d] bg-white">
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {session.subject.company} · Assurance &amp; Governance
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">{stage.chrome}</h1>
              </div>
              <span className="shrink-0 rounded-full bg-[#7f1d1d] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {openCount} open
              </span>
            </div>
          </div>
        }
        grid={
          <div className="space-y-6">
            {workstreams.map((name) => {
              const items = stage.evidence.filter((item) => folderOf(item) === name);
              return (
                <div key={name} className="overflow-hidden rounded-sm border border-slate-300 bg-white">
                  <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                    {name} <span className="font-normal normal-case text-slate-400">· {items.length} {items.length === 1 ? "case" : "cases"}</span>
                  </p>
                  <div>
                    {items.map((item) => (
                      <CaseRow key={item.id} item={item} isUnread={!opened.has(item.id)} onSelect={openCase} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        }
        detail={selected ? <CaseFile item={selected} /> : null}
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← Back to the register"
      />
      <BackLink slug={session.slug} />
    </>
  );
}
