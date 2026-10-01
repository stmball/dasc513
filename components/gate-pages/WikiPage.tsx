"use client";

import { useState } from "react";
import { DocumentReader } from "../document/DocumentChrome";
import { ListDetailShell } from "./ListDetailShell";
import { BackLink } from "./BackLink";
import { Inline } from "../Inline";
import type { FormatPageProps } from "./types";

/** A Confluence-shaped wiki: a blue accent, a page tree down the left, a
 * search box that does nothing — deliberately not the DASC513 navy/coral/
 * teal brand, so it reads as an actual internal wiki. */
export function WikiPage({ session, gate, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = gate.evidence.find((item) => item.id === selectedId) ?? null;

  function select(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  return (
    <>
      <ListDetailShell
        containerClassName="bg-white"
        detailClassName="bg-slate-50"
        headerBar={
          <header className="border-b border-slate-200 bg-[#0052CC] px-5 py-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center rounded bg-white text-sm font-bold text-[#0052CC]"
                >
                  W
                </span>
                <h1 className="text-base font-bold text-white">{gate.chrome}</h1>
              </div>
              <input
                type="text"
                disabled
                placeholder="Search this wiki…"
                className="w-full max-w-[220px] cursor-default rounded border border-white/30 bg-white/10 px-3 py-1.5 text-xs text-white placeholder:text-white/60"
              />
            </div>
          </header>
        }
        railClassName="border-r border-slate-200 bg-slate-50"
        rail={
          <nav className="p-2 text-sm">
            <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {gate.evidence.length} pages
            </p>
            <ul>
              {gate.evidence.map((item) => {
                const isSelected = selectedId === item.id;
                const isUnread = !opened.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => select(item.id)}
                      className={`flex w-full items-start gap-2 rounded px-2 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC] ${
                        isSelected ? "bg-[#deebff] text-[#0052CC]" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span aria-hidden className="mt-0.5 text-slate-400">
                        ▤
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm ${isUnread ? "font-bold" : "font-medium"} ${isSelected ? "text-[#0052CC]" : "text-slate-800"}`}
                        >
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {item.source}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        }
        detail={
          selected ? (
            <DocumentReader item={selected} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0052CC]">
                {gate.chrome} · space home
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">{gate.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
                {gate.intro.map((paragraph, i) => (
                  <p key={i}>
                    <Inline text={paragraph} />
                  </p>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Pick a page on the left to start reading.
              </p>
            </div>
          )
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← All pages"
      />
      <BackLink slug={session.slug} />
    </>
  );
}
