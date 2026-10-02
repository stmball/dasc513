"use client";

import { useState } from "react";
import type { EvidenceItem } from "@/lib/types";
import { DocumentBody, DocumentHeader, DocumentTable } from "../document/DocumentChrome";
import { GridDetailShell } from "./GridDetailShell";
import { BackLink } from "./BackLink";
import { Inline } from "../Inline";
import type { FormatPageProps } from "./types";

const NAV_LINKS = ["Product", "Trust & compliance", "Contact"];

function snippet(item: EvidenceItem): string {
  const first = item.body[0]?.replace(/[*_`]/g, "") ?? "";
  return first.length > 110 ? `${first.slice(0, 110)}…` : first;
}

/** A modern SaaS marketing site: an indigo/violet gradient hero, big rounded
 * CTA buttons, a clean white feature grid — deliberately not the DASC513
 * navy/coral/teal brand, so it reads as an actual product site. */
export function BrochurePage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;

  function select(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  return (
    <>
      <GridDetailShell
        containerClassName="bg-white"
        backButtonClassName="text-slate-500 hover:text-slate-900"
        headerBar={
          <>
            <nav className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
              <span className="text-sm font-bold text-indigo-700">{stage.chrome}</span>
              <span className="hidden gap-6 text-xs font-semibold text-slate-500 sm:flex">
                {NAV_LINKS.map((link) => (
                  <span key={link} className="cursor-default">
                    {link}
                  </span>
                ))}
              </span>
            </nav>
            <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-16 text-center sm:px-6">
              <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                <Inline text={stage.teaser} />
              </h1>
              {stage.intro[0] ? (
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80">
                  <Inline text={stage.intro[0]} />
                </p>
              ) : null}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <span className="cursor-default select-none rounded-full bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-lg">
                  Request a demo
                </span>
                <span className="cursor-default select-none rounded-full border border-white/60 px-5 py-2.5 text-sm font-bold text-white">
                  See it in action
                </span>
              </div>
            </div>
          </>
        }
        grid={
          <div className="grid gap-4 sm:grid-cols-2">
            {stage.evidence.map((item, index) => {
              const isUnread = !opened.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item.id)}
                  className="flex flex-col items-start rounded-xl border border-slate-200 bg-white px-5 py-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span
                    aria-hidden
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white"
                  >
                    {index + 1}
                  </span>
                  <h3
                    className={`mt-3 text-sm font-bold leading-snug ${isUnread ? "text-slate-900" : "text-slate-600"}`}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{item.source}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{snippet(item)}</p>
                  <span className="mt-3 text-xs font-semibold text-indigo-600">
                    Read more →
                  </span>
                </button>
              );
            })}
          </div>
        }
        detail={
          selected ? (
            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
