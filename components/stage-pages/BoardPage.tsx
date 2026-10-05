"use client";

import { useState } from "react";
import type { EvidenceItem, EvidenceKind } from "@/lib/types";
import { DocumentBody, DocumentTable, hashId } from "../document/DocumentChrome";
import { GridDetailShell } from "./GridDetailShell";
import { BackLink } from "./BackLink";
import type { FormatPageProps } from "./types";

/** The classic vBulletin/phpBB "subSilver" gradient — a steel blue banner,
 * nothing else in this app uses it, and nothing about it is NHS branding:
 * it's the default skin colour of early-2000s forum software, not a trust
 * identity. */
const MASTHEAD_GRADIENT = "linear-gradient(180deg, #3E5C92 0%, #6D93C7 100%)";

const KIND_ICON: Record<EvidenceKind, string> = {
  report: "bg-sky-700",
  forum: "bg-emerald-700",
  dataset: "bg-amber-700",
  memo: "bg-slate-600",
  email: "bg-indigo-700",
  policy: "bg-rose-700",
  code: "bg-violet-700",
  ticket: "bg-orange-700",
  press: "bg-cyan-700",
  transcript: "bg-teal-700",
};

const RANKS = ["Junior Member", "Member", "Senior Member", "Trust Statistician", "Board Regular"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function rankOf(item: EvidenceItem): string {
  return RANKS[hashId(item.id) % RANKS.length];
}
function joinedOf(item: EvidenceItem): string {
  const h = hashId(item.id);
  return `${MONTHS[(h >>> 2) % 12]} ${2001 + ((h >>> 5) % 6)}`;
}
function postCountOf(item: EvidenceItem): number {
  return 20 + ((hashId(item.id) >>> 4) % 900);
}
function viewsOf(item: EvidenceItem): number {
  return 80 + (hashId(item.id) % 1200);
}
function replyCountOf(item: EvidenceItem): number {
  return item.kind === "forum" ? Math.max(item.body.length - 1, 0) : 0;
}

/** Who a thread reads as "started by" — the first speaker for a reply
 * thread (parsed the same `**Name.**` way `DocumentChrome` does), or the
 * name leading the item's own `source` string otherwise. Cosmetic only. */
function startedBy(item: EvidenceItem): string {
  if (item.kind === "forum") {
    const m = /^\*\*([^*]+)\*\*/.exec(item.body[0]?.trim() ?? "");
    if (m) return m[1].replace(/,.*$/, "").trim();
  }
  return item.source.split(/\s*—\s*|,/)[0].trim();
}

function ThreadRow({
  item,
  isUnread,
  onSelect,
}: {
  item: EvidenceItem;
  isUnread: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <tr className={isUnread ? "bg-white" : "bg-[#E8EEF7]"}>
      <td className="w-8 border border-[#A9B8C2] px-2 py-2 text-center align-middle">
        <span aria-hidden className={`inline-block h-3 w-3 rounded-sm ${KIND_ICON[item.kind]}`} />
      </td>
      <td className="border border-[#A9B8C2] px-3 py-2 align-middle">
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className={`text-left text-[13px] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3E5C92] ${
            isUnread ? "font-bold text-[#1a4480]" : "font-normal text-[#5b5b8c]"
          }`}
        >
          {isUnread ? <span className="mr-1 text-orange-600">●</span> : null}
          {item.title}
        </button>
        <p className="mt-0.5 text-[11px] text-[#6b7a87]">by {startedBy(item)}</p>
      </td>
      <td className="w-20 border border-[#A9B8C2] px-2 py-2 text-center align-middle text-[12px] text-[#3b4b57]">
        {replyCountOf(item)}
      </td>
      <td className="w-20 border border-[#A9B8C2] px-2 py-2 text-center align-middle text-[12px] text-[#3b4b57]">
        {viewsOf(item)}
      </td>
      <td className="w-40 border border-[#A9B8C2] px-2 py-2 align-middle text-[11px] text-[#3b4b57]">
        {item.date ?? "Not dated"}
        <br />
        <span className="text-[#6b7a87]">by {startedBy(item)}</span>
      </td>
    </tr>
  );
}

function ThreadPost({ item }: { item: EvidenceItem }) {
  return (
    <div className="overflow-hidden border border-[#A9B8C2]">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#D1DBE8] px-3 py-1.5 text-[11px] text-[#3b4b57]">
        <span className="font-bold">Post subject: {item.title}</span>
        <span>Posted: {item.date ?? "Not dated"}</span>
      </div>
      <div className="flex flex-col sm:flex-row">
        <div className="shrink-0 border-b border-[#A9B8C2] bg-[#F2F3F5] px-3 py-3 text-[11px] text-[#3b4b57] sm:w-36 sm:border-b-0 sm:border-r">
          <span
            aria-hidden
            className={`flex h-10 w-10 items-center justify-center rounded-sm text-sm font-bold text-white ${KIND_ICON[item.kind]}`}
          >
            {startedBy(item).trim().charAt(0).toUpperCase() || "?"}
          </span>
          <p className="mt-2 font-bold text-[#1a4480]">{startedBy(item)}</p>
          <p className="mt-1">{rankOf(item)}</p>
          <p className="mt-2 text-[#6b7a87]">Joined: {joinedOf(item)}</p>
          <p className="text-[#6b7a87]">Posts: {postCountOf(item)}</p>
        </div>
        <div className="min-w-0 flex-1 bg-white px-4 py-4">
          <DocumentBody item={item} />
          <DocumentTable item={item} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-[#A9B8C2] bg-[#F2F3F5] px-3 py-1.5 text-[11px] text-[#8a97a3]">
        <span className="cursor-default select-none">Quote</span>
        <span className="cursor-default select-none">Report</span>
      </div>
    </div>
  );
}

const OTHER_BOARDS = ["Off Duty / Social", "Facilities & Car Parking", "IT Helpdesk Announcements"];

/**
 * An early-2000s internal message board — a steel-blue vBulletin/phpBB-style
 * gradient masthead, a dense bordered thread-index table (Topics / Replies /
 * Views / Last Post) and a classic profile-panel-plus-post thread view —
 * deliberately not the DASC513 navy/coral/teal brand, deliberately not any
 * of the other stage pages' palettes, and carrying no NHS visual branding:
 * just the default look of the forum software itself, the way a trust's own
 * internal IT department might once have stood one up.
 */
export function BoardPage({ session, stage, opened, onOpen }: FormatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stage.evidence.find((item) => item.id === selectedId) ?? null;

  const totalPosts = stage.evidence.reduce((acc, item) => acc + 1 + replyCountOf(item), 0);
  const totalMembers = 60 + (hashId(stage.id) % 240);

  function select(id: string) {
    setSelectedId(id);
    onOpen(id);
  }

  return (
    <div style={{ fontFamily: "Verdana, Arial, Helvetica, sans-serif" }}>
      <GridDetailShell
        containerClassName="bg-[#F2F3F5]"
        backButtonClassName="text-[#1a4480] hover:text-[#0d2850]"
        headerBar={
          <>
            <div className="px-4 py-5 text-white sm:px-6" style={{ background: MASTHEAD_GRADIENT }}>
              <div className="mx-auto w-full max-w-5xl">
                <h1 className="text-xl font-bold">{stage.chrome.split(": ")[0]}</h1>
                <p className="text-[11px] text-white/80">{stage.chrome.split(": ")[1] ?? "Internal message board"}</p>
              </div>
            </div>
            <div className="border-b border-[#A9B8C2] bg-[#E8EEF7] px-4 py-1.5 text-[11px] text-[#5b6b78] sm:px-6">
              <div className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-2 gap-y-1">
                {["FAQ", "Search", "Memberlist", "Usergroups", "Register", "Profile", "Log in"].map((label, i, arr) => (
                  <span key={label} className="cursor-default select-none">
                    {label}
                    {i < arr.length - 1 ? <span className="ml-2 text-[#A9B8C2]">|</span> : null}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-b border-[#A9B8C2] bg-[#D1DBE8] px-4 py-1.5 text-[11px] text-[#3b4b57] sm:px-6">
              <div className="mx-auto w-full max-w-5xl">⌂ Forum Index » Clinical Data &amp; Statistics</div>
            </div>
          </>
        }
        grid={
          <div>
            <div className="mb-3 border border-[#A9B8C2] bg-white">
              <p className="border-b border-[#A9B8C2] bg-[#D1DBE8] px-3 py-1 text-[11px] font-bold text-[#3b4b57]">
                Other boards
              </p>
              <ul className="divide-y divide-[#E8EEF7] text-[11px] text-[#8a97a3]">
                {OTHER_BOARDS.map((name) => (
                  <li key={name} className="cursor-default select-none px-3 py-1.5">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden border border-[#A9B8C2]">
              <p className="border-b border-[#A9B8C2] bg-[#3b4b57] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Clinical Data &amp; Statistics
              </p>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#D1DBE8] text-[11px] font-bold text-[#3b4b57]">
                    <th className="border border-[#A9B8C2] px-2 py-1.5" aria-hidden />
                    <th className="border border-[#A9B8C2] px-3 py-1.5">Topic</th>
                    <th className="border border-[#A9B8C2] px-2 py-1.5">Replies</th>
                    <th className="border border-[#A9B8C2] px-2 py-1.5">Views</th>
                    <th className="border border-[#A9B8C2] px-2 py-1.5">Last Post</th>
                  </tr>
                </thead>
                <tbody>
                  {stage.evidence.map((item) => (
                    <ThreadRow key={item.id} item={item} isUnread={!opened.has(item.id)} onSelect={select} />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-center text-[11px] text-[#5b6b78]">
              Who is online: 3 registered users browsing this forum (nobody you&rsquo;d recognise)
              <br />
              Board statistics: {stage.evidence.length} topics · {totalPosts} posts · {totalMembers} members
            </p>
          </div>
        }
        detail={
          selected ? (
            <div>
              <div className="mb-2 flex items-center justify-between text-[11px] text-[#5b6b78]">
                <span>Page 1 of 1</span>
                <span className="cursor-default select-none rounded-sm border border-[#A9B8C2] bg-[#E8EEF7] px-2 py-1">
                  Post reply
                </span>
              </div>
              <ThreadPost item={selected} />
            </div>
          ) : null
        }
        hasSelection={Boolean(selected)}
        onBack={() => setSelectedId(null)}
        backLabel="← Back to the board index"
      />
      <BackLink slug={session.slug} />
    </div>
  );
}
