"use client";

import { useState } from "react";
import type { EvidenceItem, EvidenceKind, Stage } from "@/lib/types";
import { DocumentBody, DocumentTable } from "../document/DocumentChrome";
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

/** Groups a stage's evidence into sidebar chapters, in the order each
 * chapter is first encountered — so a stage dominated by engineering pages
 * leads with engineering chapters, the way a real docs toctree reflects
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

/** One docs page: a Sphinx-style breadcrumb, a plain title and byline (no
 * avatars, no likes — a docs site reports who last touched a page as a
 * build artefact, not a social feed), the kind-specific body, and the
 * signature RTD previous/next pager chaining every page in the stage into
 * one book. `DocumentHeader`'s own kind-chrome (a memo letterhead, a code
 * terminal, a dashed ticket stub…) is deliberately not used here: dropped
 * onto a docs page it reads as a different app entirely, so only the
 * kind-specific *body* shape (`DocumentBody`) is reused. */
function DocsPage({
  item,
  section,
  projectName,
  prev,
  next,
  onNavigate,
}: {
  item: EvidenceItem;
  section: string;
  projectName: string;
  prev: EvidenceItem | null;
  next: EvidenceItem | null;
  onNavigate: (id: string) => void;
}) {
  return (
    <article className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <nav className="text-xs text-slate-500">
          <span className="text-[#2980B9]">{projectName}</span>
          <span aria-hidden className="mx-1.5 text-slate-400">
            »
          </span>
          <span className="text-[#2980B9]">{section}</span>
          <span aria-hidden className="mx-1.5 text-slate-400">
            »
          </span>
          <span>{item.title}</span>
        </nav>
        <h1 className="mt-3 border-b border-slate-200 pb-4 text-[28px] font-bold leading-snug text-slate-900">
          {item.title}
        </h1>
        <p className="mt-4 text-xs italic text-slate-500">
          {item.source}
          {item.date ? ` · last updated ${item.date}` : ""}
        </p>
        <div className="pt-6">
          <DocumentBody item={item} />
          <DocumentTable item={item} />
        </div>
      </div>
      <div className="flex items-stretch justify-between gap-3 border-t border-slate-200 px-6 py-4 text-sm sm:px-10">
        {prev ? (
          <button
            type="button"
            onClick={() => onNavigate(prev.id)}
            className="min-w-0 max-w-[48%] rounded border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:border-[#2980B9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2980B9]"
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              ← Previous
            </span>
            <span className="block truncate text-xs font-semibold text-[#2980B9]">{prev.title}</span>
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button
            type="button"
            onClick={() => onNavigate(next.id)}
            className="ml-auto min-w-0 max-w-[48%] rounded border border-slate-200 bg-slate-50 px-3 py-2 text-right hover:border-[#2980B9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2980B9]"
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Next →
            </span>
            <span className="block truncate text-xs font-semibold text-[#2980B9]">{next.title}</span>
          </button>
        ) : (
          <span />
        )}
      </div>
    </article>
  );
}

/** The docs homepage: project title, the blurb every real docs site opens
 * with, and the toctree itself rendered as a chaptered contents list —
 * the thing a plain "pick a page on the left" placeholder never gave a
 * group landing on this stage cold. */
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
    <article className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#2980B9]">Documentation</p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight text-slate-900">{stage.chrome}</h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Internal engineering space — architecture notes, decision records, open tickets, and whatever
        else needed a home. Nothing on this page was written for a customer, so expect shorthand, not
        prose. Start with a chapter below, or use the sidebar.
      </p>
      <h2 className="mt-10 border-b border-slate-200 pb-2 text-lg font-bold text-slate-900">Contents</h2>
      <div className="mt-4 space-y-6">
        {sections.map(([label, items]) => (
          <div key={label}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
            <ul className="mt-2 space-y-1.5 border-l border-slate-200 pl-4">
              {items.map((item) => {
                const isUnread = !opened.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className={`text-left text-sm text-[#2980B9] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2980B9] ${
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

/** A Read the Docs-shaped wiki: a dark fixed sidebar with a toctree grouped
 * into chapters, a disabled search box, and plain white-paper content pages
 * chained together with a previous/next pager and a project homepage —
 * deliberately not the DASC513 navy/coral/teal brand, so it reads as an
 * actual hosted documentation site. */
export function WikiPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;
  const sections = groupBySection(stage.evidence);
  const flat = sections.flatMap(([, items]) => items);
  const selectedIndex = selected ? flat.findIndex((item) => item.id === selected.id) : -1;
  const selectedSection = selected ? sections.find(([, items]) => items.includes(selected))?.[0] ?? "" : "";

  function select(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  return (
    <>
      <ListDetailShell
        containerClassName="bg-white"
        detailClassName="bg-white"
        headerBar={
          <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-5 py-3 sm:px-6 md:hidden">
            <span
              aria-hidden
              className="flex h-6 w-6 items-center justify-center rounded bg-[#2980B9] text-xs font-bold text-white"
            >
              ⌘
            </span>
            <h1 className="text-sm font-bold text-slate-900">{stage.chrome}</h1>
          </header>
        }
        railWidthClassName="md:w-64"
        railClassName="bg-[#343131]"
        rail={
          <nav className="flex h-full flex-col text-sm">
            <div className="bg-[#2980B9] px-4 py-4">
              <p className="text-sm font-bold text-white">{stage.chrome}</p>
              <input
                type="text"
                disabled
                placeholder="Search docs"
                className="mt-3 w-full cursor-default rounded border-0 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className={`border-b border-white/10 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2980B9] ${
                selected ? "text-white/60 hover:text-white" : "bg-[#3c3c3c] text-white"
              }`}
            >
              ⌂ Docs home
            </button>
            <div className="flex-1 overflow-y-auto py-3">
              {sections.map(([label, items]) => (
                <div key={label} className="px-4 py-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">{label}</p>
                  <ul className="mt-1 space-y-0.5">
                    {items.map((item) => {
                      const isSelected = selectedId === item.id;
                      const isUnread = !opened.has(item.id);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => select(item.id)}
                            className={`block w-full truncate rounded-sm px-2 py-1 text-left text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2980B9] ${
                              isSelected
                                ? "bg-[#4e4a4a] text-white"
                                : isUnread
                                  ? "text-white/90 hover:bg-white/5 hover:text-white"
                                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
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
          </nav>
        }
        detail={
          selected ? (
            <DocsPage
              item={selected}
              section={selectedSection}
              projectName={stage.chrome}
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
        backLabel="← Docs home"
      />
      <BackLink slug={session.slug} />
    </>
  );
}
