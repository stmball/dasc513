"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { EvidenceItem, EvidenceKind } from "@/lib/types";
import { DocumentBody, DocumentHeader, DocumentTable, hashId } from "../document/DocumentChrome";
import { GridDetailShell } from "./GridDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** The whole page opts out of Poppins (see DocumentChrome/ArchivePage notes
 * elsewhere on why the stage pages break house style) in favour of the
 * browser's native UI font — `system-ui` resolves to San Francisco on
 * macOS, Segoe UI on Windows — so the "OS file browser" illusion is backed
 * by an actually-native typeface, not a decorative choice pretending to be
 * one. */
const SYSTEM_FONT = "font-[system-ui]";

/** The folder every item without an explicit `folder` falls into — keeps
 * the page working for a stage whose content hasn't been organised into
 * folders yet, rather than silently dropping items. */
const UNFILED = "Unfiled";

const KIND_COLOR: Record<EvidenceKind, string> = {
  email: "text-sky-500",
  memo: "text-slate-500",
  report: "text-indigo-500",
  policy: "text-amber-500",
  dataset: "text-emerald-500",
  code: "text-violet-500",
  ticket: "text-rose-500",
  press: "text-cyan-500",
  transcript: "text-teal-500",
  forum: "text-pink-500",
};

/** Every colour above as a background fill instead of a text colour, for the
 * record-tab and classification-badge chrome. Written out in full rather
 * than derived from KIND_COLOR by string replacement — Tailwind can't see a
 * class name built at runtime, only ones that appear literally in source. */
const KIND_BG: Record<EvidenceKind, string> = {
  email: "bg-sky-500",
  memo: "bg-slate-500",
  report: "bg-indigo-500",
  policy: "bg-amber-500",
  dataset: "bg-emerald-500",
  code: "bg-violet-500",
  ticket: "bg-rose-500",
  press: "bg-cyan-500",
  transcript: "bg-teal-500",
  forum: "bg-pink-500",
};

function kindBg(kind: EvidenceKind): string {
  return KIND_BG[kind];
}

/** The category a records clerk would stamp on the folder, not the rendering
 * `kind` a developer would name it — the whole point of the properties
 * panel is that it reads like a real filing system, not a CMS field list. */
const CLASSIFICATION: Record<EvidenceKind, string> = {
  email: "Correspondence",
  memo: "Internal memorandum",
  dataset: "Data extract",
  report: "Formal report",
  policy: "Compliance record",
  transcript: "Recording transcript",
  code: "Technical specification",
  ticket: "Incident log",
  press: "Public record",
  forum: "External correspondence",
};

/** A deterministic "ARC-nnnn" reference, stable per item and never stored as
 * real content — the same trick `hashId` already does for policy/ticket
 * reference numbers, reused here for every kind. */
function referenceOf(item: EvidenceItem): string {
  return `ARC-${(hashId(item.id) % 9000) + 1000}`;
}

/** A rough page count from how much text the item actually holds, purely
 * for the properties panel's "Length" field — not a precise estimate,
 * just enough to feel like a real record has one. */
function estimatePages(item: EvidenceItem): number {
  const text = item.thread
    ? item.thread.flatMap((m) => m.body).join(" ")
    : item.body.join(" ");
  return Math.max(1, Math.ceil(text.length / 900));
}

/** A deterministic, plausible file size — cosmetic only, the same trick as
 * `referenceOf`, so the properties panel has something a real "Get Info"
 * window would show that `estimatePages` doesn't already cover. */
function estimateSize(item: EvidenceItem): string {
  const kb = 38 + (hashId(item.id) % 420);
  return kb >= 1000 ? `${(kb / 1000).toFixed(1)} MB` : `${kb} KB`;
}

/** The red/yellow/green traffic-light window controls every macOS window
 * has in its top-left corner — the single most recognisable piece of Finder
 * chrome, so it does a lot of work toward "this is a Finder clone" for very
 * little markup. Decorative only, like the rest of the window furniture. */
function TrafficLights() {
  return (
    <span className="flex items-center gap-[6px]" aria-hidden>
      <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
      <span className="h-3 w-3 rounded-full bg-[#28c840]" />
    </span>
  );
}

/** A plain document-shape icon with a folded corner, coloured by file kind —
 * the classic file-browser glyph, drawn in SVG rather than pulled from an
 * icon font so it needs no extra dependency. */
