"use client";

import { useState } from "react";
import { DocumentReader, EmptyReader, emailPreview } from "../document/DocumentChrome";
import { ListDetailShell } from "./ListDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

const DECORATIVE_FOLDERS = ["Starred", "Sent", "Drafts", "Archived", "Trash"];

const AVATAR_COLORS = [
  "bg-[#1a73e8]",
  "bg-[#d93025]",
  "bg-[#188038]",
  "bg-[#e37400]",
  "bg-[#9334e6]",
  "bg-[#12b5cb]",
];

function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** A Gmail-shaped inbox: white chrome, a blue/red accent, coloured avatar
 * circles per sender, a light-blue selected-row tint — deliberately not the
 * DASC513 navy/coral/teal brand, so it reads as an actual mail client. */
export function InboxPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const unread = stage.evidence.filter((item) => !opened.has(item.id)).length;
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;

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
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d93025] text-sm font-bold text-white"
              >
                M
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{stage.chrome}</p>
                <p className="truncate text-[11px] text-slate-500">{session.subject.company}</p>
              </div>
            </div>
            {unread > 0 ? (
              <span className="shrink-0 rounded-full bg-[#1a73e8] px-2.5 py-1 text-[10px] font-bold text-white">
                {unread} unread
              </span>
            ) : null}
          </header>
        }
        railClassName="border-r border-slate-200 bg-white"
        rail={
          <nav className="p-3 text-sm">
            <p className="flex items-center justify-between rounded-full bg-[#d3e3fd] px-3 py-2 font-semibold text-[#0b57d0]">
              Inbox
              <span className="text-xs">{stage.evidence.length}</span>
            </p>
            <ul className="mt-2 space-y-0.5">
              {DECORATIVE_FOLDERS.map((folder) => (
                <li
                  key={folder}
                  className="cursor-default select-none rounded-full px-3 py-1.5 text-slate-400"
                >
                  {folder}
                </li>
              ))}
            </ul>
          </nav>
        }
        listClassName="border-r border-slate-200"
        list={
          <ul>
            {stage.evidence.map((item) => {
              const isUnread = !opened.has(item.id);
              const isSelected = selectedId === item.id;
              const preview = emailPreview(item);
              const initial = preview.from.trim().charAt(0).toUpperCase() || "?";
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => select(item.id)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-inset ${
                      isSelected ? "bg-[#d3e3fd]" : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(item.id)}`}
                    >
                      {initial}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}
                        >
                          {item.title}
                          {preview.count > 1 ? (
                            <span className="ml-1 font-normal text-slate-400">({preview.count})</span>
                          ) : null}
                        </span>
                        {isUnread ? (
                          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#1a73e8]" />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {preview.from}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-400">
                        {truncate(preview.snippet, 90)}
                      </span>
                      {preview.date ? (
                        <span className="mt-0.5 block text-[10px] text-slate-400">
                          {preview.date}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        }
        detail={
          selected ? (
            <DocumentReader item={selected} />
          ) : (
            <EmptyReader hint="Select a message to read it." />
          )
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← All messages"
      />
      <BackLink slug={session.slug} />
    </>
  );
}
