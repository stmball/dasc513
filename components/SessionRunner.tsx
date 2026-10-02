"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import type { Session } from "@/lib/types";
import { accents } from "@/lib/accents";
import { codeMatches } from "@/lib/answers";
import { FORMAT_LABEL, FORMAT_LAUNCH_LABEL } from "@/lib/gateFormat";
import { ALL_GATES_UNLOCKED } from "@/lib/devFlags";
import { useProgress } from "@/lib/progress";
import { allStages } from "@/lib/sessions/helpers";
import { Inline } from "./Inline";
import { StagePanel, type StageState } from "./StagePanel";
import { GateTeaser } from "./gates/GateTeaser";

export function SessionRunner({ session }: { session: Session }) {
  const accent = accents[session.accent];
  const { progress, update, reset } = useProgress(session.slug);
  const stages = useMemo(() => allStages(session), [session]);

  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  const [briefOpen, setBriefOpen] = useState(true);
  const [finalEntry, setFinalEntry] = useState("");
  const [finalWrong, setFinalWrong] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const solved = useMemo(() => new Set(progress.solved), [progress.solved]);
  const opened = useMemo(() => new Set(progress.opened), [progress.opened]);

  const gateSolved = (index: number) =>
    session.gates[index].stages.every((stage) => solved.has(stage.id));
  const gateUnlocked = (index: number) =>
    ALL_GATES_UNLOCKED || index === 0 || gateSolved(index - 1);

  const allSolved = stages.every((stage) => solved.has(stage.id));

  function solveStage(stageId: string) {
    update((p) =>
      p.solved.includes(stageId) ? p : { ...p, solved: [...p.solved, stageId] },
    );
    setExpandedStages((current) => [...current, stageId]);
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

  const fragmentGroups = session.gates.map((gate) =>
    gate.stages.map((stage) => (solved.has(stage.id) ? stage.fragment : null)),
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

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-3xl">
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
            {solved.size} / {stages.length} locks open
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirmReset) {
                reset();
                setConfirmReset(false);
                setExpandedStages([]);
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
        </div>

        <div className="mt-8 space-y-6">
          {session.gates.map((gate, gateIndex) => {
            const unlocked = gateUnlocked(gateIndex);

            if (!unlocked) {
              return (
                <div key={gate.id} className="mx-auto max-w-3xl">
                  <GateTeaser
                    gate={gate}
                    previousGateTitle={session.gates[gateIndex - 1].title}
                  />
                </div>
              );
            }

            const readCount = gate.evidence.filter((item) => opened.has(item.id)).length;

            return (
              <div
                key={gate.id}
                className="grid gap-4 lg:grid-cols-[20rem_1fr] lg:items-start lg:gap-6"
              >
                {/* Left column: the sub-app gate — its brief and the launcher
                    into the gate page. Sticky on desktop so it stays visible
                    while the locks on the right are worked through. */}
                <div className="rounded-xl border border-navy-15 bg-white px-5 py-4 lg:sticky lg:top-6">
                  <p className="text-[11px] font-semibold text-navy-55 label">
                    {gate.title} · {FORMAT_LABEL[gate.format]}
                  </p>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-navy-70">
                    {gate.intro.map((paragraph, i) => (
                      <p key={i}>
                        <Inline text={paragraph} />
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-navy-15 pt-4">
                    <a
                      href={`/sessions/${session.slug}/${gate.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white ${accent.fillInteractive}`}
                    >
                      {FORMAT_LAUNCH_LABEL[gate.format]} ↗
                    </a>
                    <p className="text-xs text-navy-55 numeric">
                      {readCount} / {gate.evidence.length} read
                    </p>
                  </div>
                </div>

                {/* Right column: this gate's questions. */}
                <div className="space-y-4">
                  {gate.stages.map((stage) => {
                    const index = globalIndex++;
                    const state: StageState = solved.has(stage.id) ? "solved" : "current";
                    return (
                      <StagePanel
                        key={stage.id}
                        stage={stage}
                        index={index}
                        total={stages.length}
                        state={state}
                        accent={accent}
                        onSolved={() => solveStage(stage.id)}
                        expanded={expandedStages.includes(stage.id)}
                        onToggleExpanded={() =>
                          setExpandedStages((current) =>
                            current.includes(stage.id)
                              ? current.filter((id) => id !== stage.id)
                              : [...current, stage.id],
                          )
                        }
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {allSolved ? (
            <section className="relative mx-auto max-w-3xl overflow-hidden rounded-xl border border-navy-15 bg-white pt-1">
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
                        locks, in order.
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