function FileIcon({ kind }: { kind: EvidenceKind }) {
  return (
    <svg
      width="38"
      height="46"
      viewBox="0 0 34 42"
      aria-hidden
      className={`${KIND_COLOR[kind]} drop-shadow-sm`}
    >
      <path
        d="M3 2h16l12 12v24a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M19 2v10a2 2 0 0 0 2 2h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** A simple folder-shape icon, macOS-blue when it's the active sidebar
 * item, the same muted grey as Finder's inactive ones otherwise. */
function SidebarFolderIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="14" viewBox="0 0 18 15" aria-hidden className="shrink-0">
      <path
        d="M1 3a1 1 0 0 1 1-1h4.5l1.5 2h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3z"
        fill={active ? "#ffffff" : "#0a84ff"}
        fillOpacity={active ? 1 : 0.85}
      />
    </svg>
  );
}

/** The large icon-view folder tile a group actually double-clicks into —
 * the same macOS blue as the sidebar's, just bigger, so the top level of
 * the archive reads as a real records room with real folders on the shelf
 * rather than a flat pile of files. */
function FolderTileIcon() {
  return (
    <svg width="44" height="36" viewBox="0 0 44 36" aria-hidden className="drop-shadow-sm">
      <path
        d="M2 6a2 2 0 0 1 2-2h10l3 4h23a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"
        fill="#5ea1ff"
      />
      <path d="M2 11h40v19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V11z" fill="#0a84ff" />
    </svg>
  );
}

/** A "Recently viewed" rail at the root of the archive — the one thing a
 * real document-management system almost always puts on its home screen,
 * ahead of the folder shelf, so a group returning to the archive can jump
 * straight back to what it was just looking at instead of re-navigating the
 * folder tree from scratch. */
function RecentlyOpened({
  ids,
  evidence,
  onOpen,
}: {
  ids: string[];
  evidence: EvidenceItem[];
  onOpen: (id: string) => void;
}) {
  if (ids.length === 0) return null;
  return (
    <div className="mb-5 border-b border-slate-200 pb-5">
      <p className="mb-2.5 text-[11px] font-semibold text-slate-500">Recently viewed</p>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {ids.map((id) => {
          const item = evidence.find((e) => e.id === id);
          if (!item) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onOpen(id)}
              className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-md p-2 text-center hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]"
            >
              <FileIcon kind={item.kind} />
              <span className="line-clamp-2 text-[11px] leading-snug text-slate-600">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The physical tone and texture a kind's sheet was actually produced on — a
 * warm near-white for a formal letter, pale newsprint for a press clipping,
 * green-bar stripes for a machine-printed extract, faint graph-paper for a
 * data extract — so the frame reads as a specific real artefact rather than
 * one white card with a label swapped.
 */
function paperStyle(kind: EvidenceKind): CSSProperties {
  switch (kind) {
    case "code":
      return {
        backgroundColor: "#f6faf5",
        backgroundImage:
          "repeating-linear-gradient(180deg, rgba(22,101,52,0.08) 0px, rgba(22,101,52,0.08) 11px, transparent 11px, transparent 22px)",
      };
    case "dataset":
      return {
        backgroundColor: "#fdfcf7",
        backgroundImage:
          "linear-gradient(rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      };
    case "press":
      return { backgroundColor: "#f1efe4" };
    default:
      return { backgroundColor: "#fdfbf3" };
  }
}

/** The typeface a sheet was "typed" or "printed" in — serif for formal
 * prose, monospace for a terminal extract or a typed-up transcript, and the
 * page's own inherited system font for anything closer to a plain printout
 * (a data table, a forwarded email) that was never meant to look literary. */
function paperFontClass(kind: EvidenceKind): string {
  if (kind === "code" || kind === "transcript") return "font-mono";
  if (kind === "memo" || kind === "report" || kind === "policy" || kind === "ticket" || kind === "press") {
    return "font-serif";
  }
  return "";
}

/** A small deterministic tilt from the item's own id, so a shelf of papers
 * doesn't all sit perfectly square the way an on-screen stack of cards
 * would — never random, so it doesn't shift between renders. */
function paperTilt(id: string): number {
  return ((hashId(id) % 17) - 8) / 7;
}

const HAS_LETTERHEAD: Partial<Record<EvidenceKind, true>> = {
  memo: true,
  report: true,
  policy: true,
};

// Ticket kind already carries its own "Logged" pill in `DocumentHeader`
// (`components/document/DocumentChrome.tsx`) — a second stamp there would
// double up, so only policy gets the archive's own ink stamp.
const STAMP_BY_KIND: Partial<Record<EvidenceKind, { label: string; sublabel: string }>> = {
  policy: { label: "On file", sublabel: "Compliance" },
};

/** The headed paper a formal Meridian document actually left the building
 * on — a crest, the company name and a thin double rule — for the kinds
 * that would plausibly have been printed on letterhead. A ticket or a code
 * extract never gets one; those are internal, unheaded sheets. */
function Letterhead() {
  return (
    <div className="px-6 pb-3 pt-6">
      <div className="flex items-center gap-3">
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden className="shrink-0 text-slate-700">
          <path
            d="M16 1.5 29.5 7v9.5c0 8.3-5.6 12.7-13.5 14.3C8.1 29.2 2.5 24.8 2.5 16.5V7z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <text x="16" y="20" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="currentColor">
            MHA
          </text>
        </svg>
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold uppercase tracking-[0.1em] text-slate-800">
            Meridian Health Analytics Ltd
          </p>
          <p className="text-[9.5px] uppercase tracking-[0.16em] text-slate-400">
            Assurance &amp; Governance Office
          </p>
        </div>
      </div>
      <div className="mt-3 border-t-2 border-slate-700" />
      <div className="mt-[3px] border-t border-slate-300" />
    </div>
  );
}

/** The paperclip holding a loose memo's pages together, drawn overlapping
 * the sheet's own top-left corner the way a real one catches the edge. */
function PaperClip() {
  return (
    <svg
      aria-hidden
      width="30"
      height="30"
      viewBox="0 0 24 24"
      className="pointer-events-none absolute -left-2.5 -top-2.5 -rotate-[18deg] text-slate-400 drop-shadow"
    >
      <path
        d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49L13 2.56a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A rectangular ink stamp — the kind a records clerk or an incident desk
 * actually presses onto a sheet — rotated slightly off true the way a real
 * hand stamp always lands, never dead square. */
function InkStamp({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-5 top-5 rotate-[-7deg] rounded-sm border-[3px] border-double border-slate-400 px-2.5 py-1 opacity-70 mix-blend-multiply"
    >
      <p className="text-center text-[11px] font-black uppercase leading-none tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-center text-[8px] font-semibold uppercase leading-none tracking-wide text-slate-400">
        {sublabel}
      </p>
    </div>
  );
}

/** Real perforation — a row of tear-off holes along the top of a pad sheet,
 * or down both edges of a fanfold printer extract — rather than a dashed
 * CSS border standing in for one. */
function Perforation({ orientation }: { orientation: "top" | "sides" }) {
  if (orientation === "top") {
    return (
      <div
        aria-hidden
        className="h-2.5 w-full"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 2px, transparent 2.1px)",
          backgroundSize: "13px 100%",
        }}
      />
    );
  }
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 top-0 left-1.5 w-2"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 2.2px, transparent 2.3px)",
          backgroundSize: "100% 15px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 top-0 right-1.5 w-2"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 2.2px, transparent 2.3px)",
          backgroundSize: "100% 15px",
        }}
      />
    </>
  );
}

