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
export function ChatPage({ session, gate, opened, onOpen }: FormatPageProps) {
  const firstId = gate.evidence[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstId);
  const selected = gate.evidence.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (firstId) onOpen(firstId);
    // Only on mount, for the channel opened by default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(id: string) {
    setSelectedId(id);
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
              {gate.evidence.map((item) => {
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
                <TranscriptBody item={selected} />
                <DocumentTable item={selected} />
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
      <BackLink slug={session.slug} />
    </>
  );
}
