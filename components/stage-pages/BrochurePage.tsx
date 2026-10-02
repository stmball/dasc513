"use client";

import { useState } from "react";
import { Space_Grotesk } from "next/font/google";
import type { EvidenceItem, EvidenceKind } from "@/lib/types";
import { DocumentBody, DocumentHeader, DocumentTable } from "../document/DocumentChrome";
import { GridDetailShell } from "./GridDetailShell";
import { BackLink } from "./BackLink";
import { Inline } from "../Inline";
import type { FormatPageProps } from "./types";

/** A quirky, squared-off grotesk — the "developer-tool SaaS" register, not
 * Poppins (which this page would otherwise quietly inherit from the app
 * shell) and not a second display face layered on top of it. Applied once,
 * on the page's own container, so the shared `DocumentChrome` reading pane
 * inherits it too. */
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** The marketing voice's own section badge for a tile — distinct from
 * DocumentChrome's neutral `KIND_LABEL`, because this is copy the vendor's
 * own site would actually print on a card, not a developer-facing kind
 * name. Falls back to "Update" for a kind this site has no better word for. */
const KIND_BADGE: Partial<Record<EvidenceKind, string>> = {
  press: "Update",
  policy: "Security",
  dataset: "By the numbers",
  report: "Report",
  email: "Correspondence",
  memo: "Memo",
  ticket: "Support",
  transcript: "Transcript",
  code: "Technical",
  forum: "Community",
};

