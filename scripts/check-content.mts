import { checkChallenge, codeMatches } from "../lib/answers.ts";
import { allQuestions, allEvidence, stageIndexOfEvidence } from "../lib/sessions/helpers.ts";
import { biasSession } from "../lib/sessions/bias.ts";
import { transparencySession } from "../lib/sessions/transparency.ts";
import { footprintSession } from "../lib/sessions/footprint.ts";
import { uncertaintySession } from "../lib/sessions/uncertainty.ts";

const sessions = [biasSession, transparencySession, footprintSession, uncertaintySession];
let fails = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) { fails++; console.log("  FAIL " + msg); }
};

const STAGE_SIZES = [3, 3, 4];

for (const s of sessions) {
  console.log(`\n${s.slug}`);
  const questions = allQuestions(s);
  const evidence = allEvidence(s);

  ok(s.stages.length === 3, "three stages");
  s.stages.forEach((stage, i) => {
    ok(stage.questions.length === STAGE_SIZES[i], `stage ${i} (${stage.id}) has ${STAGE_SIZES[i]} questions`);
  });

  // fragments spell the code, in stage order then question order
  ok(questions.map((q) => q.fragment).join("") === s.finalCode, "fragments !== finalCode");
  ok(s.finalCode.length === 10, "finalCode is 10 characters");
  ok(codeMatches(s.finalCode.toLowerCase(), s.finalCode), "code match is case-insensitive");
  ok(questions.length === 10, "ten questions total");

  const ids = new Set(evidence.map((e) => e.id));
  ok(ids.size === evidence.length, "evidence ids unique");

  let minutes = 0;
  s.stages.forEach((stage, stageIndex) => {
    stage.questions.forEach((q) => {
      minutes += q.minutes;
      for (const id of q.evidenceIds) {
        ok(ids.has(id), `${q.id} references unknown evidence ${id}`);
        const evStage = stageIndexOfEvidence(s, id);
        ok(
          evStage !== -1 && evStage <= stageIndex,
          `${q.id} (stage ${stageIndex}) does not forward-reference evidence ${id} (stage ${evStage})`,
        );
      }
      const c = q.challenge;
      if (c.type === "single") {
        ok(checkChallenge(c, [String(c.answer)]), `${q.id} single answer accepted`);
        const wrong = (c.answer + 1) % c.options.length;
        ok(!checkChallenge(c, [String(wrong)]), `${q.id} single rejects wrong`);
        ok(c.answer >= 0 && c.answer < c.options.length, `${q.id} answer index in range`);
      } else if (c.type === "multi") {
        ok(checkChallenge(c, c.answers.map(String)), `${q.id} multi answer accepted`);
        ok(checkChallenge(c, [...c.answers].reverse().map(String)), `${q.id} multi order-independent`);
        ok(!checkChallenge(c, c.answers.slice(1).map(String)), `${q.id} multi rejects subset`);
        const extra = c.options.map((_, i) => i).find((i) => !c.answers.includes(i));
        if (extra !== undefined) ok(!checkChallenge(c, [...c.answers, extra].map(String)), `${q.id} multi rejects superset`);
        ok(c.answers.every((a) => a >= 0 && a < c.options.length), `${q.id} multi indices in range`);
      } else if (c.type === "numeric") {
        ok(checkChallenge(c, [String(c.answer)]), `${q.id} numeric exact accepted`);
        ok(checkChallenge(c, [`${c.answer}${c.unit ? " " + c.unit : ""}`]), `${q.id} numeric with unit accepted`);
        ok(!checkChallenge(c, [String(c.answer + c.tolerance + 1)]), `${q.id} numeric rejects out of tolerance`);
        ok(!checkChallenge(c, [""]), `${q.id} numeric rejects empty`);
        ok(!checkChallenge(c, ["abc"]), `${q.id} numeric rejects junk`);
      } else {
        ok(c.accept.every((a) => checkChallenge(c, [a])), `${q.id} text accepts all variants`);
        ok(checkChallenge(c, [c.accept[0].toUpperCase() + " "]), `${q.id} text case/space insensitive`);
        ok(!checkChallenge(c, ["definitely not"]), `${q.id} text rejects wrong`);
        ok(!checkChallenge(c, [""]), `${q.id} text rejects empty`);
      }
    });
  });
  console.log(`  budget ${minutes} min against stated ${s.durationMinutes} min`);
  ok(Math.abs(minutes - s.durationMinutes) <= 20, "time budget close to stated duration");

  // Any evidence never referenced by a question is optional colour - report it.
  const referenced = new Set(questions.flatMap((q) => q.evidenceIds));
  const unused = evidence.filter((e) => !referenced.has(e.id)).map((e) => e.id);
  if (unused.length) console.log(`  not gated by any question (browsable extra): ${unused.join(", ")}`);
}

console.log(fails === 0 ? "\nALL CHECKS PASSED" : `\n${fails} CHECKS FAILED`);
process.exit(fails === 0 ? 0 : 1);
