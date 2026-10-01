"use client";

import { useState } from "react";
import type { EvidenceItem, Gate } from "@/lib/types";
import { DocumentBody, DocumentTable, hashId } from "../document/DocumentChrome";
import { GridDetailShell } from "./GridDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

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

/** Splits a gate's `chrome` string ("Site name — tagline") into its parts;
 * falls back to the whole string as the name if there's no dash. The
 * tagline is the one piece of masthead copy that's actually in-world (a real
 * site's own self-description) — unlike `gate.teaser`, which is written for
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
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
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
        isReaderThread ? "rounded border border-amber-200 bg-amber-50/50 px-5 py-4" : ""
      }`}
    >
      <h3
        className={`font-serif font-bold leading-tight text-stone-900 group-hover:underline ${
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
  gate,
  opened,
  onSelect,
}: {
  gate: Gate;
  opened: Set<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="space-y-6">
      <div className="rounded border border-stone-300 bg-white p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
          Subscribe
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-stone-600">
          New posts, straight to your inbox.
        </p>
        <div className="mt-3 flex gap-1.5">
          <input
            type="email"
            disabled
            placeholder="you@nhs.net"
            className="w-full min-w-0 cursor-default rounded border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-400"
          />
          <span className="shrink-0 cursor-default select-none rounded bg-stone-900 px-3 py-1.5 text-xs font-bold text-white">
            Join
          </span>
        </div>
      </div>
      <div className="rounded border border-stone-300 bg-white p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
          Archive · {gate.evidence.length} posts
        </p>
        <ol className="mt-2 space-y-2.5">
          {gate.evidence.map((item, index) => {
            const isUnread = !opened.has(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="group flex w-full gap-2 text-left focus:outline-none"
                >
                  <span className="numeric mt-0.5 shrink-0 text-[11px] font-bold text-stone-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
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
    <article className="border border-stone-300 bg-white">
      <div className="border-b border-stone-200 px-6 pb-5 pt-6 sm:px-10 sm:pt-10">
        <h1 className="font-serif text-2xl font-bold leading-tight text-stone-900 sm:text-3xl">
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
      </div>
      <div className="px-6 py-6 sm:px-10 sm:py-8">
        <DocumentBody item={item} />
        <DocumentTable item={item} />
      </div>
    </article>
  );
}

/** An editorial news/opinion site — a plain nameplate (name plus the site's
 * own in-world tagline, nothing the page itself narrates to the player) and
 * a river of posts, not a card grid — deliberately not the DASC513 navy/
 * coral/teal brand, so it reads as an actual independent outlet. There's no
 * masthead nav bar: this isn't a multi-section publication, so a strip of
 * decorative category links would just be furniture that doesn't go
 * anywhere — the posts and the (functioning) archive list in the rail are
 * the only navigation the page needs. */
export function BlogPage({ session, gate, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = gate.evidence.find((item) => item.id === selectedId) ?? null;
  const [featured, ...rest] = gate.evidence;
  const { name, tagline } = parseChrome(gate.chrome);

  function select(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  return (
    <>
      <GridDetailShell
        containerClassName="bg-[#faf7f2]"
        backButtonClassName="text-stone-500 hover:text-stone-900"
        headerBar={
          <header className="border-b border-stone-300 bg-[#faf7f2] px-4 py-10 text-center sm:px-6">
            <div className="mx-auto max-w-2xl">
              <span aria-hidden className="mx-auto mb-3 block h-[3px] w-16 bg-stone-900" />
              <h1 className="font-serif text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">
                {name}
              </h1>
              {tagline ? (
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                  {tagline}
                </p>
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
            <Sidebar gate={gate} opened={opened} onSelect={select} />
          </div>
        }
        detail={
          selected ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
              <Article item={selected} />
              <Sidebar gate={gate} opened={opened} onSelect={select} />
            </div>
          ) : null
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← Back to the front page"
      />
      <footer className="border-t border-stone-300 bg-[#faf7f2] px-4 py-6 text-center text-[11px] text-stone-400 sm:px-6">
        {name} · {gate.evidence.length} pieces published so far
      </footer>
      <BackLink slug={session.slug} />
    </>
  );
}
