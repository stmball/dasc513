"use client";

import { useState } from "react";
import { Source_Serif_4 } from "next/font/google";
import type { EvidenceItem, EvidenceKind, Stage } from "@/lib/types";
import { DocumentBody, DocumentTable, hashId } from "../document/DocumentChrome";
import { GridDetailShell } from "./GridDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** A real newsroom serif, not the browser's generic `font-serif` fallback
 * (Georgia on one platform, Times on another) and not Poppins, which this
 * page would otherwise quietly inherit from the app shell around it. Applied
 * once, on the page's own container, so every paragraph `DocumentChrome`
 * renders inherits it too without that shared file needing to know. */
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

/** A plain system sans, reserved for the page's own interface chrome (meta
 * lines, the subscribe box, the back button) so it reads against the serif
 * body copy the way a real site's UI font contrasts with its editorial one —
 * the same two-typeface pairing a paper itself uses, not a styling flourish. */
const UI_FONT = "font-[system-ui]";

/** The masthead's one signature colour — a deep editorial ink, doing the job
 * a broadsheet's red nameplate rule does. Deliberately not the cream-plus-
 * terracotta pairing this format has to avoid, and not any of the DASC513
 * brand's own navy/coral/teal. */
const INK = "#7a2433";

/** Byline-avatar colours — a different small rotating palette from the one
 * DocumentChrome uses for message avatars, so a blog contributor's initial
 * doesn't accidentally match an email sender's. */
const BYLINE_COLORS = [
  "bg-red-700",
  "bg-slate-700",
  "bg-amber-700",
  "bg-sky-700",
  "bg-violet-700",
  "bg-emerald-700",
];

function bylineColor(id: string): string {
  return BYLINE_COLORS[hashId(id) % BYLINE_COLORS.length];
}

/**
 * The outlet's own section taxonomy — "Investigation", "Dispatch", "Reader
 * comments" — rather than the developer-facing `EvidenceKind` name, each
 * with its own ink. A real publication tags every piece with the section it
 * ran in; this is that device, doing double duty as the one thing that
 * makes the index read as an edited site rather than one template with a
 * label swapped onto every card.
 */
const KIND_TAG: Record<EvidenceKind, { label: string; bg: string }> = {
  report: { label: "Investigation", bg: INK },
  dataset: { label: "Data analysis", bg: "#35506b" },
  press: { label: "Dispatch", bg: "#8a6d1d" },
  forum: { label: "Reader comments", bg: "#5b4a6f" },
  email: { label: "Disclosed correspondence", bg: "#3a3f4b" },
  policy: { label: "Policy document", bg: "#6b5a3e" },
  transcript: { label: "Transcript", bg: "#44584c" },
  memo: { label: "Internal document", bg: "#55524a" },
  code: { label: "Technical note", bg: "#4a4470" },
  ticket: { label: "Service log", bg: "#6e4a3a" },
};

function Tag({ kind }: { kind: EvidenceKind }) {
  const tag = KIND_TAG[kind];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[11px] font-semibold text-white ${UI_FONT}`}
      style={{ backgroundColor: tag.bg }}
    >
      {tag.label}
    </span>
  );
}

function snippet(item: EvidenceItem, max: number): string {
  const first = item.body[0]?.replace(/[*_`]/g, "") ?? "";
  return first.length > max ? `${first.slice(0, max)}…` : first;
}

/** A rough, honest "N min read" — word count over a newsroom-standard 200
 * words per minute, floored at one minute. */
function readMinutes(item: EvidenceItem): number {
  const words = item.body.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** A forum item's reply count — the same "first paragraph is the opening
 * post, the rest are replies" convention DocumentChrome's own ForumBody
 * uses, so the count agrees with what the article itself renders. */
function replyCount(item: EvidenceItem): number {
  return Math.max(item.body.length - 1, 0);
}

/** Splits a stage's `chrome` string ("Site name — tagline") into its parts;
 * falls back to the whole string as the name if there's no dash. The
 * tagline is the one piece of masthead copy that's actually in-world (a real
 * site's own self-description) — unlike `stage.teaser`, which is written for
 * the player, not by the blog, and so never appears inside the page itself. */
function parseChrome(chrome: string): { name: string; tagline?: string } {
  const i = chrome.indexOf(" — ");
  if (i === -1) return { name: chrome };
  return { name: chrome.slice(0, i), tagline: chrome.slice(i + 3) };
}

/** A post's byline meta: source, date, read time, and — for a reader-comment
 * thread — how many replies, instead of a category label. */
function MetaLine({ item }: { item: EvidenceItem }) {
  const replies = item.kind === "forum" ? replyCount(item) : null;
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 ${UI_FONT}`}>
      <span className="font-semibold text-stone-600">{item.source}</span>
      {item.date ? (
        <>
          <span aria-hidden>·</span>
          <span>{item.date}</span>
        </>
      ) : null}
      <span aria-hidden>·</span>
      {replies !== null ? (
        <span>{replies} {replies === 1 ? "reply" : "replies"}</span>
      ) : (
        <span>{readMinutes(item)} min read</span>
      )}
    </div>
  );
}

function PostPreview({
  item,
  isFeatured,
  isUnread,
  onSelect,
}: {
  item: EvidenceItem;
  isFeatured?: boolean;
  isUnread: boolean;
  onSelect: (id: string) => void;
}) {
  const isReaderThread = item.kind === "forum";
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
        isReaderThread ? "border-l-4 border-[#5b4a6f] bg-stone-100/60 px-5 py-4" : ""
      }`}
    >
      <Tag kind={item.kind} />
      <h3
        className={`mt-2 font-bold leading-tight text-stone-900 group-hover:underline ${
          isFeatured ? "text-3xl sm:text-4xl" : "text-lg"
        } ${isUnread ? "" : "text-stone-500"}`}
      >
        {item.title}
      </h3>
      <p className={`mt-2 leading-relaxed text-stone-700 ${isFeatured ? "text-base" : "text-sm line-clamp-2"}`}>
        {snippet(item, isFeatured ? 220 : 130)}
      </p>
      <div className="mt-3">
        <MetaLine item={item} />
      </div>
    </button>
  );
}

