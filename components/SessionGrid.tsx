"use client";

import Link from "next/link";
import type { Session } from "@/lib/types";
import { accents } from "@/lib/accents";
import { useProgress } from "@/lib/progress";
import { allStages } from "@/lib/sessions/helpers";

/**
 * A content card from the template: white ground, navy hairline border, a
 * navy top-strip, and an accent-filled numbered badge. The accent appears
 * only as a fill — the border and every word on the card are navy.
 */
function SessionCard({ session }: { session: Session }) {
  const accent = accents[session.accent];
  const { progress } = useProgress(session.slug);
  const solvedCount = progress.solved.length;
  const total = allStages(session).length;

  return (
    <Link
      href={`/sessions/${session.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-navy-15 bg-white pt-1 transition-colors hover:border-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
    >
      {/* Card top-strip: navy, never accent. */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-navy" />

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-white ${accent.fill}`}
          >
            {session.number}
          </span>
          {progress.escaped ? (
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold text-white label ${accent.fill}`}
            >
              Escaped
            </span>
          ) : solvedCount > 0 ? (
            <span className="rounded-full border border-navy-30 px-3 py-1 text-[11px] font-semibold label">
              {solvedCount}/{total} locks
            </span>
          ) : null}
        </div>

        <p className="mt-5 text-[11px] font-semibold text-navy-70 label">
          {session.theme}
        </p>
        <h3 className="mt-2 text-xl font-bold">{session.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-navy-70">
          {session.tagline}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-navy-15 pt-4">
          <span className="text-xs text-navy-55">{session.subject.product}</span>
          <span className="text-sm font-semibold">
            {solvedCount > 0 ? "Continue" : "Enter"} →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function SessionGrid({ sessions }: { sessions: Session[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {sessions.map((session) => (
        <li key={session.slug}>
          <SessionCard session={session} />
        </li>
      ))}
    </ul>
  );
}
