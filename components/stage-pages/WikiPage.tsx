"use client";

import { useState } from "react";
import type { EvidenceItem, EvidenceKind, Stage } from "@/lib/types";
import { DocumentBody, DocumentTable, hashId } from "../document/DocumentChrome";
import { ListDetailShell } from "./ListDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** Which toctree chapter a page's kind files under — the only thing driving
 * the sidebar's grouping, since evidence items carry no section of their
 * own. Purely cosmetic and derived, the same way `KIND_LABEL` and the
 * hashId-derived reference numbers elsewhere in the document chrome are. */
const SECTION_LABEL: Record<EvidenceKind, string> = {
  policy: "Concepts",
  code: "Architecture",
  report: "Reference",
  ticket: "Open issues",
  memo: "Team & office",
  email: "Correspondence",
  dataset: "Data",
  transcript: "Transcripts",
  press: "News",
  forum: "Discussion",
};

/** A one-letter, one-colour badge per content kind — the equivalent of
 * Confluence's little page/blog-post/attachment icon, so the page tree reads
 * by shape before anyone reads a single title. */
const KIND_ICON: Record<EvidenceKind, { letter: string; hex: string }> = {
  policy: { letter: "P", hex: "#6554C0" },
  code: { letter: "C", hex: "#1D7AFC" },
  report: { letter: "R", hex: "#0C66E4" },
  ticket: { letter: "T", hex: "#E2483D" },
  memo: { letter: "M", hex: "#5E6C84" },
  email: { letter: "E", hex: "#00A3BF" },
  dataset: { letter: "D", hex: "#008DA6" },
  transcript: { letter: "T", hex: "#7A869A" },
  press: { letter: "N", hex: "#DE350B" },
  forum: { letter: "F", hex: "#36B37E" },
};

function KindBadge({ kind }: { kind: EvidenceKind }) {
  const { letter, hex } = KIND_ICON[kind];
  return (
    <span
      aria-hidden
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] text-[9px] font-bold text-white"
      style={{ backgroundColor: hex }}
    >
      {letter}
    </span>
  );
}

/** Groups a stage's evidence into sidebar chapters, in the order each
 * chapter is first encountered — so a stage dominated by engineering pages
 * leads with engineering chapters, the way a real docs tree reflects
 * whoever actually wrote the most pages. */
function groupBySection(evidence: EvidenceItem[]): [string, EvidenceItem[]][] {
  const order: string[] = [];
  const groups = new Map<string, EvidenceItem[]>();
  for (const item of evidence) {
    const label = SECTION_LABEL[item.kind];
    if (!groups.has(label)) {
      order.push(label);
      groups.set(label, []);
    }
    groups.get(label)!.push(item);
  }
  return order.map((label) => [label, groups.get(label)!]);
}

/** Pulls each `**Label.**` field name out of a page's body — the same shape
 * `DocumentChrome`'s own `splitLead` reads, duplicated here as a one-line
 * regex rather than reached into, since this file only needs the labels for
 * a static contents list, not the full turn-grouping logic. */
function extractHeadings(item: EvidenceItem): string[] {
  const heads: string[] = [];
  for (const paragraph of item.body) {
    const m = /^\*\*([^*]+)\*\*/.exec(paragraph.trim());
    if (m) heads.push(m[1].replace(/\.$/, ""));
  }
  return heads;
}

const CONTRIBUTOR_COLORS = ["bg-[#0C66E4]", "bg-[#6554C0]", "bg-[#008DA6]", "bg-[#DE350B]", "bg-[#36B37E]"];

function contributorColor(id: string): string {
  return CONTRIBUTOR_COLORS[hashId(id) % CONTRIBUTOR_COLORS.length];
}

/** One wiki page: a slash breadcrumb, a byline bar with a contributor
 * initial and a kind badge standing in for Confluence's content-type icon, a
 * reused `DocumentBody`/`DocumentTable` for the actual prose (deliberately
 * not `DocumentHeader`'s per-kind letterhead, which would read as a
 * different app entirely dropped onto a docs page), an "In this document"
 * panel pulled straight from the page's own field labels, and the
 * previous/next pager chaining every page in the space into one book. */
