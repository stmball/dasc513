<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DASC513 — Tutorial Activities

A Next.js app hosting **four escape-room tutorials** for the DASC513 module. Each
tutorial is a self-contained ~2 hour group activity in which students audit a
fictional health-AI company across one of the module's four themes.

## The premise

Every session evaluates the same invented company — **Meridian Health
Analytics Ltd**, a supplier of statistical and machine-learning models to the
NHS — through a different product and a different theme:

| # | Lecture | Theme | Room | Product | Code |
|---|---------|-------|------|---------|------|
| 1 | Week 9 | Bias and Bias Mitigation | The Referral That Wasn't | CARDEA v2.4, cardiovascular triage | `H3ART` |
| 2 | Week 10 | Transparency, Explainability and Interpretability | Black Box, Open Inquest | SENTINEL v1.7, sepsis early warning | `CL3AR` |
| 3 | Week 11 | Privacy, Economics and Environment | The Price of the Model | VITAL-LM, clinical language model | `GR33N` |
| 4 | Week 12 | Uncertainty and Calibration | The Number That Was Sure | HORIZON v3, oncology prognosis | `D0UBT` |

Recurring fictional institutions: **Mersey & Dee Integrated Care Board** and
**Brackenmoor NHS Foundation Trust**. Everything is invented, but each failure
is modelled on a real, citable case, and the debriefs name the source.

## Alignment with the lectures

Each room mirrors the corresponding lecture, and the lecture is the source of
truth for terminology and emphasis. The decks themselves live in `lectures/`,
which is **gitignored** — they are not redistributable. If you need to check a
claim against the slides, read the `.pptx` there; do not commit it.

What each room must keep covering, by lecture:

- **Week 9 (bias).** The bias taxonomy (data: sampling/measurement;
  algorithmic: model/optimisation; societal: historical/structural); DPD, EOD
  and EqOdds with the worst-case and mean-pairwise multiclass strategies; the
  KS test; pre-processing (SMOTE, ADASYN, Near-Miss, Tomek links),
  in-processing (regression adjustment, adversarial training) and
  post-processing (threshold adjustment, Platt scaling); internal vs external
  validation.
- **Week 10 (transparency).** The three definitions; open-source / open-weight
  / proprietary; prediction vs inference; statistical interpretability (odds
  ratios, forest plots, interaction terms, forward/reverse selection, LASSO,
  QRISK3/NEWS2/CURB-65, GOFAI, decision trees); global vs local; feature
  selection vs importance; PDP, ICE, ALE; SHAP summary/force/dependence; LIME;
  counterfactuals; surrogate models; imaging xAI (saliency, Grad-CAM, occlusion
  sensitivity, attention); model cards; MHRA.
- **Week 11 (privacy/economics/environment).** Centralised, distributed,
  federated and split learning; weighted vs unweighted federated averaging;
  global vs local and personalised FL; Sweeney and re-identification;
  differential privacy and ε; privacy vs utility; training vs inference cost,
  model size, dataset size, iterations, hyperparameter search; early stopping
  (and grokking); transfer learning; small language models; quantisation;
  pruning; distillation; cascades; carbon-aware training.
- **Week 12 (uncertainty).** Uncertainty / variability / error; aleatoric,
  epistemic, specification and distributional uncertainty; where uncertainty
  enters the pipeline; the law of total variance decomposition; bootstrapping
  and cross-validation (including at inference); Monte Carlo propagation;
  probabilistic sensitivity analysis; Bayesian uncertainty; specification
  curves; discrimination vs calibration; calibration plots, Brier score, ECE;
  Platt recalibration.

Material **beyond** the slides is allowed but must be introduced explicitly in
the evidence rather than assumed — currently: Obermeyer et al. 2019 (label
bias); Kleinberg et al. 2016 / Chouldechova 2017 (the impossibility result);
Hardt et al. 2016; Rudin 2019; Caruana et al. 2015 (the pneumonia/asthma
interpretability case); UK GDPR Article 22 and the ICO/Turing six explanation
types; k-anonymity; confidence vs prediction intervals and empirical coverage;
conformal prediction.

