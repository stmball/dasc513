import type { Challenge } from "./types";

/** Lowercase, strip punctuation and collapse whitespace so free text is forgiving. */
export function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Pull the first number out of whatever a student types: "34%", "£-386",
 * "27 percentage points", "1,650" and "13.6 t" all have to work.
 */
export function parseNumber(raw: string): number | null {
  const cleaned = raw
    .replace(/[\u2212\u2012-\u2015]/g, "-")
    .replace(/[,\s£$€]/g, "");
  const match = cleaned.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function checkChallenge(
  challenge: Challenge,
  response: string[] | string,
): boolean {
  switch (challenge.type) {
    case "single": {
      const picked = Array.isArray(response) ? response[0] : response;
      return picked === String(challenge.answer);
    }
    case "multi": {
      const picked = (Array.isArray(response) ? response : [response])
        .filter(Boolean)
        .map(Number)
        .sort((a, b) => a - b);
      const expected = [...challenge.answers].sort((a, b) => a - b);
      return (
        picked.length === expected.length &&
        picked.every((value, index) => value === expected[index])
      );
    }
    case "numeric": {
      const parsed = parseNumber(
        (Array.isArray(response) ? response[0] : response) ?? "",
      );
      if (parsed === null) return false;
      return Math.abs(parsed - challenge.answer) <= challenge.tolerance;
    }
    case "text": {
      const raw = (Array.isArray(response) ? response[0] : response) ?? "";
      const candidate = normalise(raw);
      if (!candidate) return false;
      return challenge.accept.some((accepted) => normalise(accepted) === candidate);
    }
  }
}

export function codeMatches(entered: string, expected: string): boolean {
  return (
    entered.replace(/[^a-z0-9]/gi, "").toUpperCase() ===
    expected.replace(/[^a-z0-9]/gi, "").toUpperCase()
  );
}