function DocsPage({
  item,
  section,
  spaceName,
  prev,
  next,
  onNavigate,
}: {
  item: EvidenceItem;
  section: string;
  spaceName: string;
  prev: EvidenceItem | null;
  next: EvidenceItem | null;
  onNavigate: (id: string) => void;
}) {
  const headings = extractHeadings(item);
  return (
    <div className="mx-auto flex h-full w-full min-w-0 max-w-5xl gap-8 overflow-hidden">
      <article className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto px-1 pb-8 sm:px-2">
          <nav className="flex min-w-0 items-center gap-1.5 text-xs text-[#44546F]">
            <span className="shrink-0 text-[#0C66E4]">{spaceName}</span>
            <span aria-hidden className="shrink-0">/</span>
            <span className="shrink-0 text-[#0C66E4]">{section}</span>
            <span aria-hidden className="shrink-0">/</span>
            <span className="min-w-0 flex-1 truncate text-[#44546F]">{item.title}</span>
          </nav>
          <h1 className="mt-3 text-[28px] font-bold leading-snug text-[#172B4D]">{item.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-[#DCDFE4] pb-4 text-xs text-[#5E6C84]">
            <span
              aria-hidden
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${contributorColor(item.id)}`}
            >
              {item.source.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <span className="font-medium text-[#172B4D]">{item.source}</span>
            {item.date ? <span>· last edited {item.date}</span> : null}
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#F1F2F4] px-2 py-0.5">
              <KindBadge kind={item.kind} />
              {section}
            </span>
          </div>
          <div className="pt-6">
            <DocumentBody item={item} />
            <DocumentTable item={item} />
          </div>
        </div>
        <div className="flex items-stretch justify-between gap-3 border-t border-[#DCDFE4] px-1 py-4 text-sm sm:px-2">
          {prev ? (
            <button
              type="button"
              onClick={() => onNavigate(prev.id)}
              className="min-w-0 max-w-[48%] rounded border border-[#DCDFE4] bg-[#F7F8F9] px-3 py-2 text-left hover:border-[#0C66E4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C66E4]"
            >
              <span className="block text-[10px] font-semibold text-[#8993A4]">Previous page</span>
              <span className="block truncate text-xs font-semibold text-[#0C66E4]">{prev.title}</span>
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button
              type="button"
              onClick={() => onNavigate(next.id)}
              className="ml-auto min-w-0 max-w-[48%] rounded border border-[#DCDFE4] bg-[#F7F8F9] px-3 py-2 text-right hover:border-[#0C66E4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C66E4]"
            >
              <span className="block text-[10px] font-semibold text-[#8993A4]">Next page</span>
              <span className="block truncate text-xs font-semibold text-[#0C66E4]">{next.title}</span>
            </button>
          ) : (
            <span />
          )}
        </div>
      </article>
      {headings.length > 1 ? (
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-l border-[#DCDFE4] pl-6 pt-1 xl:block">
          <p className="text-xs font-semibold text-[#172B4D]">In this document</p>
          <ul className="mt-2.5 space-y-1.5 border-l border-[#DCDFE4] pl-3">
            {headings.map((heading, index) => (
              <li key={index} className="truncate text-xs text-[#5E6C84]">
                {heading}
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}

/** The space homepage: the space's own name and a plain description of what
 * it actually is, then the page tree rendered as chaptered contents — the
 * thing a plain "pick a page on the left" placeholder never gave a group
 * landing on this stage cold. */
function DocsHome({
  stage,
  sections,
  opened,
  onNavigate,
}: {
  stage: Stage;
  sections: [string, EvidenceItem[]][];
  opened: Set<string>;
  onNavigate: (id: string) => void;
}) {
  return (
    <article className="mx-auto max-w-3xl px-1 py-8 sm:px-2">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0C66E4] text-lg font-bold text-white"
        >
          {stage.chrome.trim().charAt(0).toUpperCase() || "W"}
        </span>
        <h1 className="text-[28px] font-bold leading-tight text-[#172B4D]">{stage.chrome}</h1>
      </div>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#44546F]">
        This space is edited directly by the people doing the work — pages go out with shorthand, open
        questions and the occasional strong opinion, the way a working engineering wiki actually reads.
        Start with a page below, or use the tree on the left.
      </p>
      <div className="mt-10 space-y-7">
        {sections.map(([label, items]) => (
          <div key={label}>
            <p className="text-sm font-semibold text-[#172B4D]">{label}</p>
            <ul className="mt-2 space-y-1.5">
              {items.map((item) => {
                const isUnread = !opened.has(item.id);
                return (
                  <li key={item.id} className="flex items-center gap-2">
                    <KindBadge kind={item.kind} />
                    <button
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className={`truncate text-left text-sm text-[#0C66E4] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C66E4] ${
                        isUnread ? "font-semibold" : ""
                      }`}
                    >
                      {item.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}

/** A Confluence-shaped wiki: a light global top bar, a plain-grounded space
 * sidebar with a kind-coded page tree (rather than a dark ReadTheDocs-style
 * rail), and white content pages chained together with a previous/next pager
 * — deliberately not the DASC513 navy/coral/teal brand, so it reads as an
 * actual hosted wiki space. */
export function WikiPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;
  const sections = groupBySection(stage.evidence);
  const flat = sections.flatMap(([, items]) => items);
  const selectedIndex = selected ? flat.findIndex((item) => item.id === selected.id) : -1;
  const selectedSection = selected ? sections.find(([, items]) => items.includes(selected))?.[0] ?? "" : "";

  function select(id: string) {
    setSelectedId(id);
    setMobileNavOpen(false);
    onOpen(id);
  }

  const spaceRail = (
    <nav className="flex h-full flex-col py-3 text-sm">
      <button
        type="button"
        onClick={() => {
          setSelectedId(null);
          setMobileNavOpen(false);
        }}
        className={`mx-2 mb-2 flex items-center gap-2 rounded px-2.5 py-2 text-left text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C66E4] ${
          selected ? "text-[#44546F] hover:bg-[#EBECF0]" : "bg-[#E9F2FF] text-[#0C66E4]"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
          <path d="M2 7.5L8 2l6 5.5M4 6.5V14h8V6.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
        Space overview
      </button>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {sections.map(([label, items]) => (
          <div key={label} className="py-1.5">
            <p className="px-2.5 py-1 text-[11px] font-semibold text-[#8993A4]">{label}</p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const isSelected = selectedId === item.id;
                const isUnread = !opened.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => select(item.id)}
                      className={`flex w-full items-center gap-2 truncate rounded px-2.5 py-1.5 text-left text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C66E4] ${
                        isSelected
                          ? "bg-[#E9F2FF] font-semibold text-[#0C66E4]"
                          : isUnread
                            ? "font-medium text-[#172B4D] hover:bg-[#EBECF0]"
                            : "text-[#5E6C84] hover:bg-[#EBECF0]"
                      }`}
                    >
                      <KindBadge kind={item.kind} />
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      <ListDetailShell
        containerClassName="bg-white"
        detailClassName="bg-white"
        headerBar={
          <header className="flex items-center gap-3 border-b border-[#DCDFE4] bg-white px-5 py-2.5 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open space navigation"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#44546F] hover:bg-[#EBECF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C66E4] md:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <span
              aria-hidden
              className="hidden h-7 w-7 shrink-0 items-center justify-center rounded bg-[#0C66E4] text-white md:flex"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 3.5h12M2 8h12M2 12.5h8" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <h1 className="min-w-0 truncate text-sm font-bold text-[#172B4D]">{stage.chrome}</h1>
            <div className="ml-auto hidden min-w-0 max-w-xs flex-1 items-center gap-2 rounded bg-[#F1F2F4] px-3 py-1.5 text-[#7A869A] sm:flex">
              <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden className="shrink-0">
                <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.3" />
                <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="truncate text-xs">Search this space</span>
            </div>
          </header>
        }
        railWidthClassName="md:w-64"
        railClassName="bg-[#F7F8F9]"
        rail={spaceRail}
        detail={
          selected ? (
            <DocsPage
              item={selected}
              section={selectedSection}
              spaceName={stage.chrome}
              prev={selectedIndex > 0 ? flat[selectedIndex - 1] : null}
              next={selectedIndex >= 0 && selectedIndex < flat.length - 1 ? flat[selectedIndex + 1] : null}
              onNavigate={select}
            />
          ) : (
            <DocsHome stage={stage} sections={sections} opened={opened} onNavigate={select} />
          )
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← Space overview"
      />
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-label="Space navigation">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)} />
          <div className="relative h-full w-72 max-w-[80vw] overflow-y-auto bg-[#F7F8F9] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close space navigation"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded text-[#44546F] hover:bg-[#EBECF0]"
            >
              ✕
            </button>
            {spaceRail}
          </div>
        </div>
      ) : null}
      <BackLink slug={session.slug} />
    </>
  );
}
