"use client";

import { useState } from "react";
import type { EvidenceItem } from "@/lib/types";
import { DocumentBody, DocumentHeader, DocumentTable } from "../document/DocumentChrome";
import { GridDetailShell } from "./GridDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

function snippet(item: EvidenceItem): string {
  const first = item.body[0]?.replace(/[*_`]/g, "") ?? "";
  return first.length > 140 ? `${first.slice(0, 140)}…` : first;
}

/** An editorial, Substack-shaped blog: warm off-white paper, black serif-
 * weight headlines, a single amber accent for links — deliberately not the
 * DASC513 navy/coral/teal brand, so it reads as an actual public blog. */
export function BlogPage({ session, gate, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = gate.evidence.find((item) => item.id === selectedId) ?? null;
  const [featured, ...rest] = gate.evidence;

  function select(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  function renderPostCard(item: EvidenceItem, isFeatured?: boolean) {
    const isComment = item.kind === "forum";
    const isUnread = !opened.has(item.id);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => select(item.id)}
        className={`block w-full rounded border px-5 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 ${
          isComment
            ? "border-dashed border-stone-300 bg-stone-100"
            : "border-stone-200 bg-white hover:border-stone-400"
        }`}
      >
        {isComment ? (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            Reader comment
          </p>
        ) : null}
        <h3
          className={`${isFeatured ? "text-2xl" : "text-lg"} font-bold leading-snug text-stone-900 ${isUnread ? "" : "text-stone-600"}`}
        >
          {item.title}
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          {item.source}
          {item.date ? ` · ${item.date}` : ""}
        </p>
        <p className={`mt-2 text-sm leading-relaxed text-stone-700 ${isFeatured ? "" : "line-clamp-2"}`}>
          {snippet(item)}
        </p>
        <span className="mt-3 inline-block text-xs font-semibold text-amber-700">
          {isComment ? "Read the reply →" : "Read the post →"}
        </span>
      </button>
    );
  }

  return (
    <>
      <GridDetailShell
        containerClassName="bg-[#faf7f2]"
        backButtonClassName="text-stone-500 hover:text-stone-900"
        headerBar={
          <header className="border-b border-stone-300 bg-[#faf7f2] px-4 py-10 text-center sm:px-6">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {gate.chrome}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm italic text-stone-600">{gate.teaser}</p>
          </header>
        }
        grid={
          <div className="space-y-4">
            {featured ? renderPostCard(featured, true) : null}
            {rest.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {rest.map((item) => renderPostCard(item))}
              </div>
            ) : null}
          </div>
        }
        detail={
          selected ? (
            <article className="rounded border border-stone-200 bg-white p-6 sm:p-8">
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
        backLabel="← Back to the front page"
      />
      <BackLink slug={session.slug} />
    </>
  );
}
