import Link from "next/link";
import type { Stage, Session } from "@/lib/types";
import { accents } from "@/lib/accents";
import { FORMAT_LABEL } from "@/lib/stageFormat";
import { Inline } from "../Inline";

export function StageLockedPage({
  session,
  stage,
  previousStageTitle,
}: {
  session: Session;
  stage: Stage;
  previousStageTitle?: string;
}) {
  const accent = accents[session.accent];
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 py-16 text-center">
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full border border-white-70"
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect
            x="3"
            y="7"
            width="10"
            height="7"
            rx="1.5"
            stroke="#FFFFFF"
            strokeWidth="1.4"
          />
          <path
            d="M5 7V5a3 3 0 0 1 6 0v2"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <p className="mt-5 text-xs font-semibold text-white-70 label">
        Locked · {FORMAT_LABEL[stage.format]}
      </p>
      <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
        {stage.title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white-70">
        {previousStageTitle ? (
          <>
            This opens once every question in <Inline text={`**${previousStageTitle}**`} /> is
            solved.
          </>
        ) : (
          "This stage isn't open yet."
        )}
      </p>
      <Link
        href={`/sessions/${session.slug}`}
        className={`mt-7 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white ${accent.fillInteractive}`}
      >
        Back to {session.title}
      </Link>
    </main>
  );
}
