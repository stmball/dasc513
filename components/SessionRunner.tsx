"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import type { Session } from "@/lib/types";
import { accents } from "@/lib/accents";
import { codeMatches } from "@/lib/answers";
import { FORMAT_LABEL, FORMAT_LAUNCH_LABEL } from "@/lib/stageFormat";
import { ALL_STAGES_UNLOCKED } from "@/lib/devFlags";
import { useProgress } from "@/lib/progress";
import { allQuestions } from "@/lib/sessions/helpers";
import { Inline } from "./Inline";
import { QuestionPanel, type QuestionState } from "./QuestionPanel";
import { StageTeaser } from "./stages/StageTeaser";

export function SessionRunner({ session }: { session: Session }) {
  const accent = accents[session.accent];
  const { progress, update, reset } = useProgress(session.slug);
  const questions = useMemo(() => allQuestions(session), [session]);

  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [briefOpen, setBriefOpen] = useState(true);
  const [finalEntry, setFinalEntry] = useState("");
  const [finalWrong, setFinalWrong] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const solved = useMemo(() => new Set(progress.solved), [progress.solved]);
  const opened = useMemo(() => new Set(progress.opened), [progress.opened]);

  const stageSolved = (index: number) =>
    session.stages[index].questions.every((question) => solved.has(question.id));
  const stageUnlocked = (index: number) =>
    ALL_STAGES_UNLOCKED || index === 0 || stageSolved(index - 1);

  const allSolved = questions.every((question) => solved.has(question.id));

  function solveQuestion(questionId: string) {
    update((p) =>
      p.solved.includes(questionId) ? p : { ...p, solved: [...p.solved, questionId] },
    );
    setExpandedQuestions((current) => [...current, questionId]);
  }

  function submitFinal(event: FormEvent) {
    event.preventDefault();
    if (codeMatches(finalEntry, session.finalCode)) {
      update((p) => ({ ...p, escaped: true }));
      setFinalWrong(false);
    } else {
      setFinalWrong(true);
    }
  }

  const fragmentGroups = session.stages.map((stage) =>
    stage.questions.map((question) => (solved.has(question.id) ? question.fragment : null)),
  );

  let globalIndex = 0;

  return (
    <>
      {/* Section divider: full-bleed navy with an accent left-edge bar — the
          one place the template allows an accent on a thin shape, because it
          is a decorative fill rather than a rule. */}
      <section className="relative overflow-hidden bg-navy">
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-2 ${accent.fill}`}
        />
        <div className="mx-auto w-full max-w-7xl px-4 py-10 pl-6 sm:px-6 sm:pl-10 lg:py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-white-70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            ← All four tutorials
          </Link>

          <p className="mt-5 text-xs font-semibold text-white-70 label">
            Tutorial {session.number} · {session.theme}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {session.title}
          </h1>
          <span aria-hidden className="mt-5 block h-px w-24 bg-white" />
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white-70">
            {session.tagline}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-navy-15 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-navy-55 label">
              Code
            </span>
            <span className="flex items-center gap-2.5">
              {fragmentGroups.map((group, groupIndex) => (
                <span key={groupIndex} className="flex gap-1">
                  {group.map((fragment, index) => (
                    <span
                      key={index}
                      className={`flex h-8 w-8 items-center justify-center rounded text-sm font-bold ${
                        fragment
                          ? `text-white ${accent.fill}`
                          : "border border-navy-30 text-navy-30"
                      }`}
                    >
                      {fragment ?? "·"}
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </div>
          <p className="text-xs text-navy-70 numeric">
            {solved.size} / {questions.length} questions open
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirmReset) {
                reset();
                setConfirmReset(false);
                setExpandedQuestions([]);
                setFinalEntry("");
              } else {
                setConfirmReset(true);
                window.setTimeout(() => setConfirmReset(false), 4000);
              }
            }}
            className="ml-auto text-xs text-navy-55 underline underline-offset-4 hover:text-navy hover:no-underline"
          >
            {confirmReset ? "Click again to wipe progress" : "Reset session"}
          </button>
        </div>

        <section className="mt-6 overflow-hidden rounded-xl border border-navy-15 bg-white">
          <button
            type="button"
            onClick={() => setBriefOpen((v) => !v)}
            aria-expanded={briefOpen}
            className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-inset"
          >
            <span className="text-[11px] font-semibold text-navy-70 label">
              Your brief · {session.subject.company} · {session.subject.product}
            </span>
            <span aria-hidden className="text-navy-55">
              {briefOpen ? "−" : "+"}
            </span>
          </button>
          {briefOpen ? (
            <div className="space-y-3 border-t border-navy-15 px-5 py-4 text-sm leading-relaxed text-navy-90">
              <p className="text-navy-70">
                <Inline text={`*${session.subject.oneLiner}*`} />
              </p>
              {session.brief.map((paragraph, i) => (
                <p key={i}>
                  <Inline text={paragraph} />
                </p>
              ))}
              <details className="pt-2">
                <summary className="cursor-pointer text-[11px] font-semibold text-navy-55 label hover:text-navy">
                  What you should be able to do afterwards
                </summary>
                <ul className="mt-2 space-y-1.5 text-sm text-navy-70">
                  {session.learningOutcomes.map((outcome, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden className="text-navy-30">
                        —
                      </span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ) : null}
        </section>

        <div className="mt-8 space-y-4">
          {session.stages.map((stage, stageIndex) => {
            const unlocked = stageUnlocked(stageIndex);

            if (!unlocked) {
              return (
                <StageTeaser
                  key={stage.id}
                  stage={stage}
                  previousStageTitle={session.stages[stageIndex - 1].title}
                />
              );
            }

            const readCount = stage.evidence.filter((item) => opened.has(item.id)).length;

            return (
              <div key={stage.id} className="space-y-4">
                <div className="rounded-xl border border-navy-15 bg-white px-5 py-4">
                  <p className="text-[11px] font-semibold text-navy-55 label">
                    {stage.title} · {FORMAT_LABEL[stage.format]}
                  </p>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-navy-70">
                    {stage.intro.map((paragraph, i) => (
                      <p key={i}>
                        <Inline text={paragraph} />
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-navy-15 pt-4">
                    <a
                      href={`/sessions/${session.slug}/${stage.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white ${accent.fillInteractive}`}
                    >
                      {FORMAT_LAUNCH_LABEL[stage.format]} ↗
                    </a>
                    <p className="text-xs text-navy-55 numeric">
                      {readCount} / {stage.evidence.length} read
                    </p>
                  </div>
                </div>

                {stage.questions.map((question) => {
                  const index = globalIndex++;
                  const state: QuestionState = solved.has(question.id) ? "solved" : "current";
                  return (
                    <QuestionPanel
                      key={question.id}
                      question={question}
                      index={index}
                      total={questions.length}
                      state={state}
                      accent={accent}
                      onSolved={() => solveQuestion(question.id)}
                      expanded={expandedQuestions.includes(question.id)}
                      onToggleExpanded={() =>
                        setExpandedQuestions((current) =>
                          current.includes(question.id)
                            ? current.filter((id) => id !== question.id)
                            : [...current, question.id],
                        )
                      }
                    />
                  );
                })}
              </div>
            );
          })}

          {allSolved ? (
            <section className="relative overflow-hidden rounded-xl border border-navy-15 bg-white pt-1">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 bg-navy"
              />
              <div className="px-5 py-5 sm:px-6">
                <p className="text-[11px] font-semibold text-navy-55 label">
                  Final lock
                </p>
                <h2 className="mt-2 text-2xl font-bold">Override code</h2>
                <span
                  aria-hidden
                  className="mt-3 block h-px w-full bg-navy-15"
                />
                <p className="mt-4 text-sm leading-relaxed text-navy-90">
                  <Inline text={session.finale.prompt} />
                </p>

                {progress.escaped ? (
                  <div className="mt-5 space-y-3 text-sm leading-relaxed text-navy-90">
                    <p
                      className={`inline-block rounded-lg px-5 py-3 text-2xl font-bold tracking-[0.2em] text-white ${accent.fill}`}
                    >
                      {session.finalCode}
                    </p>
                    {session.finale.debrief.map((paragraph, i) => (
                      <p key={i}>
                        <Inline text={paragraph} />
                      </p>
                    ))}
                    <Link
                      href="/"
                      className={`mt-2 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white ${accent.fillInteractive}`}
                    >
                      Back to the four tutorials
                    </Link>
                  </div>
                ) : (
                  <form
                    onSubmit={submitFinal}
                    className="mt-4 flex flex-wrap items-center gap-3"
                  >
                    <input
                      type="text"
                      value={finalEntry}
                      onChange={(event) => {
                        setFinalEntry(event.target.value);
                        setFinalWrong(false);
                      }}
                      placeholder="10 characters"
                      className="w-64 rounded-lg border border-navy-30 bg-white px-3 py-2 text-center text-lg font-bold uppercase tracking-[0.2em] placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-navy-30 focus:border-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                    />
                    <button
                      type="submit"
                      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${accent.fillInteractive}`}
                    >
                      Release
                    </button>
                    {finalWrong ? (
                      <p
                        role="status"
                        className="border-l-2 border-navy py-0.5 pl-3 text-sm font-semibold"
                      >
                        Not the code. Read the fragments off the ten open
                        questions, in order.
                      </p>
                    ) : null}
                  </form>
                )}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
