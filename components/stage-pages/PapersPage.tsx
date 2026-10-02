"use client";

import { useMemo, useState } from "react";
import type { EvidenceItem, EvidenceKind } from "@/lib/types";
import { DocumentBody, DocumentHeader, DocumentTable, hashId } from "../document/DocumentChrome";
import { GridDetailShell } from "./GridDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** The agenda item every paper without an explicit `folder` falls under —
 * keeps the page working for a stage whose content hasn't been organised
 * into agenda items yet, rather than silently dropping items. */
const UNFILED = "Business arising";

/** Purely procedural agenda items with nothing attached — the standing
 * business every real committee agenda opens with, so the pack doesn't read
 * as a bare list of VITAL-LM exhibits. Never backed by any evidence. */
const PROCEDURAL_ITEMS = [
  "Item 1 — Apologies for absence",
  "Item 2 — Declarations of interest",
  "Item 3 — Minutes of the previous meeting (for approval)",
];

const KIND_COLOR: Record<EvidenceKind, string> = {
  email: "text-sky-700",
  memo: "text-stone-600",
  report: "text-amber-700",
  policy: "text-rose-700",
  dataset: "text-emerald-700",
  code: "text-violet-700",
  ticket: "text-orange-700",
  press: "text-cyan-700",
  transcript: "text-teal-700",
  forum: "text-pink-700",
};

const CLASSIFICATION: Record<EvidenceKind, string> = {
  email: "Correspondence",
  memo: "Officer report",
  dataset: "Appendix — data",
  report: "Officer report",
  policy: "Exempt — Part II (confidential)",
  transcript: "Appendix — evidence log",
  code: "Technical appendix",
  ticket: "Incident log",
  press: "Public document",
  forum: "External correspondence",
};

/** The leading "Item N" number a folder string carries, for sorting the
 * agenda in meeting order rather than alphabetically. */
function itemNumber(label: string): number {
  const m = /^Item\s+(\d+)/i.exec(label);
  return m ? Number(m[1]) : 999;
}

/** A deterministic "IG-nn/nnn" committee paper reference, stable per item. */
function paperRef(item: EvidenceItem): string {
  return `IG-24/${((hashId(item.id) % 900) + 100)}`;
}

/** The appendix letter a paper is filed as within its agenda item — stable
 * because it's just the item's position in the stage's own evidence array. */