function Sidebar({
  stage,
  opened,
  onSelect,
}: {
  stage: Stage;
  opened: Set<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="space-y-7">
      <div className="rounded-sm p-5" style={{ backgroundColor: "#f3ece7" }}>
        <p className={`text-sm font-bold text-stone-800 ${UI_FONT}`}>Get new posts by email</p>
        <p className={`mt-1.5 text-[13px] leading-relaxed text-stone-600 ${UI_FONT}`}>
          Straight to your inbox — no more often than this site actually publishes.
        </p>
        <div className="mt-3 flex gap-1.5">
          <input
            type="email"
            disabled
            placeholder="you@nhs.net"
            className={`w-full min-w-0 cursor-default rounded-sm border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-400 ${UI_FONT}`}
          />
          <span
            className={`shrink-0 cursor-default select-none rounded-sm px-3 py-1.5 text-xs font-bold text-white ${UI_FONT}`}
            style={{ backgroundColor: INK }}
          >
            Sign up
          </span>
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between border-b-2 border-stone-900 pb-2">
          <p className={`text-sm font-bold text-stone-900 ${UI_FONT}`}>All posts</p>
          <span className={`text-xs text-stone-400 ${UI_FONT}`}>{stage.evidence.length}</span>
        </div>
        <ol className="mt-1 divide-y divide-stone-200">
          {stage.evidence.map((item) => {
            const isUnread = !opened.has(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="group flex w-full items-start gap-2.5 py-2.5 text-left focus:outline-none"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: KIND_TAG[item.kind].bg }}
                  />
                  <span
                    className={`text-[13px] leading-snug group-hover:underline ${
                      isUnread ? "font-semibold text-stone-900" : "text-stone-500"
                    }`}
                  >
                    {item.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

function Article({ item }: { item: EvidenceItem }) {
  const initial = item.source.trim().charAt(0).toUpperCase() || "?";
  return (
    <article>
      <Tag kind={item.kind} />
      <h1 className="mt-3 text-2xl font-bold leading-tight text-stone-900 sm:text-3xl">
        {item.title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-stone-500">
        <span
          aria-hidden
          className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white ${bylineColor(item.id)}`}
        >
          {initial}
        </span>
        <MetaLine item={item} />
      </div>
      <div className="mt-6 border-t border-stone-200 pt-6">
        <DocumentBody item={item} />
        <DocumentTable item={item} />
      </div>
    </article>
  );
}

/** An independent digital-journalism outlet — a plain nameplate (name plus
 * the site's own in-world tagline) and a river of posts, not a card grid —
 * deliberately not the DASC513 navy/coral/teal brand, so it reads as an
 * actual publication. Every piece carries the outlet's own section tag
 * (Investigation, Dispatch, Data analysis, Reader comments…), the one
 * device that ties the whole site together. There's no masthead nav bar:
 * this isn't a multi-section publication, so a strip of decorative category
 * links would just be furniture that doesn't go anywhere — the posts and
 * the (functioning) index in the rail are the only navigation the page
 * needs. */
export function BlogPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;
  const [featured, ...rest] = stage.evidence;
  const { name, tagline } = parseChrome(stage.chrome);

  function select(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  return (
    <>
      <GridDetailShell
        containerClassName={`bg-[#faf7f2] ${serif.className}`}
        backButtonClassName={`text-stone-500 hover:text-stone-900 ${UI_FONT}`}
        headerBar={
          <header className="border-b border-stone-300 bg-[#faf7f2] px-4 py-10 text-center sm:px-6">
            <div className="mx-auto max-w-2xl">
              <h1 className="text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">
                {name}
              </h1>
              <span aria-hidden className="mx-auto mb-3 mt-4 block h-[3px] w-14" style={{ backgroundColor: INK }} />
              {tagline ? (
                <p className="italic leading-relaxed text-stone-600">{tagline}</p>
              ) : null}
            </div>
          </header>
        }
        grid={
          <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
            <div>
              {featured ? (
                <PostPreview
                  item={featured}
                  isFeatured
                  isUnread={!opened.has(featured.id)}
                  onSelect={select}
                />
              ) : null}
              {rest.length ? (
                <>
                  <hr aria-hidden className="my-8 border-t border-stone-300" />
                  <div className="divide-y divide-stone-200">
                    {rest.map((item) => (
                      <div key={item.id} className="py-6 first:pt-0 last:pb-0">
                        <PostPreview item={item} isUnread={!opened.has(item.id)} onSelect={select} />
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <Sidebar stage={stage} opened={opened} onSelect={select} />
          </div>
        }
        detail={
          selected ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
              <Article item={selected} />
              <Sidebar stage={stage} opened={opened} onSelect={select} />
            </div>
          ) : null
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← Back to the front page"
      />
      <footer className={`border-t border-stone-300 bg-[#faf7f2] px-4 py-6 text-center text-[11px] text-stone-400 sm:px-6 ${UI_FONT}`}>
        {name} · {stage.evidence.length} pieces published so far
      </footer>
      <BackLink slug={session.slug} />
    </>
  );
}
