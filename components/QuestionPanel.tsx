"use client";

import type { Question } from "@/lib/types";
import type { AccentStyle } from "@/lib/accents";
import { Inline } from "./Inline";
import { ChallengeForm } from "./ChallengeForm";

export type QuestionState = "current" | "solved";

export function QuestionPanel({
  question,
  index,
  total,
  state,
  accent,
  onSolved,
  expanded,
  onToggleExpanded,
}: {
  question: Question;
  index: number;
  total: number;
  state: QuestionState;
  accent: AccentStyle;
  onSolved: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  if (state === "solved" && !expanded) {
    return (
      <section className="rounded-xl border border-navy-15 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${accent.fill}`}
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-navy-55 label">
                Question {index + 1} — open
              </p>
              <h3 className="mt-0.5 truncate text-sm font-semibold">
                {question.title.replace(/^Question \d+ — /, "")}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-white ${accent.fill}`}
            >
              {question.fragment}
            </span>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="text-xs font-semibold underline underline-offset-4 hover:no-underline"
            >
              Re-read
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-navy-15 bg-white pt-1">
      {/* Card top-strip: navy, per the template. */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-navy" />

      <header className="px-5 pb-4 pt-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${accent.fill}`}
            >
              {index + 1}
            </span>
            <p className="text-[11px] font-semibold text-navy-55 label">
              Question {index + 1} of {total}
            </p>
          </div>
          <p className="text-[11px] font-semibold text-navy-55 label">
            ≈ {question.minutes} min
          </p>
        </div>
        <h2 className="mt-4 text-2xl font-bold">{question.title}</h2>
        {/* Title underline: always navy. */}
        <span aria-hidden className="mt-3 block h-px w-full bg-navy-15" />
      </header>

      <div className="space-y-5 px-5 pb-5 sm:px-6">
        <div className="space-y-3 text-sm leading-relaxed text-navy-90">
          {question.scenario.map((paragraph, i) => (
            <p key={i}>
              <Inline text={paragraph} />
            </p>
          ))}
        </div>

        {/* The objective is the one accent-filled box on the panel: white
            type on a solid accent ground. */}
        <div className={`rounded-lg px-4 py-3 text-white ${accent.fill}`}>
          <p className="text-[11px] font-semibold text-white-70 label">
            Objective
          </p>
          <p className="mt-1 text-sm font-semibold">
            <Inline text={question.objective} />
          </p>
        </div>

        {state === "current" ? (
          <ChallengeForm
            challenge={question.challenge}
            accent={accent}
            onSolved={onSolved}
          />
        ) : null}

        {state === "solved" ? (
          <div className="rounded-lg border border-navy-15 bg-navy-04 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-navy-55 label">
                Question open — debrief
              </p>
              <span className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-navy-55 label">
                  Fragment
                </span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-white ${accent.fill}`}
                >
                  {question.fragment}
                </span>
              </span>
            </div>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-navy-90">
              {question.debrief.map((paragraph, i) => (
                <p key={i}>
                  <Inline text={paragraph} />
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="mt-4 text-xs font-semibold underline underline-offset-4 hover:no-underline"
            >
              Collapse this question
            </button>
          </div>
        ) : null}
      </div>

      {/* Slide number, bottom-right — navy on a white ground. */}
      <p className="px-5 pb-4 text-right text-[11px] text-navy-55 numeric sm:px-6">
        {index + 1} / {total}
      </p>
    </section>
  );
}