## How a room works

A session is built from three **stages** that unlock in sequence — 3
questions, then 3, then 4 (**ten questions total**). Each stage is a themed
pocket of **evidence** presented through a different in-world medium: an
email inbox, a chat channel, a wiki, a blog, a marketing microsite, a
service-desk ticket queue, or — always the final, largest stage — a formal
internal record (most sessions' document archive; footprint's committee
papers portal plays the same role). A stage's evidence and questions stay
hidden behind a teaser (title, format, one-line hook) until every question in
the stage before it is solved; within an unlocked stage, its questions are
open and answerable in any order.

**Each unlocked stage is its own page, at `/sessions/<slug>/<stageId>`, meant
to be opened in a new tab.** The main session page (`/sessions/<slug>`) is a
pure control room — brief, questions, code strip, and a launcher button per
unlocked stage ("Open the inbox ↗" etc.) with a live read count — and holds
no evidence of its own. The stage page is a full, self-contained fake
application built to the medium named by its `format`: a real-feeling inbox,
chat app, wiki, blog, marketing microsite, service-desk ticket queue,
document archive or committee papers portal, with its own browser-tab title
(the stage's `chrome` string).
A group reads evidence over there and answers questions
back on the control-room tab; `localStorage` is same-origin, so the "N / M
read" count on the control room updates live across tabs as things are opened
in the stage tab. Navigating to a stage's URL before it unlocks shows a
locked placeholder, not its content.

- Each question asks one thing, and `evidenceIds` records which of *that
  stage's* (or an earlier stage's) documents it draws on — useful for the
  lecturer, not enforced by the UI beyond the validator's forward-reference
  check. Answer boxes are never disabled: a group can attempt any open
  question immediately, without having opened anything.
- Solving a question reveals a debrief (the teaching content) and awards
  **one character of the session's override code**.
- Solving every question in a stage unlocks the next stage (and its page).
- After all ten, students assemble the ten characters, in stage order then
  question order, and enter the code back on the control-room page.

Progress is per-session in `localStorage` under `dasc513:progress:<slug>`. There
is no backend, no login and no analytics; the whole app is statically
prerendered.

## Layout

```
app/
  page.tsx                       Landing page: intro + 2×2 grid of the four rooms
  sessions/[slug]/page.tsx       Server component; resolves slug → Session, renders the control room
  sessions/[slug]/[stageId]/page.tsx  Server component; resolves the stage, renders StageExperience
  layout.tsx, globals.css        Brand tokens, Poppins, fixed light scheme (not theme-aware)
components/
  SessionGrid.tsx           2×2 grid; each card reads its own progress
  SessionRunner.tsx         The control-room page: stage unlock logic, launchers, questions, final code
  QuestionPanel.tsx         One question: current / solved
  ChallengeForm.tsx         Renders a Challenge by type; checks answers
  Inline.tsx                Tiny formatter for **bold**, *italic*, `code`
  document/
    DocumentChrome.tsx       Per-EvidenceKind reading chrome (memo/email/report/…) — DocumentHeader,
                             DocumentBody, DocumentTable, and the composed DocumentReader pane
  stages/
    StageTeaser.tsx           Locked-stage card shown on the control room: title, format, hook, nothing else
  stage-pages/
    StageExperience.tsx       Client dispatcher on each stage route: checks unlock state, picks a format page
    StageLockedPage.tsx       Full-page "not open yet" state for a stage visited before it unlocks
    ListDetailShell.tsx       Shared app shape: rail + list + persistent reading pane (Inbox/Chat/Wiki/Tickets)
    GridDetailShell.tsx       Shared site shape: full-width grid ↔ full-width article (Blog/Brochure/Archive/Papers)
    InboxPage.tsx / ChatPage.tsx / WikiPage.tsx / BlogPage.tsx / BrochurePage.tsx / ArchivePage.tsx
    / TicketsPage.tsx / PapersPage.tsx
                               The eight full-page immersive formats
    BackLink.tsx               Small fixed "back to your desk" link on every stage page
lib/
  types.ts                  Session / Stage / StageFormat / Question / EvidenceItem / Challenge
  stageFormat.ts            FORMAT_LABEL / FORMAT_LAUNCH_LABEL per StageFormat
  sessions/{bias,transparency,footprint,uncertainty}.ts   ← all content lives here
  sessions/helpers.ts       allQuestions / allEvidence / stageIndexOfEvidence — flatten a session's stages
  sessions/index.ts         Registry, sorted by session.number
  answers.ts                Answer checking; forgiving numeric and text parsing
  progress.ts               localStorage exposed via useSyncExternalStore
  accents.ts                Per-session accent FILL classes (written out in full)
scripts/
  check-content.mts         Validates every session's data; run it after editing content
```

