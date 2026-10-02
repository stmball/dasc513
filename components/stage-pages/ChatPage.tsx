"use client";

import { useEffect, useState } from "react";
import { DocumentTable, TranscriptBody } from "../document/DocumentChrome";
import { ListDetailShell } from "./ListDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** A Slack-shaped workspace: a dark aubergine sidebar, flat (bubble-free)
 * message rows, a channel header above the thread — deliberately not the
 * DASC513 navy/coral/teal brand, so it reads as an actual chat client.
 * Every item here is a real channel of real messages — nothing sits in the
 * sidebar as a pinned document instead of a conversation. */
export function ChatPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const firstId = stage.evidence[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstId);
  const [tableOpen, setTableOpen] = useState(false);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (firstId) onOpen(firstId);
    // Only on mount, for the channel opened by default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tableOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setTableOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tableOpen]);

  function select(id: string) {
    setSelectedId(id);
    // A table popped out in one channel shouldn't still be open after
    // switching to a different one.
    setTableOpen(false);
    onOpen(id);
  }

  return (
    <>
      <ListDetailShell
        headerBar={<></>}
        containerClassName="bg-white"
        detailClassName="bg-white"
        railClassName="bg-[#3f0e40]"
        railWidthClassName="md:w-64"
        rail={
          <nav className="flex h-full flex-col py-3 text-sm">
            <div className="px-4 pb-3">
              <p className="truncate text-sm font-bold text-white">{session.subject.company}</p>
              <p className="truncate text-[11px] text-white/50">Workspace</p>
            </div>
            <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Channels
            </p>
            <ul>
              {stage.evidence.map((item) => {
                const isSelected = selectedId === item.id;
                const isUnread = !opened.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => select(item.id)}
                      className={`flex w-full items-start gap-2 px-4 py-1.5 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50 ${
                        isSelected ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <span aria-hidden className="mt-0.5 w-3 shrink-0 text-center text-white/50">
                        #
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${isUnread ? "font-bold" : ""} ${isSelected ? "text-white" : ""}`}
                      >
                        {item.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        }
        listWidthClassName="md:w-[300px]"
        detail={
          selected ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-900"># {selected.title}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selected.source}
                  {selected.date ? ` · ${selected.date}` : ""}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto pt-2">
                <TranscriptBody
                  item={selected}
                  onOpenTable={selected.table ? () => setTableOpen(true) : undefined}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Pick a channel on the left.</p>
          )
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← All channels"
      />
      {selected?.table && tableOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setTableOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Shared in #{selected.title}
              </p>
              <button
                type="button"
                onClick={() => setTableOpen(false)}
                aria-label="Close table"
                className="shrink-0 rounded px-1.5 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                ✕
              </button>
            </div>
            <DocumentTable item={selected} />
          </div>
        </div>
      ) : null}
      <BackLink slug={session.slug} />
    </>
  );
}
