/**
 * Shared types for the DASC513 escape-room tutorials.
 *
 * A Session is one two-hour tutorial, built from three Stages that unlock in
 * sequence (3 questions, then 3, then 4 — ten questions total). Each Stage is
 * a themed pocket of evidence (an inbox, a chat channel, a wiki, a blog, a
 * marketing microsite, or the formal archive) plus the questions that draw on
 * it. A stage's evidence and questions are hidden — only a title, format and
 * one-line teaser show — until every question in the previous stage is
 * solved.
 */

export type EvidenceKind =
  | "memo"
  | "email"
  | "dataset"
  | "report"
  | "policy"
  | "transcript"
  | "code"
  | "ticket"
  | "press"
  | "forum";

export interface EvidenceTable {
  caption?: string;
  headers: string[];
  rows: string[][];
  /** Zero-based row indices to visually flag as noteworthy. */
  highlight?: number[];
  footnote?: string;
}

/** One message inside an email thread — its own from/to/date, the way a
 * single message reads inside a real Outlook/Gmail conversation view. */
export interface EmailMessage {
  from: string;
  to?: string;
  date?: string;
  /** Paragraphs. Supports **bold**, *italic* and `code` inline. */
  body: string[];
}

export interface EvidenceItem {
  id: string;
  title: string;
  kind: EvidenceKind;
  /** Where the document purports to come from, e.g. "Meridian wiki, v3.1". */
  source: string;
  date?: string;
  /** Paragraphs. Supports **bold**, *italic* and `code` inline. Unused when
   * `thread` is set. */
  body: string[];
  table?: EvidenceTable;
  /**
   * For `kind: "email"` only: when a document is really several messages —
   * an original plus a reply, a forward, a back-and-forth — set `thread`
   * instead of `body`/`source`/`date`. It renders as one inbox item that
   * opens to a stacked sequence of separate messages, each with its own
   * from/to/date, the way a real mail client expands a conversation.
   */
  thread?: EmailMessage[];
  /**
   * `archive`- and `papers`-stage only: the grouping this document is filed
   * under — a folder name for an archive ("Assurance case", "Facilities &
   * Estates"), or an agenda-item label for a papers stage ("Item 6 — VITAL-LM
   * data protection and sustainability assurance"). Ignored by every other
   * stage format. Give every item in an `archive`- or `papers`-format stage
   * one — a stage where nothing sets it falls back to the old flat file list.
   */
  folder?: string;
  /**
   * `tickets`-stage only: the service-desk queue this ticket sits in (e.g.
   * "Information Governance", "IT Service Desk"). Ignored by every other
   * stage format. Give every item in a `tickets`-format stage a queue.
   */
  queue?: string;
  /**
   * `tickets`-stage only: the lifecycle badge shown on the ticket row and in
   * its header (e.g. "Open", "Pending", "Resolved", "Closed"). Ignored by
   * every other stage format. Purely cosmetic — not read by any question.
   */
  status?: string;
}

export type Challenge =
  | {
      type: "single";
      prompt: string;
      options: string[];
      answer: number;
    }
  | {
      type: "multi";
      prompt: string;
      options: string[];
      answers: number[];
    }
  | {
      type: "numeric";
      prompt: string;
      answer: number;
      /** Absolute tolerance, inclusive. */
      tolerance: number;
      unit?: string;
      placeholder?: string;
    }
  | {
      type: "text";
      prompt: string;
      /** Any of these (case/punctuation-insensitive) unlocks the question. */
      accept: string[];
      placeholder?: string;
    };

export interface Question {
  id: string;
  title: string;
  /** Rough time budget, used to show pacing against the two-hour session. */
  minutes: number;
  /** Narrative set-up shown when the question opens. */
  scenario: string[];
  /** The one-line question the group has to answer. */
  objective: string;
  /** Evidence this question's answer draws on; not enforced by the UI. */
  evidenceIds: string[];
  challenge: Challenge;
  /** Shown once the question is solved: the teaching point. */
  debrief: string[];
  /** Character added to the session's final override code. */
  fragment: string;
}

/**
 * The in-world medium a stage's evidence is presented through. `archive` and
 * `papers` are the two formal filed-documents treatments a session's final
 * stage can use; the others are lighter, more informal media that come
 * before it.
 */
export type StageFormat =
  | "inbox"
  | "chat"
  | "wiki"
  | "blog"
  | "brochure"
  | "archive"
  | "tickets"
  | "papers";

export interface Stage {
  id: string;
  /** e.g. "Stage A — The Inbox". */
  title: string;
  format: StageFormat;
  /** In-world label the stage's shell renders prominently: an app name, a
   * channel handle, a site masthead, a URL-style tagline. */
  chrome: string;
  /** One-line in-world hook shown while the stage is still locked. */
  teaser: string;
  /** Shown once unlocked, above the stage's questions — sets the scene. */
  intro: string[];
  evidence: EvidenceItem[];
  /** Three questions in Stages A and B, four in Stage C. */
  questions: Question[];
}

export interface Session {
  slug: string;
  /** 1-4, drives the grid order. */
  number: number;
  /** The curriculum theme this tutorial covers. */
  theme: string;
  /** The escape-room title. */
  title: string;
  tagline: string;
  /**
   * Brand accent used as a *fill* on this room's shapes. The brand has two;
   * they never appear on text, lines or borders. See lib/accents.ts.
   */
  accent: "coral" | "teal";
  durationMinutes: number;
  subject: {
    company: string;
    product: string;
    oneLiner: string;
  };
  /** Your role in the fiction. */
  brief: string[];
  learningOutcomes: string[];
  /** Exactly three: sizes 3, 3, 4. Unlock in order. */
  stages: [Stage, Stage, Stage];
  /** Concatenated question fragments, stage order then question order (10
   * chars). */
  finalCode: string;
  finale: {
    prompt: string;
    debrief: string[];
  };
}