## Editing content

**All prose, data and answers live in `lib/sessions/*.ts`.** The components are
generic; you should almost never need to touch them to change a tutorial.

Rules the validator enforces (`npm run check:content`):

- Three stages per session, sized 3, 3, 4 (ten questions total), and the
  question `fragment` characters concatenated in stage order then question
  order must equal `finalCode` (10 characters).
- Every `question.evidenceIds` entry must exist in that question's own
  stage's `evidence` or an earlier stage's — never a later, still-locked
  stage's.
- Answer indices must be in range; every challenge must accept its own answer
  and reject near-misses.
- Question minutes should sum to roughly `durationMinutes` (120).

Conventions worth keeping:

- Evidence is authored as an in-world artefact — a memo, a chat export, a
  coroner's letter — not as a textbook paragraph. The teaching goes in
  `debrief`, which students only see after the question opens.
- Numeric answers must be derivable from a table in the evidence, not guessable.
- There are no hints — a question has to be solvable from the evidence and
  the `objective` alone. If a question needs a hint to be fair, that's a sign
  the question itself needs another look, not that it needs a hint.
- Every question should take a genuine step to answer, not a single lookup: a
  numeric answer should combine two or more figures (a difference, a ratio,
  a sum across rows), not just restate one cell; a choice answer should
  require synthesising more than one piece of evidence, not just spotting
  the one option that quotes a document verbatim.
- Distractor options in `multi` challenges should be plausible and are called
  out by name in the debrief, so students learn why they were wrong.
- Every stage is roughly **half decoy** — decoy evidence (items, or in a chat
  stage extra lines inside a real channel's transcript) that's pure workplace
  atmosphere and genuinely contains no clue: office-party invites, parking
  notices, birthday shoutouts, small talk before a meeting starts, IT
  reminders, other teams' threads that got cc'd by accident, calendar
  invites, newsletters. The bar is roughly as much decoy content as real
  content in each stage — an inbox with one filler email among nine real ones
  doesn't read as a lived-in inbox; real inboxes, channels and archives are
  mostly not-relevant-to-you. It exists so a group has to recognise what's
  signal, not just read everything in the stage — it must never appear in
  any question's `evidenceIds`, must read as plausibly mundane rather than as
  an obvious joke, must vary in length and tone the way real workplace
  clutter does (not ten decoys that are all the same "notice" shape), and
  must match the stage's `kind` constraints like any other item (a chat
  stage can't gain a fifth channel for this — fold the banter into the
  existing four channels' transcripts instead, at real-Slack-channel
  density).
