import { checkChallenge, codeMatches } from "../lib/answers.ts";
import { allStages, allEvidence, gateIndexOfEvidence } from "../lib/sessions/helpers.ts";
import { biasSession } from "../lib/sessions/bias.ts";
import { transparencySession } from "../lib/sessions/transparency.ts";
import { footprintSession } from "../lib/sessions/footprint.ts";
import { uncertaintySession } from "../lib/sessions/uncertainty.ts";

const sessions = [biasSession, transparencySession, footprintSession, uncertaintySession];
let fails = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) { fails++; console.log("  FAIL " + msg); }
};

const GATE_SIZES = [3, 3, 4];

for (const s of sessions) {
  console.log(`\n${s.slug}`);
  const stages = allStages(s);
  const evidence = allEvidence(s);

  ok(s.gates.length === 3, "three gates");
  s.gates.forEach((gate, i) => {
    ok(gate.stages.length === GATE_SIZES[i], `gate ${i} (${gate.id}) has ${GATE_SIZES[i]} stages`);
  });

  // fragments spell the code, in gate order then stage order
  ok(stages.map((st) => st.fragment).join("") === s.finalCode, "fragments !== finalCode");
  ok(s.finalCode.length === 10, "finalCode is 10 characters");
  ok(codeMatches(s.finalCode.toLowerCase(), s.finalCode), "code match is case-insensitive");
  ok(stages.length === 10, "ten stages total");

  const ids = new Set(evidence.map((e) => e.id));
  ok(ids.size === evidence.length, "evidence ids unique");

  let minutes = 0;
  s.gates.forEach((gate, gateIndex) => {
    gate.stages.forEach((st) => {
      minutes += st.minutes;
      for (const id of st.evidenceIds) {
        ok(ids.has(id), `${st.id} references unknown evidence ${id}`);
        const evGate = gateIndexOfEvidence(s, id);
        ok(
          evGate !== -1 && evGate <= gateIndex,
          `${st.id} (gate ${gateIndex}) does not forward-reference evidence ${id} (gate ${evGate})`,
        );
      }
      const c = st.challenge;
      if (c.type === "single") {
        ok(checkChallenge(c, [String(c.answer)]), `${st.id} single answer accepted`);
        const wrong = (c.answer + 1) % c.options.length;
        ok(!checkChallenge(c, [String(wrong)]), `${st.id} single rejects wrong`);
        ok(c.answer >= 0 && c.answer < c.options.length, `${st.id} answer index in range`);
      } else if (c.type === "multi") {
        ok(checkChallenge(c, c.answers.map(String)), `${st.id} multi answer accepted`);
        ok(checkChallenge(c, [...c.answers].reverse().map(String)), `${st.id} multi order-independent`);
        ok(!checkChallenge(c, c.answers.slice(1).map(String)), `${st.id} multi rejects subset`);
        const extra = c.options.map((_, i) => i).find((i) => !c.answers.includes(i));
        if (extra !== undefined) ok(!checkChallenge(c, [...c.answers, extra].map(String)), `${st.id} multi rejects superset`);
        ok(c.answers.every((a) => a >= 0 && a < c.options.length), `${st.id} multi indices in range`);
      } else if (c.type === "numeric") {
        ok(checkChallenge(c, [String(c.answer)]), `${st.id} numeric exact accepted`);
        ok(checkChallenge(c, [`${c.answer}${c.unit ? " " + c.unit : ""}`]), `${st.id} numeric with unit accepted`);
        ok(!checkChallenge(c, [String(c.answer + c.tolerance + 1)]), `${st.id} numeric rejects out of tolerance`);
        ok(!checkChallenge(c, [""]), `${st.id} numeric rejects empty`);
        ok(!checkChallenge(c, ["abc"]), `${st.id} numeric rejects junk`);
      } else {
        ok(c.accept.every((a) => checkChallenge(c, [a])), `${st.id} text accepts all variants`);
        ok(checkChallenge(c, [c.accept[0].toUpperCase() + " "]), `${st.id} text case/space insensitive`);
        ok(!checkChallenge(c, ["definitely not"]), `${st.id} text rejects wrong`);
        ok(!checkChallenge(c, [""]), `${st.id} text rejects empty`);
      }
    });
  });
  console.log(`  budget ${minutes} min against stated ${s.durationMinutes} min`);
  ok(Math.abs(minutes - s.durationMinutes) <= 20, "time budget close to stated duration");

  // Any evidence never referenced by a lock is optional colour - report it.
  const referenced = new Set(stages.flatMap((st) => st.evidenceIds));
  const unused = evidence.filter((e) => !referenced.has(e.id)).map((e) => e.id);
  if (unused.length) console.log(`  not gated by any lock (browsable extra): ${unused.join(", ")}`);
}

console.log(fails === 0 ? "\nALL CHECKS PASSED" : `\n${fails} CHECKS FAILED`);
process.exit(fails === 0 ? 0 : 1);