function snippet(item: EvidenceItem): string {
  const first = item.body[0]?.replace(/[*_`]/g, "") ?? "";
  return first.length > 110 ? `${first.slice(0, 110)}…` : first;
}

/** A paragraph authored as `**Lead.** rest` splits into a headline and its
 * follow-on sentence — the same shape a real landing page's hero actually
 * has. Kept local rather than imported from `DocumentChrome`, which doesn't
 * export it: the two files are allowed to duplicate a four-line regex,
 * they're not allowed to import each other's internals. */
function splitLead(paragraph: string): { lead: string; rest: string } | null {
  const m = /^\*\*([^*]+)\*\*\s*([\s\S]*)$/.exec(paragraph.trim());
  if (!m) return null;
  return { lead: m[1], rest: m[2] };
}

/** The hero's headline and sub-line, read straight off the stage's first
 * evidence item (its landing page, by convention) rather than off
 * `stage.teaser` — the teaser is written for the player and is never copy
 * the vendor's own site would print. Falls back to the teaser/intro only if
 * the landing page isn't authored in the bold-lead shape. */
function heroCopy(
  landing: EvidenceItem | undefined,
  fallbackHeadline: string,
  fallbackSub: string,
): { headline: string; sub: string } {
  const lead = landing ? splitLead(landing.body[0] ?? "") : null;
  if (lead && lead.lead) {
    return { headline: lead.lead, sub: lead.rest || (landing?.body[1] ?? "") };
  }
  return { headline: fallbackHeadline, sub: fallbackSub };
}

/** The first evidence item (after the landing page) whose table is a plain
 * two-column input/value sheet — generic enough to cover "how we calculated
 * your number" tables in general, not just this one vendor's savings
 * calculator — rendered as a stat strip instead of a grid tile. */
function findStatItem(items: EvidenceItem[]): EvidenceItem | undefined {
  return items.find((item) => item.table && item.table.headers.length === 2);
}

type TileVariant = "trust" | "data" | "standard";

function tileVariant(item: EvidenceItem): TileVariant {
  if (item.kind === "policy") return "trust";
  if (item.table) return "data";
  return "standard";
}

/** The hero's one deliberate flourish: a live-looking preview of the
 * product itself — a greyed-out drafted document and a suggested-code chip
 * — grounded only in the session's own generic `subject.product` field, so
 * it's specific to *a* clinical documentation product without being wired
 * to any one session's evidence ids. */
function ProductPreview({ product }: { product: string }) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white text-left shadow-2xl ring-1 ring-black/5 lg:mx-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <span className="text-xs font-semibold text-slate-400">{product} · draft</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          Drafted in 4s
        </span>
      </div>
      <div className="space-y-2.5 px-4 py-4">
        <span aria-hidden className="block h-2.5 w-11/12 rounded-full bg-slate-200" />
        <span aria-hidden className="block h-2.5 w-full rounded-full bg-slate-200" />
        <span aria-hidden className="block h-2.5 w-4/5 rounded-full bg-slate-200" />
        <span aria-hidden className="block h-2.5 w-9/12 rounded-full bg-slate-200" />
        <div className="flex flex-wrap gap-1.5 pt-1.5">
          <span className="rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700">
            Suggested code: J18.9
          </span>
          <span className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">
            Clinician review pending
          </span>
        </div>
      </div>
    </div>
  );
}

/** The site's own "check our working" panel — a row of big stat tiles read
 * straight off a two-column evidence table, plus a link back into that same
 * item's full reading pane. A real SaaS site puts its headline numbers in
 * exactly this shape; here they're never invented, only ever the table's
 * own rows. */
function StatStrip({ item, onOpen }: { item: EvidenceItem; onOpen: () => void }) {
  const table = item.table;
  if (!table) return null;
  return (
    <div className="border-b border-slate-100 bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-10 gap-y-6 text-center">
        {table.rows.slice(0, 4).map((row) => (
          <div key={row[0]}>
            <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{row[1]}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{row[0]}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-center">
        <button
          type="button"
          onClick={onOpen}
          className="rounded text-xs font-semibold text-indigo-600 hover:text-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          See the full workings
        </button>
      </p>
    </div>
  );
}

/** A bento-shaped feature grid: a trust/security item gets a marked-off
 * tile, an item carrying its own table gets a wide one, everything else is
 * a standard tile — varied by what the evidence actually is, not by an
 * arbitrary position in the array, so the grid doesn't read as one card
 * shape repeated with the label swapped. */
function BentoGrid({
  items,
  opened,
  onSelect,
}: {
  items: EvidenceItem[];
  opened: Set<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-flow-row-dense gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const variant = tileVariant(item);
        const isUnread = !opened.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`group flex flex-col items-start rounded-lg px-5 py-5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              variant === "trust"
                ? "border border-slate-200 border-l-4 border-l-indigo-600 bg-slate-50 hover:bg-white"
                : variant === "data"
                  ? "border border-slate-200 bg-white hover:border-indigo-200 sm:col-span-2"
                  : "border border-slate-200 bg-white hover:border-indigo-200"
            }`}
          >
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              {KIND_BADGE[item.kind] ?? "Update"}
            </span>
            <h3
              className={`mt-3 text-sm font-bold leading-snug ${isUnread ? "text-slate-900" : "text-slate-500"}`}
            >
              {item.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{item.source}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{snippet(item)}</p>
            {variant === "data" && item.table ? (
              <p className="mt-3 text-xs font-semibold text-indigo-600">
                {item.table.rows.length} rows of published data
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** A modern SaaS marketing site for one specific product — an indigo/violet
 * gradient hero built around a mocked product preview, a stat strip read
 * straight off the vendor's own published numbers, and a bento-shaped
 * feature grid — deliberately not the DASC513 navy/coral/teal brand, so it
 * reads as an actual product site rather than the teaching tool wearing a
 * costume. */
export function BrochurePage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;

  const [landing, ...restAll] = stage.evidence;
  const statItem = findStatItem(restAll);
  const gridItems = statItem ? restAll.filter((item) => item.id !== statItem.id) : restAll;
  const { headline, sub } = heroCopy(landing, stage.teaser, stage.intro[0] ?? "");

  function select(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  return (
    <>
      <GridDetailShell
        maxWidthClassName="max-w-6xl"
        containerClassName={`bg-white ${grotesk.className}`}
        backButtonClassName="text-slate-500 hover:text-slate-900"
        headerBar={
          <>
            <nav className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
              <span className="truncate text-base font-bold tracking-tight text-indigo-700">
                {stage.chrome}
              </span>
              <span className="hidden items-center gap-6 text-xs font-semibold text-slate-500 md:flex">
                <span className="cursor-default">Platform</span>
                <span className="cursor-default">Security</span>
                <span className="cursor-default">Customers</span>
              </span>
              <span className="shrink-0 cursor-default select-none rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
                Book a demo
              </span>
            </nav>
            <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-14 sm:px-6 sm:py-20">
              <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="text-center lg:text-left">
                  <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                    <Inline text={headline} />
                  </h1>
                  {sub ? (
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base lg:mx-0">
                      <Inline text={sub} />
                    </p>
                  ) : null}
                  <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                    <span className="cursor-default select-none rounded-full bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-lg">
                      Request a demo
                    </span>
                    <span className="cursor-default select-none rounded-full border border-white/60 px-5 py-2.5 text-sm font-bold text-white">
                      See it in action
                    </span>
                  </div>
                </div>
                <ProductPreview product={session.subject.product} />
              </div>
            </div>
            {statItem ? <StatStrip item={statItem} onOpen={() => select(statItem.id)} /> : null}
          </>
        }
        grid={<BentoGrid items={gridItems} opened={opened} onSelect={select} />}
        detail={
          selected ? (
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              <DocumentHeader item={selected} />
              <div className="pt-5">
                <DocumentBody item={selected} />
                <DocumentTable item={selected} />
              </div>
            </article>
          ) : null
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← Back to the overview"
      />
      <BackLink slug={session.slug} />
    </>
  );
}
