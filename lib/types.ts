/**
 * Shared types for the DASC513 escape-room tutorials.
 *
 * A Session is one two-hour tutorial, built from three Gates that unlock in
 * sequence (3 locks, then 3, then 4 — ten locks total). Each Gate is a
 * themed pocket of evidence (an inbox, a chat channel, a wiki, a blog, a
 * marketing microsite, or the formal archive) plus the locks that draw on
 * it. A gate's evidence and locks are hidden — only a title, format and
 * one-line teaser show — until every lock in the previous gate is solved.
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
   * Archive-gate only: the folder this document is filed under (e.g.
   * "Assurance case", "Facilities & Estates"). Ignored by every other gate
   * format. Give every item in an `archive`-format gate a folder — a gate
   * where nothing sets it falls back to the old flat file list.
   */
  folder?: string;
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
      /** Any of these (case/punctuation-insensitive) unlocks the stage. */
      accept: string[];
      placeholder?: string;
    };

export interface Stage {
  id: string;
  title: string;
  /** Rough time budget, used to show pacing against the two-hour session. */
  minutes: number;
  /** Narrative set-up shown when the stage opens. */
  scenario: string[];
  /** The one-line question the group has to answer. */
  objective: string;
  /** Evidence this lock's answer draws on; not enforced by the UI. */
  evidenceIds: string[];
  challenge: Challenge;
  /** Shown once the stage is solved: the teaching point. */
  debrief: string[];
  /** Character added to the session's final override code. */
  fragment: string;
}

/**
 * The in-world medium a gate's evidence is presented through. `archive` is
 * the plain filed-documents treatment every session's final gate uses;
 * the others are lighter, more informal media that come before it.
 */
export type GateFormat = "inbox" | "chat" | "wiki" | "blog" | "brochure" | "archive";

export interface Gate {
  id: string;
  /** e.g. "Gate A — The Inbox". */
  title: string;
  format: GateFormat;
  /** In-world label the gate's shell renders prominently: an app name, a
   * channel handle, a site masthead, a URL-style tagline. */
  chrome: string;
  /** One-line in-world hook shown while the gate is still locked. */
  teaser: string;
  /** Shown once unlocked, above the gate's stages — sets the scene. */
  intro: string[];
  evidence: EvidenceItem[];
  /** Three locks in Gates A and B, four in Gate C. */
  stages: Stage[];
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
  gates: [Gate, Gate, Gate];
  /** Concatenated stage fragments, gate order then stage order (10 chars). */
  finalCode: string;
  finale: {
    prompt: string;
    debrief: string[];
  };
}
