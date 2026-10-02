"use client";

import { useMemo, useState } from "react";
import { PT_Serif } from "next/font/google";
import type { EvidenceItem, EvidenceKind } from "@/lib/types";
import { DocumentBody, DocumentHeader, DocumentTable, hashId } from "../document/DocumentChrome";
import { GridDetailShell } from "./GridDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** An official-record serif — a touch heavier and less polished than a
 * magazine face, the way a minute-taker's own template has looked for
 * decades — not Poppins (which this page would otherwise quietly inherit
 * from the app shell) and not the same serif the blog format reaches for,
 * so the two "formal record" pages still read as different systems.
 * Applied once, on the page's own container, so the shared `DocumentChrome`
 * reading pane inherits it too. */
const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

/** Plain system UI chrome (breadcrumbs, badges, buttons) stays off the
 * serif, the way an old council system's generated chrome never matched its
 * templated paper documents either. */
const UI_FONT = "font-[Arial,Helvetica,sans-serif]";

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

/** Whether an agenda item has to be taken in closed session — generically,
 * whether any paper filed under it is a formal exempt record (`policy`
 * kind), the same test a real clerk applies under Schedule 12A to the
 * Local Government Act 1972. Drives the Part I / Part II split below,
 * rather than any hardcoded item name, so it works for any session that
 * reuses this format. */
function isExempt(name: string, evidence: EvidenceItem[]): boolean {
  return evidence.some((item) => (item.folder ?? UNFILED) === name && item.kind === "policy");
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
        <div className={`flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-[#3f5c3f] ${UI_FONT}`}>
          <span>Appendix {letter}</span>
          <span className="tracking-normal">{ref}</span>
          <span>{pages} {pages === 1 ? "page" : "pages"}</span>
        </div>
        <h2 className="mt-2 text-xl font-bold leading-snug text-[#2a2a22]">{item.title}</h2>
        <p className={`mt-1 text-xs font-semibold uppercase tracking-wide text-[#6b6650] ${UI_FONT}`}>
          {CLASSIFICATION[item.kind]}
        </p>
      </div>
      <DocumentHeader item={item} />
      <div className="px-6 py-5">
        <DocumentBody item={item} />
        <DocumentTable item={item} />
      </div>
      <div className={`border-t border-dashed border-[#c9c2ac] bg-[#f6f2e6] px-6 py-2 text-[10px] text-[#8a8468] ${UI_FONT}`}>
        Circulated to committee members · {ref} · papers portal, this session only
      </div>
    </div>
  );
}

/** One row of the agenda: the item's own label, how many papers are filed
 * under it, and a disclosure arrow — shared between the Part I and Part II
 * lists so the only difference between them is which section they sit in. */
function AgendaRow({
  name,
  count,
  onOpen,
}: {
  name: string;
  count: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-sm border border-[#c9c2ac] bg-[#fffdf7] px-4 py-3 text-left transition-colors hover:border-[#3f5c3f] hover:bg-[#fbf8ee] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f5c3f]"
    >
      <span className="min-w-0">
        <span className="block text-base font-semibold text-[#2a2a22]">{name}</span>
        <span className={`mt-0.5 block text-xs text-[#6b6650] ${UI_FONT}`}>
          {count} {count === 1 ? "paper" : "papers"} attached
        </span>
      </span>
      <span aria-hidden className="shrink-0 text-[#3f5c3f]">›</span>
    </button>
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

  // Every real committee agenda in England is split by statute into a Part
  // I the public can see and a Part II the chair can close the room for —
  // the one structural thing that makes this page read as a formal council
  // system rather than the archive's informal file browser, even though
  // both are "the formal record" gates.
  const openItems = agendaItems.filter((name) => !isExempt(name, stage.evidence));
  const exemptItems = agendaItems.filter((name) => isExempt(name, stage.evidence));

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
        containerClassName={`bg-[#f6f2e6] ${ptSerif.className}`}
        backButtonClassName={`text-[#3f5c3f] hover:text-[#2a2a22] ${UI_FONT}`}
        headerBar={
          <div className="border-b-4 border-[#3f5c3f] bg-[#eee8d8]">
            <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
              <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b6650] ${UI_FONT}`}>
                {session.subject.company} · Papers Portal
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#2a2a22]">{stage.chrome}</h1>
              <p className={`mt-2 text-sm text-[#55503e] ${UI_FONT}`}>{breadcrumbTail}</p>
            </div>
          </div>
        }
        grid={
          <div className="space-y-6">
            <div className="space-y-2">
              <p className={`text-xs font-semibold text-[#6b6650] ${UI_FONT}`}>
                Part I — open to the public
              </p>
              {PROCEDURAL_ITEMS.map((label) => (
                <div
                  key={label}
                  className={`flex items-center justify-between rounded-sm border border-dashed border-[#c9c2ac] bg-[#fbf8ee] px-4 py-3 text-sm text-[#8a8468] ${UI_FONT}`}
                >
                  <span>{label}</span>
                  <span className="text-xs italic">No papers circulated</span>
                </div>
              ))}
              {openItems.map((name) => (
                <AgendaRow
                  key={name}
                  name={name}
                  count={stage.evidence.filter((item) => folderOf(item) === name).length}
                  onOpen={() => setLocation({ folder: name })}
                />
              ))}
            </div>
            {exemptItems.length ? (
              <div className="space-y-2">
                <p className={`rounded-sm border border-dashed border-[#8a6d1d] bg-[#f6f2e6] px-4 py-2.5 text-xs leading-relaxed text-[#6b5a3e] ${UI_FONT}`}>
                  <span className="font-semibold">Part II — exempt items.</span> The press and public may be
                  excluded from the items below under Schedule 12A to the Local Government Act 1972, as they
                  involve information relating to the business or commercial affairs of a named organisation.
                </p>
                {exemptItems.map((name) => (
                  <AgendaRow
                    key={name}
                    name={name}
                    count={stage.evidence.filter((item) => folderOf(item) === name).length}
                    onOpen={() => setLocation({ folder: name })}
                  />
                ))}
              </div>
            ) : null}
          </div>
        }
        detail={
          currentFolderName && !selected ? (
            <div className="space-y-2">
              <p className="mb-2 text-lg font-bold text-[#2a2a22]">{currentFolderName}</p>
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
                        <span className={`mt-0.5 block text-[11px] uppercase tracking-wide text-[#8a8468] ${UI_FONT}`}>
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