- A stage's `format` picks which full page it renders as (`inbox | chat |
  wiki | blog | brochure | archive | tickets | papers`); an evidence item's
  `kind` separately picks its own reading-pane chrome inside
  `components/document/DocumentChrome.tsx`
  (`memo | email | dataset | report | policy | transcript | code | ticket |
  press | forum`) — the two are independent, so an inbox stage can still mix
  a forwarded press release with a plain email.
- An inbox item that's really a reply chain — a forward, a back-and-forth —
  is still **one** `EvidenceItem` and **one** inbox row: give it `kind:
  "email"` and a `thread: EmailMessage[]` array instead of `source`/`date`/
  `body` (leave those as `""`/`[]`; they're ignored when `thread` is set).
  Each `EmailMessage` carries its own `from`/`to`/`date`/`body`, and the
  reading pane renders them as a stacked sequence of separate message cards —
  the Outlook/Gmail conversation-view shape — inside the one window the row
  opens. A genuinely single-message email keeps using plain `source`/`date`/
  `body` as before; don't reach for `thread` unless there's more than one
  message. Decoy emails should use `thread` freely, not just real ones — a
  lived-in inbox's filler is mostly reply chains too (an RSVP thread, a
  back-and-forth about a booking), not one-shot notices.
- `EvidenceItem.folder` (`archive`- and `papers`-stage only) is what the page
  groups its items into — a folder in an `archive` stage, an agenda-item
  label in a `papers` stage. Give every item in such a stage a `folder`
  string, real and decoy alike, so the page shows real groupings (e.g.
  "Assurance case", "Facilities & Estates", "HR & Training" for an archive;
  "Item 6 — VITAL-LM data protection assurance" for a papers stage) that a
  group opens into, rather than one flat pile. Decoys should mostly cluster
  into their own thematic groupings away from the case file, the way a real
  shared drive (or a real committee agenda) keeps admin clutter separate
  from the actual investigation — that separation is itself part of what
  makes a grouping "obviously not relevant" without a question ever saying
  so.
- `EvidenceItem.queue` and `.status` (`tickets`-stage only) are what the
  service-desk page files a ticket under and the lifecycle badge it shows
  (`"Open" | "Pending" | "Resolved" | "Closed"`, free text). Give every ticket
  a `queue`; `status` is purely cosmetic and defaults to "Open". A `tickets`
  stage's items all use `kind: "ticket"`, and a multi-person exchange is
  written as `body` paragraphs with a `**Name.**` lead per turn (the same
  `groupTurns` convention `DocumentChrome.tsx` already uses for ticket/forum
  kinds) rather than `thread` — `thread` is for `kind: "email"` only.
- **A `chat`-format stage is exactly eight channels, and every item in it
  must be `kind: "transcript"`.** Four are real — the ones at least one
  question's `evidenceIds` draws on — and four are pure decoy: a whole
  channel of world-building with no clue value, never referenced by any
  `evidenceIds`, at least a full page of messages (not a couple of lines — a
  real busy channel has history). Decoy channels want their own distinct
  flavour rather than four versions of the same joke: a social-committee
  channel, an on-call/ops channel, a now-dead project's channel nobody
  archived, a regional-office or new-starters channel, that kind of thing.
  Nothing sits in a chat stage's sidebar as a pinned document — a table, a
  set of definitions, a reference note all have to arrive as something
  someone actually typed into a channel (a message introducing a pasted
  table, a colleague explaining a formula in a Q&A exchange), not as a
  `dataset`/`report`/`policy`/`memo` item alongside the conversations. A
  message that shares the item's `table` embeds the literal token
  `{{table}}` in its text
  (see `TABLE_TOKEN` in `components/document/DocumentChrome.tsx`) — the
  reading pane swaps it for a clickable "Open table" chip that pops the
  table out in a modal, the way a real chat client turns a shared file into
  an attachment rather than pasting the whole spreadsheet into the channel.
  If content doesn't fit any channel as a plausible message, it belongs in a
  different stage (the archive, the blog) instead of being wedged in here.
- Accents are `coral | teal` — the two brand accents. Tailwind cannot see
  interpolated class names, so each is written out in full in `lib/accents.ts`.
  See *House style* below before touching anything visual.

## House style

The site follows Samuel's PowerPoint template. The palette is fixed and the
rules are strict; `app/globals.css` carries the tokens and the reasoning.

**Exception: the eight stage pages** (`components/stage-pages/{Inbox,Chat,Wiki,
Blog,Brochure,Archive,Tickets,Papers}Page.tsx`) are exempt by design. They're
meant to look like a real inbox, a real chat app, a real wiki, a real blog, a
real marketing site, a real document-management system, a real service-desk
tool and a real local-government committee papers system, not like the
DASC513 brand wearing a costume — so each has its own unmixed palette
(Gmail-ish blue/red, Slack's dark aubergine, Confluence blue, an editorial
cream/stone blog, an indigo/violet SaaS gradient, a neutral slate records
system, a charcoal/amber ITSM console, an olive-and-cream govtech portal) and
none of them touch navy/coral/teal. `components/document/DocumentChrome.tsx`
(the per-`EvidenceKind` reading-pane content shared by all eight) is neutral
slate/white for the same reason — it has to look plausible inside any of the
eight skins, not branded like the teaching tool around it. Everything else in
the app — the control room (`SessionRunner.tsx`), `StageTeaser`,
`StageLockedPage`, the landing page — keeps the real house style below, since
those are the DASC513 tool's own UI, not a fake app a group is visiting.

| Role | Hex | Where it may appear |
|---|---|---|
| Navy | `#242D5C` | **All** text, **all** rules, borders and focus rings; dark grounds |
| Coral | `#EE416F` | Filled shapes only |
| Teal | `#00A588` | Filled shapes only |
| White | `#FFFFFF` | Content grounds; text and rules on navy |