/**
 * The record itself, filed rather than just displayed — but opened inside a
 * Quick-Look-shaped floating window: its own small traffic-light title bar,
 * rounded corners and a soft shadow against the Finder-grey backdrop, the
 * way pressing Space on a selected file actually looks on macOS. Inside
 * that chrome sits a second, physical layer: the actual sheet of paper,
 * tilted a degree off true on a grey mat, in the tone, typeface and
 * accessories (a letterhead, a paperclip, an ink stamp, tractor-feed holes)
 * its own kind would really have been produced with — so a group is looking
 * at a photographed document, not an HTML card with a label on it.
 * `DocumentHeader` and friends still render the actual content, untouched,
 * exactly as every other stage uses them.
 */
function RecordSheet({ item }: { item: EvidenceItem }) {
  const ref = referenceOf(item);
  const pages = estimatePages(item);
  const tilt = paperTilt(item.id);
  const stamp = STAMP_BY_KIND[item.kind];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-300/70 bg-white shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-[#ececec] px-4 py-2.5">
        <TrafficLights />
        <p className="flex-1 truncate text-center text-xs font-semibold text-slate-600">
          {item.title}
        </p>
        <span aria-hidden className="w-[54px]" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-[#dcdcdf] px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <span className="font-mono tracking-normal text-slate-600">{ref}</span>
        <span className={`rounded-full px-2 py-0.5 text-white ${kindBg(item.kind)}`}>
          {CLASSIFICATION[item.kind]}
        </span>
        <span>{pages} {pages === 1 ? "page" : "pages"}</span>
      </div>
      <div className="bg-[#d7d7da] px-4 py-7 sm:px-10">
        <div
          className="relative mx-auto max-w-2xl overflow-hidden rounded-[2px] ring-1 ring-black/10"
          style={{
            ...paperStyle(item.kind),
            transform: `rotate(${tilt}deg)`,
            boxShadow: "0 22px 45px -18px rgba(15,23,42,0.45), 0 2px 6px rgba(15,23,42,0.08)",
          }}
        >
          {item.kind === "memo" ? <PaperClip /> : null}
          {stamp ? <InkStamp label={stamp.label} sublabel={stamp.sublabel} /> : null}
          {item.kind === "ticket" ? <Perforation orientation="top" /> : null}
          {item.kind === "code" ? <Perforation orientation="sides" /> : null}
          <div className={paperFontClass(item.kind)}>
            {HAS_LETTERHEAD[item.kind] ? <Letterhead /> : null}
            <DocumentHeader item={item} />
            <div className="px-6 py-5">
              <DocumentBody item={item} />
              <DocumentTable item={item} />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-[10px] text-slate-400">
        Retrieved from the archive · {ref} · logged for this session only
      </div>
    </div>
  );
}

/** The folder-cover properties panel a real records system shows alongside
 * a document — styled like a macOS "Get Info" window — plus a "same
 * category" cross-reference list, so the archive invites browsing sideways
 * the way a real filing cabinet does. */
function PropertiesPanel({
  item,
  related,
  onSelect,
}: {
  item: EvidenceItem;
  related: EvidenceItem[];
  onSelect: (id: string) => void;
}) {
  const ref = referenceOf(item);
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-300/70 bg-white shadow-md">
        <div className="flex flex-col items-center gap-2 border-b border-slate-200 bg-[#ececec] px-4 py-4">
          <FileIcon kind={item.kind} />
          <p className="text-center text-xs font-semibold text-slate-700">{item.title}</p>
        </div>
        <dl className="divide-y divide-slate-100 px-4 py-1 text-xs">
          {[
            ["Reference", ref],
            ["Folder", item.folder ?? UNFILED],
            ["Category", CLASSIFICATION[item.kind]],
            ["Filed", item.date ?? "Undated"],
            ["Source", item.source || "n/a"],
            ["Size", estimateSize(item)],
            ["Length", `${estimatePages(item)} pg`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 py-2">
              <dt className="shrink-0 font-semibold text-slate-500">{label}</dt>
              <dd className="min-w-0 truncate text-right text-slate-700">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {related.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-300/70 bg-white shadow-md">
          <p className="border-b border-slate-200 bg-[#ececec] px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Also filed under {CLASSIFICATION[item.kind]}
          </p>
          <ul className="divide-y divide-slate-100">
            {related.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r.id)}
                  className="block w-full px-4 py-2.5 text-left text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  {r.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Where in the archive the group currently is: the root (a shelf of
 * folders), the flat "All files" view, or inside one named folder. */
type Location = "root" | "all" | { folder: string };

/**
 * A macOS Finder clone: a real traffic-light title bar, a toolbar with a
 * working back button and a (decorative) search field, a sidebar down the
 * left, and an icon-view grid — folders first, files once you're inside
 * one — with Finder's own icon-plus-label selection shape. Rendered in the
 * system UI font instead of the brand's Poppins, so it reads as the
 * operating system's own file browser rather than a themed panel inside
 * the teaching tool.
 */
export function ArchivePage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;
  // Most-recently-opened ids, newest first — purely a browsing convenience
  // local to this component (not persisted, not `opened`, which is a Set
  // with no ordering), the way a real DMS's "Recently viewed" rail works.
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const folderOf = (item: EvidenceItem) => item.folder ?? UNFILED;

  const folders = useMemo(() => {
    const names = new Set(stage.evidence.map(folderOf));
    // Every item fell back to UNFILED: this stage hasn't been organised into
    // folders, so behave like the old flat file list rather than show a
    // single pointless "Unfiled" folder.
    if (names.size === 1 && names.has(UNFILED)) return [];
    return Array.from(names).sort((a, b) => (a === UNFILED ? 1 : b === UNFILED ? -1 : a.localeCompare(b)));
  }, [stage.evidence]);

  const hasFolders = folders.length > 0;

  const [location, setLocation] = useState<Location>(hasFolders ? "root" : "all");

  const currentFolderName = typeof location === "object" ? location.folder : null;

  const filesInView =
    location === "root"
      ? []
      : location === "all"
        ? stage.evidence
        : stage.evidence.filter((item) => folderOf(item) === currentFolderName);

  const related = selected
    ? stage.evidence.filter((item) => item.kind === selected.kind && item.id !== selected.id).slice(0, 5)
    : [];

  function openFile(id: string) {
    setSelectedId(id);
    onOpen(id);
    setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 6));
  }

  function sidebarButtonClass(active: boolean) {
    return `flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ${
      active ? "bg-[#0a84ff] text-white" : "text-slate-700 hover:bg-slate-200/70"
    }`;
  }

  const breadcrumbTail =
    location === "root" ? "Records" : location === "all" ? "Records / All files" : `Records / ${currentFolderName}`;

  const canGoBack = location !== "root" && hasFolders;

  return (
    <>
      <GridDetailShell
        containerClassName={`bg-[#f6f6f7] ${SYSTEM_FONT}`}
        backButtonClassName="text-slate-500 hover:text-slate-900"
        headerBar={
          <>
            <div className="flex items-center gap-3 border-b border-slate-300 bg-[#ececec] px-4 py-2">
              <TrafficLights />
              <p className="flex-1 truncate text-center text-[13px] font-semibold text-slate-700">
                {stage.chrome}
              </p>
              <span aria-hidden className="w-[54px]" />
            </div>
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-300 bg-[#f6f6f7] px-4 py-2">
              <button
                type="button"
                disabled={!canGoBack}
                onClick={() => setLocation("root")}
                aria-label="Back to Records"
                className={`flex h-6 w-6 items-center justify-center rounded text-sm ${
                  canGoBack ? "text-slate-600 hover:bg-slate-200" : "text-slate-300"
                }`}
              >
                ‹
              </button>
              <p className="text-[13px] text-slate-500">
                {session.subject.company} / {breadcrumbTail}
              </p>
              <span className="flex-1" />
              <div className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-400">
                <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
                  <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Search
              </div>
            </div>
          </>
        }
        grid={
          <div className="flex min-h-[28rem] gap-0 overflow-hidden rounded-b-xl border border-t-0 border-slate-300 bg-white">
            <nav className="w-44 shrink-0 border-r border-slate-200 bg-[#f0f0f2] p-2.5">
              <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Favourites
              </p>
              <button type="button" onClick={() => setLocation("all")} className={sidebarButtonClass(location === "all")}>
                <SidebarFolderIcon active={location === "all"} />
                All files
                <span className="ml-auto text-[11px] opacity-70">{stage.evidence.length}</span>
              </button>
              {hasFolders ? (
                <>
                  <p className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Folders
                  </p>
                  {folders.map((name) => {
                    const count = stage.evidence.filter((item) => folderOf(item) === name).length;
                    const active = currentFolderName === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setLocation({ folder: name })}
                        className={sidebarButtonClass(active)}
                      >
                        <SidebarFolderIcon active={active} />
                        <span className="truncate">{name}</span>
                        <span className="ml-auto text-[11px] opacity-70">{count}</span>
                      </button>
                    );
                  })}
                </>
              ) : null}
            </nav>
            <div className="flex-1 p-5">
              {location === "root" ? (
                <>
                  <RecentlyOpened ids={recentIds} evidence={stage.evidence} onOpen={openFile} />
                  <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
                  {folders.map((name) => {
                    const count = stage.evidence.filter((item) => folderOf(item) === name).length;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setLocation({ folder: name })}
                        className="group flex flex-col items-center gap-1.5 rounded-md p-2 text-center focus:outline-none"
                      >
                        <FolderTileIcon />
                        <span className="rounded px-1.5 py-0.5 text-[12px] leading-snug text-slate-700 group-hover:bg-slate-100 group-focus-visible:bg-[#0a84ff] group-focus-visible:text-white">
                          {name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {count} {count === 1 ? "item" : "items"}
                        </span>
                      </button>
                    );
                  })}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
                  {filesInView.map((item) => {
                    const isUnread = !opened.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openFile(item.id)}
                        className="group relative flex flex-col items-center gap-1.5 rounded-md p-2 text-center focus:outline-none"
                      >
                        {isUnread ? (
                          <span
                            aria-hidden
                            className="absolute right-3 top-0 h-2 w-2 rounded-full bg-[#0a84ff]"
                          />
                        ) : null}
                        <FileIcon kind={item.kind} />
                        <span className="line-clamp-2 rounded px-1.5 py-0.5 text-[12px] leading-snug text-slate-700 group-hover:bg-slate-100 group-focus-visible:bg-[#0a84ff] group-focus-visible:text-white">
                          {item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        }
        detail={
          selected ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <RecordSheet item={selected} />
              <PropertiesPanel item={selected} related={related} onSelect={openFile} />
            </div>
          ) : null
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← Back to the file list"
      />
      <BackLink slug={session.slug} />
    </>
  );
}
