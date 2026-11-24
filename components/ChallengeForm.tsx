"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import type { Challenge } from "@/lib/types";
import type { AccentStyle } from "@/lib/accents";
import { checkChallenge, parseNumber } from "@/lib/answers";
import { Inline } from "./Inline";

/** Fisher-Yates shuffle of the option indices, so choice answers appear in a
 * fresh order each time the page loads. */
function shuffleIndices(count: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** False during the server render and the hydration pass, true once running on
 * the client. Used to randomise option order without a hydration mismatch. */
const emptySubscribe = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/** One draggable card in a match challenge. Draggable with a pointer, or
 * picked up with a click/Enter so the exercise also works by touch and
 * keyboard. A placed card also offers a "Return" button. */
function MatchCard({
  text,
  held,
  onPick,
  onDragStart,
  onDragEnd,
  onReturn,
}: {
  text: string;
  held: boolean;
  onPick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onReturn?: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", text);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`flex items-start gap-2 rounded-lg border bg-white px-3 py-2 text-sm ${
        held ? "border-navy bg-navy-08 font-semibold" : "border-navy-30"
      } cursor-grab active:cursor-grabbing`}
    >
      <span aria-hidden className="mt-0.5 select-none text-navy-30">
        ⋮⋮
      </span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPick();
        }}
        aria-pressed={held}
        className="flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
      >
        <Inline text={text} />
      </button>
      {onReturn ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onReturn();
          }}
          className="shrink-0 text-xs text-navy-55 underline underline-offset-4 hover:text-navy hover:no-underline"
        >
          Return
        </button>
      ) : null}
    </div>
  );
}

export function ChallengeForm({
  challenge,
  accent,
  onSolved,
}: {
  challenge: Challenge;
  accent: AccentStyle;
  onSolved: () => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const [unitsOff, setUnitsOff] = useState(false);

  const isChoice = challenge.type === "single" || challenge.type === "multi";
  const isMatch = challenge.type === "match";
  // Match challenge: placement[i] is the category item i has been dropped in
  // (null = still in the pool); `held` is the card picked up by click/tap.
  const itemCount = challenge.type === "match" ? challenge.items.length : 0;
  const [placement, setPlacement] = useState<(number | null)[]>(() =>
    Array.from({ length: itemCount }, () => null),
  );
  const [held, setHeld] = useState<number | null>(null);
  const [draggingItem, setDraggingItem] = useState<number | null>(null);
  const [overCategory, setOverCategory] = useState<number | null>(null);

  function place(item: number, category: number | null) {
    setWrong(false);
    setPlacement((current) => current.map((c, i) => (i === item ? category : c)));
    setHeld(null);
    setDraggingItem(null);
    setOverCategory(null);
  }

  // Authored order on the server and the hydration render, then a fresh random
  // order on the client, so a refresh reshuffles without a hydration mismatch.
  const isClient = useIsClient();
  const optionOrder = useMemo(() => {
    if (challenge.type !== "single" && challenge.type !== "multi") return [];
    return isClient
      ? shuffleIndices(challenge.options.length)
      : challenge.options.map((_, i) => i);
  }, [challenge, isClient]);
  // Match cards are shuffled the same way, so the authored order never hints
  // at the answer.
  const itemOrder = useMemo(() => {
    if (challenge.type !== "match") return [];
    return isClient
      ? shuffleIndices(challenge.items.length)
      : challenge.items.map((_, i) => i);
  }, [challenge, isClient]);

  function toggle(index: number) {
    setWrong(false);
    setUnitsOff(false);
    if (challenge.type === "single") {
      setSelected([index]);
    } else {
      setSelected((current) =>
        current.includes(index)
          ? current.filter((i) => i !== index)
          : [...current, index],
      );
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const response = isMatch
      ? placement.map((c) => (c === null ? "" : String(c)))
      : isChoice
        ? selected.map(String)
        : [value];
    if (checkChallenge(challenge, response)) {
      onSolved();
      return;
    }
    setWrong(true);
    // Right arithmetic, wrong units is a distractingly common near-miss.
    if (challenge.type === "numeric") {
      const parsed = parseNumber(value);
      setUnitsOff(
        parsed !== null &&
          (Math.abs(parsed * 100 - challenge.answer) <= challenge.tolerance ||
            Math.abs(parsed / 100 - challenge.answer) <= challenge.tolerance),
      );
    }
  }

  const canSubmit = isMatch
    ? placement.every((c) => c !== null)
    : isChoice
      ? selected.length > 0
      : value.trim().length > 0;

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm font-semibold">
        <Inline text={challenge.prompt} />
      </p>

      {challenge.type === "match" ? (
        <div className="space-y-4">
          <p className="text-xs text-navy-70">
            Drag each card into a category, or click a card and then click a
            category. Click a placed card to pick it up again.
          </p>
          {/* The pool of cards not yet placed. */}
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (draggingItem !== null) place(draggingItem, null);
            }}
            className="flex min-h-[3rem] flex-col gap-2 rounded-lg border border-dashed border-navy-30 bg-navy-04 p-2"
          >
            {placement.every((c) => c !== null) ? (
              <p className="px-1 py-2 text-xs text-navy-55">
                All cards placed. Check them, then submit.
              </p>
            ) : null}
            {itemOrder.map((index) =>
              placement[index] === null ? (
                <MatchCard
                  key={index}
                  text={challenge.items[index]}
                  held={held === index}
                  onPick={() => setHeld(held === index ? null : index)}
                  onDragStart={() => setDraggingItem(index)}
                  onDragEnd={() => {
                    setDraggingItem(null);
                    setOverCategory(null);
                  }}
                />
              ) : null,
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {challenge.categories.map((category, categoryIndex) => {
              const over = overCategory === categoryIndex;
              return (
                <div
                  key={categoryIndex}
                  role="group"
                  aria-label={category}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOverCategory(categoryIndex);
                  }}
                  onDragLeave={() => setOverCategory(null)}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggingItem !== null) place(draggingItem, categoryIndex);
                  }}
                  onClick={() => {
                    if (held !== null) place(held, categoryIndex);
                  }}
                  className={`min-h-[5.5rem] rounded-lg border p-2 transition-colors ${
                    over
                      ? "border-navy bg-navy-08"
                      : held !== null
                        ? "cursor-pointer border-navy-55 bg-white hover:bg-navy-04"
                        : "border-navy-15 bg-white"
                  }`}
                >
                  <p className="mb-2 text-[11px] font-semibold text-navy-70 label">
                    {category}
                  </p>
                  <div className="flex flex-col gap-2">
                    {itemOrder.map((index) =>
                      placement[index] === categoryIndex ? (
                        <MatchCard
                          key={index}
                          text={challenge.items[index]}
                          held={held === index}
                          onPick={() => setHeld(held === index ? null : index)}
                          onDragStart={() => setDraggingItem(index)}
                          onDragEnd={() => {
                            setDraggingItem(null);
                            setOverCategory(null);
                          }}
                          onReturn={() => place(index, null)}
                        />
                      ) : null,
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : isChoice ? (
        <ul className="space-y-2">
          {optionOrder.map((index) => {
            const option = challenge.options[index];
            const checked = selected.includes(index);
            return (
              <li key={index}>
                {/* Selection reads as a navy-tinted fill with a navy edge.
                    The brand has no accent borders, so emphasis is weight
                    and fill rather than colour. */}
                <label
                  className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    checked
                      ? "border-navy bg-navy-08 font-semibold"
                      : "border-navy-15 hover:border-navy-30"
                  }`}
                >
                  <input
                    type={challenge.type === "single" ? "radio" : "checkbox"}
                    name="challenge-option"
                    className="mt-1 shrink-0 accent-navy"
                    checked={checked}
                    onChange={() => toggle(index)}
                  />
                  <span>
                    <Inline text={option} />
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            inputMode={challenge.type === "numeric" ? "decimal" : "text"}
            value={value}
            placeholder={
              "placeholder" in challenge ? challenge.placeholder : undefined
            }
            onChange={(event) => {
              setValue(event.target.value);
              setWrong(false);
              setUnitsOff(false);
            }}
            className="numeric w-48 rounded-lg border border-navy-30 bg-white px-3 py-2 text-sm placeholder:text-navy-30 focus:border-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          />
          {challenge.type === "numeric" && challenge.unit ? (
            <span className="text-sm text-navy-70">{challenge.unit}</span>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
            canSubmit
              ? accent.fillInteractive
              : "cursor-not-allowed bg-navy-30"
          }`}
        >
          Submit answer
        </button>
        {wrong ? (
          // Errors carry a navy bar and bold navy type. No warning colour
          // exists in the brand, and accents may not be used on text.
          <p
            role="status"
            className="border-l-2 border-navy py-0.5 pl-3 text-sm font-semibold"
          >
            {unitsOff
              ? "The arithmetic is right but the units are not. Re-read what the question asks you to enter."
              : "Not it. Try again."}
          </p>
        ) : null}
      </div>
    </form>
  );
}
