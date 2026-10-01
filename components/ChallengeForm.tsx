"use client";

import { useState, type FormEvent } from "react";
import type { Challenge } from "@/lib/types";
import type { AccentStyle } from "@/lib/accents";
import { checkChallenge, parseNumber } from "@/lib/answers";
import { Inline } from "./Inline";

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
  const [attempts, setAttempts] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [unitsOff, setUnitsOff] = useState(false);

  const isChoice = challenge.type === "single" || challenge.type === "multi";

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
    const response = isChoice ? selected.map(String) : [value];
    if (checkChallenge(challenge, response)) {
      onSolved();
      return;
    }
    setAttempts((n) => n + 1);
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

  const canSubmit = isChoice
    ? selected.length > 0
    : value.trim().length > 0;

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm font-semibold">
        <Inline text={challenge.prompt} />
      </p>

      {isChoice ? (
        <ul className="space-y-2">
          {challenge.options.map((option, index) => {
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
          Try the lock
        </button>
        {wrong ? (
          // Errors carry a navy bar and bold navy type. No warning colour
          // exists in the brand, and accents may not be used on text.
          <p
            role="status"
            className="border-l-2 border-navy py-0.5 pl-3 text-sm font-semibold"
          >
            {unitsOff
              ? "The arithmetic is right but the units are not — re-read what the question asks you to enter."
              : attempts >= 2
                ? "Not it. Go back to the evidence — the answer is in there, and it is worth the argument."
                : "Not it. Try again."}
          </p>
        ) : null}
      </div>
    </form>
  );
}