function appendixLetter(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

/** A rough page count from how much text the item actually holds, for the
 * cover sheet's "Length" field. */
function estimatePages(item: EvidenceItem): number {
  const text = item.thread
    ? item.thread.flatMap((m) => m.body).join(" ")
    : item.body.join(" ");
  return Math.max(1, Math.ceil(text.length / 900));
}

/** A committee paper's cover sheet: reference, classification and purpose
 * above the fold, then the same `DocumentHeader`/`DocumentBody`/`DocumentTable`
 * every other stage uses, dropped in untouched. */
function PaperCover({ item, letter }: { item: EvidenceItem; letter: string }) {
  const ref = paperRef(item);
  const pages = estimatePages(item);
  return (
    <div className="overflow-hidden rounded-sm border border-[#c9c2ac] bg-[#fffdf7] shadow-sm">
      <div className="border-b-4 border-[#3f5c3f] bg-[#eee8d8] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-[#3f5c3f]">
          <span>Appendix {letter}</span>
          <span className="font-mono tracking-normal">{ref}</span>
          <span>{pages} {pages === 1 ? "page" : "pages"}</span>
        </div>
        <h2 className="mt-2 font-serif text-xl font-bold leading-snug text-[#2a2a22]">{item.title}</h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#6b6650]">
          {CLASSIFICATION[item.kind]}
        </p>
      </div>
      <DocumentHeader item={item} />
      <div className="px-6 py-5">
        <DocumentBody item={item} />
        <DocumentTable item={item} />
      </div>
      <div className="border-t border-dashed border-[#c9c2ac] bg-[#f6f2e6] px-6 py-2 text-[10px] text-[#8a8468]">
        Circulated to committee members · {ref} · papers portal, this session only
      </div>
    </div>
  );
}

type Location = "root" | { folder: string };

/**
 * A ModGov-shaped committee papers portal: an olive-and-cream masthead, a
 * numbered agenda rather than a file browser, and papers that open as
 * lettered appendices under each item — deliberately not the DASC513
 * navy/coral/teal brand, and deliberately not any of the other stage pages'
 * palettes, so this reads as the dry, official system a real committee
 * actually files its papers in.
 */
export function PapersPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;

  const folderOf = (item: EvidenceItem) => item.folder ?? UNFILED;

  const agendaItems = useMemo(() => {
    const names = Array.from(new Set(stage.evidence.map(folderOf)));
    return names.sort((a, b) => itemNumber(a) - itemNumber(b) || a.localeCompare(b));
  }, [stage.evidence]);

  const [location, setLocation] = useState<Location>("root");
  const currentFolderName = typeof location === "object" ? location.folder : null;

  const papersInView =
    location === "root" ? [] : stage.evidence.filter((item) => folderOf(item) === currentFolderName);

  function openPaper(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  const breadcrumbTail = location === "root" ? "Agenda" : `Agenda / ${currentFolderName}`;

  return (
    <>
      <GridDetailShell
        containerClassName="bg-[#f6f2e6] font-sans"
        backButtonClassName="text-[#3f5c3f] hover:text-[#2a2a22]"
        headerBar={
          <div className="border-b-4 border-[#3f5c3f] bg-[#eee8d8]">
            <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b6650]">
                {session.subject.company} · Papers Portal
              </p>
              <h1 className="mt-1 font-serif text-2xl font-bold text-[#2a2a22]">{stage.chrome}</h1>
              <p className="mt-2 text-sm text-[#55503e]">{breadcrumbTail}</p>
            </div>
          </div>
        }
        grid={
          <div className="space-y-2">
            {PROCEDURAL_ITEMS.map((label) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-sm border border-dashed border-[#c9c2ac] bg-[#fbf8ee] px-4 py-3 text-sm text-[#8a8468]"
              >
                <span>{label}</span>
                <span className="text-xs italic">No papers circulated</span>
              </div>
            ))}
            {agendaItems.map((name) => {
              const count = stage.evidence.filter((item) => folderOf(item) === name).length;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setLocation({ folder: name })}
                  className="flex w-full items-center justify-between gap-3 rounded-sm border border-[#c9c2ac] bg-[#fffdf7] px-4 py-3 text-left transition-colors hover:border-[#3f5c3f] hover:bg-[#fbf8ee] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f5c3f]"
                >
                  <span className="min-w-0">
                    <span className="block font-serif text-base font-semibold text-[#2a2a22]">{name}</span>
                    <span className="mt-0.5 block text-xs text-[#6b6650]">
                      {count} {count === 1 ? "paper" : "papers"} attached
                    </span>
                  </span>
                  <span aria-hidden className="shrink-0 text-[#3f5c3f]">›</span>
                </button>
              );
            })}
          </div>
        }
        detail={
          currentFolderName && !selected ? (
            <div className="space-y-2">
              <p className="mb-2 font-serif text-lg font-bold text-[#2a2a22]">{currentFolderName}</p>
              {papersInView.map((item, index) => {
                const isUnread = !opened.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openPaper(item.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-sm border border-[#c9c2ac] bg-[#fffdf7] px-4 py-3 text-left transition-colors hover:border-[#3f5c3f] hover:bg-[#fbf8ee] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f5c3f]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold ${KIND_COLOR[item.kind]}`}
                      >
                        {appendixLetter(index)}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-sm ${isUnread ? "font-bold text-[#2a2a22]" : "font-medium text-[#55503e]"}`}
                        >
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] uppercase tracking-wide text-[#8a8468]">
                          {CLASSIFICATION[item.kind]}
                        </span>
                      </span>
                    </span>
                    {isUnread ? (
                      <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#3f5c3f]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : selected ? (
            <PaperCover
              item={selected}
              letter={appendixLetter(papersInView.findIndex((item) => item.id === selected.id))}
            />
          ) : null
        }
        hasSelection={Boolean(currentFolderName)}
        onBack={() => {
          if (selected) {
            setSelectedId(null);
          } else {
            setLocation("root");
          }
        }}
        backLabel={selected ? "← Back to the agenda item" : "← Back to the agenda"}
      />
      <BackLink slug={session.slug} />
    </>
  );
}