- **Accent colours are a background fill and nothing else.** Never
  `text-coral`, never `border-teal`, never an accent ring. That is why
  `AccentStyle` exposes only `fill` and `fillInteractive` — the type makes the
  wrong thing hard to write.
- Anything that needs emphasis gets a fill with white text on it, or navy
  weight and a navy rule. There is no warning colour in the brand: error and
  "unread" states use a navy left bar and bold navy type, not amber or red.
- **Poppins only** — there is no monospace face. The small tracked-out labels
  that used to be `font-mono` are `.label` (Poppins, uppercase, letter-spaced)
  and numeric columns use `.numeric` (tabular figures).
- Navy alpha tokens (`navy-90` … `navy-04`) and `white-70` exist so tints and
  hairlines stay navy or white rather than reaching for a grey.
- Layout follows the template's slide types: navy full-bleed bands for the
  landing hero and each room's header (the divider slide, with its accent
  left-edge bar), white grounds for content, navy top-strips on cards,
  accent-filled numbered circles, and a question counter bottom-right of each
  panel standing in for the slide number.

## Commands

```bash
npm run dev            # http://localhost:3000
npm run check:content  # validate session data (run after any content edit)
npm run check          # content + tsc --noEmit + eslint + next build
npm run build
```

Node's native TypeScript stripping runs `scripts/check-content.mts` directly, so
the script imports with explicit `.ts` extensions and `tsconfig.json` sets
`allowImportingTsExtensions`.

## Known state / next steps

- All four rooms run the three-stage, ten-question model (see *How a room
  works*). Stage themes: bias = inbox → chat → archive; transparency = wiki →
  blog → archive; footprint = brochure → tickets → papers; uncertainty = chat
  → blog → archive. All four still cover their full Week 9–12 curriculum list
  from *Alignment with the lectures* — the ten-question expansion added depth
  (a dedicated taxonomy/classification question in every Stage C) rather
  than dropping anything.
- Stage pages, cross-tab progress sync, and the locked-stage guard have been
  spot-checked in a real browser across all eight formats; the app has not
  been playtested as a live two-hour session end to end.
- No per-group persistence beyond `localStorage`. If tutors need to see group
  progress, that is a new feature, not a tweak.
- `lib/devFlags.ts` currently has `ALL_STAGES_UNLOCKED = true` — every stage
  is open regardless of solve progress, for easy review. Flip it back to
  `false` before running a real session, or the three-stage progression
  won't gate anything.
