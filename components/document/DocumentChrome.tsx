import type { EmailMessage, EvidenceItem, EvidenceKind } from "@/lib/types";
import { Inline } from "../Inline";

/** A small rotating palette for sender/avatar accents, picked deterministically
 * from an id — not the DASC513 brand accent, which has no business appearing
 * inside content meant to look like it came from outside the teaching tool. */
const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-rose-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-violet-600",
  "bg-cyan-600",
];

function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/**
 * Neutral, professional-document colours — deliberately NOT the DASC513
 * navy/coral/teal brand. This content is meant to look like it was lifted
 * out of a real inbox, wiki or archive, not out of the teaching tool around
 * it, so it stays plain dark-grey-on-white wherever it appears.
 */

export const KIND_LABEL: Record<EvidenceKind, string> = {
  memo: "Memo",
  email: "Email",
  dataset: "Data",
  report: "Report",
  policy: "Policy",
  transcript: "Transcript",
  code: "Technical",
  ticket: "Log",
  press: "Public",
  forum: "Forum",
};

/** Deterministic small integer from an id, so a "reference number" is stable
 * across renders without being stored as real content anywhere. */
export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function isAnnotation(paragraph: string): boolean {
  const t = paragraph.trim();
  return t.startsWith("*") && t.endsWith("*") && !t.startsWith("**");
}

/** A paragraph authored as `**Label.** the rest of it` splits into a field
 * name and its value — the shape a memo, form or spec sheet actually has,
 * rather than a markdown paragraph with a bold word at the front. */
function splitLead(paragraph: string): { lead: string; rest: string } | null {
  const m = /^\*\*([^*]+)\*\*\s*([\s\S]*)$/.exec(paragraph.trim());
  if (!m) return null;
  return { lead: m[1], rest: m[2].replace(/^[—-]\s*/, "") };
}

function isQuotedValue(text: string): boolean {
  return /^['‘]/.test(text.trim());
}

interface Turn {
  lead: string | null;
  parts: string[];
}

/** Groups a body's paragraphs into per-speaker turns: a paragraph with a
 * `**Lead.**` starts a new turn, and an unmarked paragraph continues the
 * turn before it. Used wherever a document is really several distinct
 * messages (an email thread, a log, a comment thread) so each one can be
 * rendered as its own card instead of one undifferentiated block. */
function groupTurns(body: string[]): Turn[] {
  const turns: Turn[] = [];
  for (const paragraph of body) {
    const split = splitLead(paragraph);
    if (split) {
      turns.push({ lead: split.lead, parts: [split.rest] });
    } else if (turns.length > 0) {
      turns[turns.length - 1].parts.push(paragraph);
    } else {
      turns.push({ lead: null, parts: [paragraph] });
    }
  }
  return turns;
}

/** Numbered points, like a real memo listing its action items. */
function MemoBody({ item }: { item: EvidenceItem }) {
  return (
    <ol className="space-y-4">
      {item.body.map((paragraph, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
            {index + 1}
          </span>
          <p className="text-sm leading-relaxed text-slate-800">
            <Inline text={paragraph} />
          </p>
        </li>
      ))}
    </ol>
  );
}

/** A quoted reading pane, the way a received message actually looks. */
/** One message, one email. A thread is several separate EvidenceItems, each
 * with its own from/to — never several people's turns folded into one
 * document — so this only ever renders a single sender's text. */
/** A single message's own from/to/date strip, the way each message in an
 * expanded Outlook/Gmail conversation carries its own mini-header. */
function MessageHeader({ message }: { message: EmailMessage }) {
  const initial = message.from.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="mb-2 flex items-start gap-2 border-b border-slate-100 pb-2">
      <span
        aria-hidden
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(message.from)}`}
      >
        {initial}
      </span>
      <dl className="min-w-0 flex-1 space-y-0.5 text-xs text-slate-600">
        <div className="flex gap-1.5">
          <dt className="shrink-0 font-semibold text-slate-800">From</dt>
          <dd className="min-w-0 truncate">{message.from}</dd>
        </div>
        {message.to ? (
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-slate-800">To</dt>
            <dd className="min-w-0 truncate">{message.to}</dd>
          </div>
        ) : null}
        {message.date ? (
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-slate-800">Date</dt>
            <dd>{message.date}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function EmailBody({ item }: { item: EvidenceItem }) {
  if (item.thread && item.thread.length > 0) {
    return (
      <div className="space-y-3">
        {item.thread.map((message, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <MessageHeader message={message} />
            <div className="space-y-2 text-sm leading-relaxed text-slate-800">
              {message.body.map((paragraph, i) => (
                <p key={i}>
                  <Inline text={paragraph} />
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-800">
      {item.body.map((paragraph, index) => (
        <p key={index}>
          <Inline text={paragraph} />
        </p>
      ))}
    </div>
  );
}

/** A fact sheet: each labelled finding gets its own row rather than sitting
 * inline in a sentence. */
function ReportBody({ item }: { item: EvidenceItem }) {
  return (
    <div className="divide-y divide-slate-200">
      {item.body.map((paragraph, index) => {
        const split = splitLead(paragraph);
        if (!split) {
          return (
            <p
              key={index}
              className="py-3 text-sm leading-relaxed text-slate-800 first:pt-0"
            >
              <Inline text={paragraph} />
            </p>
          );
        }
        return (
          <div key={index} className="py-3 first:pt-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {split.lead}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">
              <Inline text={split.rest} />
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** A compliance form: each question is a tagged field, and a quoted answer
 * sits in its own indented box the way a sign-off form actually reads. */
function PolicyBody({ item }: { item: EvidenceItem }) {
  return (
    <div className="space-y-4">
      {item.body.map((paragraph, index) => {
        const split = splitLead(paragraph);
        if (!split) {
          return (
            <p key={index} className="text-sm leading-relaxed text-slate-800">
              <Inline text={paragraph} />
            </p>
          );
        }
        return (
          <div key={index}>
            <span className="inline-block rounded border border-slate-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {split.lead}
            </span>
            <p
              className={
                isQuotedValue(split.rest)
                  ? "mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm italic leading-relaxed text-slate-800"
                  : "mt-2 text-sm leading-relaxed text-slate-800"
              }
            >
              <Inline text={split.rest} />
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** A spec-sheet readout: each channel/parameter as its own tile. */
function CodeBody({ item }: { item: EvidenceItem }) {
  return (
    <div className="space-y-3">
      {item.body.map((paragraph, index) => {
        const split = splitLead(paragraph);
        if (!split) {
          return (
            <p key={index} className="text-sm leading-relaxed text-slate-800">
              <Inline text={paragraph} />
            </p>
          );
        }
        return (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {split.lead}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">
              <Inline text={split.rest} />
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** A log feed: dashed dividers between entries, like an audit trail. */
function TicketBody({ item }: { item: EvidenceItem }) {
  const turns = groupTurns(item.body);
  return (
    <div className="space-y-3">
      {turns.map((turn, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
          {turn.lead ? (
            <p className="text-xs font-bold text-slate-700">{turn.lead}</p>
          ) : null}
          <div className={`space-y-2 text-sm leading-relaxed text-slate-800 ${turn.lead ? "mt-1.5" : ""}`}>
            {turn.parts.map((part, i) => (
              <p key={i}>
                <Inline text={part} />
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A newspaper column: quoted lines break out as pull-quotes, and the lead
 * paragraph gets a drop cap. */
function PressBody({ item }: { item: EvidenceItem }) {
  return (
    <div className="space-y-4">
      {item.body.map((paragraph, index) => {
        if (isQuotedValue(paragraph)) {
          return (
            <p
              key={index}
              className="border-y border-slate-200 py-3 text-center text-base italic leading-relaxed text-slate-800"
            >
              <Inline text={paragraph} />
            </p>
          );
        }
        const trimmed = paragraph.trim();
        if (index === 0 && /[A-Za-z]/.test(trimmed.charAt(0))) {
          return (
            <p key={index} className="text-sm leading-relaxed text-slate-800">
              <span className="float-left mr-2 mt-1 text-4xl font-bold leading-none text-slate-900">
                {trimmed.charAt(0)}
              </span>
              <Inline text={trimmed.slice(1)} />
            </p>
          );
        }
        return (
          <p key={index} className="text-sm leading-relaxed text-slate-800">
            <Inline text={paragraph} />
          </p>
        );
      })}
    </div>
  );
}

/** Field notes ahead of the table: a caption, not a paragraph. */
function DataBody({ item }: { item: EvidenceItem }) {
  return (
    <div className="space-y-2">
      {item.body.map((paragraph, index) => (
        <p
          key={index}
          className="border-l-2 border-slate-300 pl-3 text-sm italic leading-relaxed text-slate-600"
        >
          <Inline text={paragraph} />
        </p>
      ))}
    </div>
  );
}

/** An interview or chat log: alternating bubbles, with pure narration
 * ("*No further messages*") breaking out as a centred caption. */
export function TranscriptBody({ item }: { item: EvidenceItem }) {
  return (
    <div className="flex flex-col">
      {item.body.map((paragraph, index) => {
        if (isAnnotation(paragraph)) {
          return (
            <p
              key={index}
              className="py-3 text-center text-xs italic text-slate-500"
            >
              <Inline text={paragraph} />
            </p>
          );
        }
        const split = splitLead(paragraph);
        if (!split) {
          return (
            <p key={index} className="py-1.5 text-sm leading-relaxed text-slate-800">
              <Inline text={paragraph} />
            </p>
          );
        }
        return (
          <div key={index} className="flex gap-3 rounded px-1 py-2 hover:bg-slate-50">
            <span
              aria-hidden
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded text-xs font-bold text-white ${avatarColor(split.lead)}`}
            >
              {split.lead.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{split.lead}</p>
              <p className="text-sm leading-relaxed text-slate-800">
                <Inline text={split.rest} />
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** A forum thread: the opening post gets a highlighted box, replies are
 * indented underneath it with a connecting rule, the way a comment thread
 * actually nests. */
function ForumBody({ item }: { item: EvidenceItem }) {
  const turns = groupTurns(item.body);
  return (
    <div className="space-y-3">
      {turns.map((turn, index) => {
        const isOp = index === 0;
        return (
          <div
            key={index}
            className={
              isOp
                ? "rounded-lg border-l-4 border-slate-700 bg-slate-50 p-4"
                : "ml-4 rounded-lg border border-slate-200 bg-white p-4"
            }
          >
            {turn.lead ? (
              <p className="text-xs font-bold text-slate-700">
                {turn.lead}
                {isOp ? (
                  <span className="ml-2 rounded border border-slate-300 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                    Original post
                  </span>
                ) : null}
              </p>
            ) : null}
            <div className={`space-y-2 text-sm leading-relaxed text-slate-800 ${turn.lead ? "mt-1" : ""}`}>
              {turn.parts.map((part, i) => (
                <p key={i}>
                  <Inline text={part} />
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DocumentBody({ item }: { item: EvidenceItem }) {
  switch (item.kind) {
    case "memo":
      return <MemoBody item={item} />;
    case "email":
      return <EmailBody item={item} />;
    case "report":
      return <ReportBody item={item} />;
    case "policy":
      return <PolicyBody item={item} />;
    case "code":
      return <CodeBody item={item} />;
    case "ticket":
      return <TicketBody item={item} />;
    case "press":
      return <PressBody item={item} />;
    case "dataset":
      return <DataBody item={item} />;
    case "transcript":
      return <TranscriptBody item={item} />;
    case "forum":
      return <ForumBody item={item} />;
  }
}

export function DocumentTable({ item }: { item: EvidenceItem }) {
  if (!item.table) return null;
  const table = item.table;
  return (
    <figure className="mt-4">
      {table.caption ? (
        <figcaption className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          {table.caption}
        </figcaption>
      ) : null}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-800 text-white">
              {table.headers.map((header) => (
                <th key={header} scope="col" className="px-3 py-2 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => {
              const flagged = table.highlight?.includes(rowIndex) ?? false;
              return (
                <tr
                  key={rowIndex}
                  className={`border-t border-slate-200 ${
                    flagged ? "bg-slate-100 font-semibold" : ""
                  }`}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`px-3 py-2 align-top ${
                        cellIndex === 0 ? "" : "tabular-nums"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {table.footnote ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          <Inline text={table.footnote} />
        </p>
      ) : null}
    </figure>
  );
}

/**
 * Each kind gets its own header chrome — a memo has a letterhead, an email
 * has a sender line, a ticket has a stub — so the dossier reads as a stack of
 * different real artefacts rather than one template with a label swapped.
 */
export function DocumentHeader({ item }: { item: EvidenceItem }) {
  switch (item.kind) {
    case "memo":
      return (
        <div>
          <div className="bg-slate-800 px-6 py-5 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
              Meridian Health Analytics · Memorandum
            </p>
            <h3 className="mt-1.5 text-lg font-bold leading-snug">
              {item.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-slate-200 px-6 py-3 text-xs text-slate-600">
            <p>
              <span className="font-semibold text-slate-800">From </span>
              {item.source}
            </p>
            {item.date ? (
              <p>
                <span className="font-semibold text-slate-800">Date </span>
                {item.date}
              </p>
            ) : null}
          </div>
        </div>
      );

    case "email": {
      if (item.thread && item.thread.length > 0) {
        const participants = Array.from(new Set(item.thread.map((m) => m.from)));
        return (
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-lg font-bold leading-snug text-slate-900">{item.title}</h3>
            <p className="mt-1.5 text-xs text-slate-500">{participants.join(", ")}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {item.thread.length} messages
            </p>
          </div>
        );
      }
      // Content authors write `source` as "Sender → Recipient" (or "↔" for a
      // two-way thread); a source with no arrow at all is a multi-party
      // thread, listed as participants instead of a single from/to pair.
      const hasDirection = /→|↔/.test(item.source);
      const [from, to] = hasDirection
        ? item.source.split(/\s*(?:→|↔)\s*/)
        : [item.source, undefined];
      const initial = (from ?? item.source).trim().charAt(0).toUpperCase() || "?";
      return (
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(item.id)}`}
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold leading-snug text-slate-900">
                {item.title}
              </h3>
              <dl className="mt-2 space-y-0.5 text-xs text-slate-600">
                <div className="flex gap-1.5">
                  <dt className="shrink-0 font-semibold text-slate-800">
                    {hasDirection ? "From" : "Participants"}
                  </dt>
                  <dd className="min-w-0 truncate">{from}</dd>
                </div>
                {to ? (
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 font-semibold text-slate-800">To</dt>
                    <dd className="min-w-0 truncate">{to}</dd>
                  </div>
                ) : null}
                {item.date ? (
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 font-semibold text-slate-800">Date</dt>
                    <dd>{item.date}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </div>
      );
    }

    case "report":
      return (
        <div className="relative overflow-hidden border-b border-slate-200">
          <span aria-hidden className="absolute inset-y-0 left-0 w-2 bg-slate-700" />
          <div className="px-6 py-5 pl-8">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Report
            </p>
            <h3 className="mt-1.5 text-lg font-bold leading-snug text-slate-900">
              {item.title}
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              {item.source}
              {item.date ? ` · ${item.date}` : ""}
            </p>
          </div>
        </div>
      );

    case "policy": {
      const ref = `MHA-${(hashId(item.id) % 900) + 100}`;
      return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 py-5 pl-6 pr-16">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Policy · Compliance
            </p>
            <h3 className="mt-1.5 text-lg font-bold leading-snug text-slate-900">
              {item.title}
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              {item.source}
              {item.date ? ` · ${item.date}` : ""}
            </p>
          </div>
          <div className="shrink-0 rounded border border-slate-300 px-2.5 py-1.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Form
            </p>
            <p className="text-xs font-bold tabular-nums">{ref}</p>
          </div>
        </div>
      );
    }

    case "code":
      return (
        <div className="bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-white/40" />
            <span className="h-2 w-2 rounded-full bg-white/40" />
            <span className="h-2 w-2 rounded-full bg-white/40" />
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-white/60">
            Technical documentation
          </p>
          <h3 className="mt-1 text-lg font-bold leading-snug">
            {item.title}
          </h3>
          <p className="mt-1 text-xs text-white/60">{item.source}</p>
        </div>
      );

    case "ticket": {
      const ref = ((hashId(item.id) % 9000) + 1000).toString();
      return (
        <div className="border-b-2 border-dashed border-slate-300 py-5 pl-6 pr-16">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Log · Ref #{ref}
              </p>
              <h3 className="mt-1.5 text-lg font-bold leading-snug text-slate-900">
                {item.title}
              </h3>
            </div>
            <span className="shrink-0 rounded-full bg-slate-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Logged
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {item.source}
            {item.date ? ` · ${item.date}` : ""}
          </p>
        </div>
      );
    }

    case "press":
      return (
        <div className="px-6 pb-4 pt-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Public statement
          </p>
          <h3 className="mt-2 text-xl font-bold leading-snug text-slate-900">
            {item.title}
          </h3>
          <div className="mx-auto mt-3 w-24">
            <span aria-hidden className="block h-[3px] bg-slate-800" />
            <span aria-hidden className="mt-0.5 block h-px bg-slate-800" />
          </div>
          <p className="mt-3 text-xs italic text-slate-500">
            {item.source}
            {item.date ? ` · ${item.date}` : ""}
          </p>
        </div>
      );

    case "forum": {
      const replies = Math.max(item.body.length - 1, 0);
      return (
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Forum thread
          </p>
          <h3 className="mt-1.5 text-lg font-bold leading-snug text-slate-900">
            {item.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>
              {item.source}
              {item.date ? ` · ${item.date}` : ""}
            </span>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-white">
              {replies} {replies === 1 ? "reply" : "replies"}
            </span>
          </div>
        </div>
      );
    }

    case "dataset":
    case "transcript":
    default:
      return (
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {KIND_LABEL[item.kind]}
          </p>
          <h3 className="mt-1.5 text-lg font-bold leading-snug text-slate-900">
            {item.title}
          </h3>
          <p className="mt-2 text-xs text-slate-500">
            {item.source}
            {item.date ? ` · ${item.date}` : ""}
          </p>
        </div>
      );
  }
}

/** What a list row (an inbox row, a search result) shows for an item —
 * works whether it's a single message or a whole thread, so callers never
 * need to branch on `item.thread` themselves. */
export function emailPreview(
  item: EvidenceItem,
): { from: string; date?: string; snippet: string; count: number } {
  if (item.thread && item.thread.length > 0) {
    const participants = Array.from(new Set(item.thread.map((m) => m.from)));
    const last = item.thread[item.thread.length - 1];
    return {
      from: participants.join(", "),
      date: last.date ?? item.date,
      snippet: (last.body[0] ?? "").replace(/[*_`]/g, ""),
      count: item.thread.length,
    };
  }
  return {
    from: item.source,
    date: item.date,
    snippet: (item.body[0] ?? "").replace(/[*_`]/g, ""),
    count: 1,
  };
}

/** The full reading pane, composed — header, body, table, a kind footer
 * strip — as one bordered "paper" card. Every format page's detail view is
 * this, dropped into that format's own frame. */
export function DocumentReader({ item }: { item: EvidenceItem }) {
  const isDataset = item.kind === "dataset";
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <DocumentHeader item={item} />
      <div
        className="flex-1 overflow-y-auto px-6 py-5"
        style={
          isDataset
            ? {
                backgroundImage:
                  "radial-gradient(rgba(15,23,42,0.06) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
              }
            : undefined
        }
      >
        <DocumentBody item={item} />
        <DocumentTable item={item} />
      </div>
      <div className="border-t border-slate-200 px-6 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {KIND_LABEL[item.kind]}
      </div>
    </div>
  );
}

/** A blank state for a detail pane before anything's selected. */
export function EmptyReader({ hint }: { hint: string }) {
  return (
    <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-6 py-10 text-center">
      <p className="text-sm text-slate-500">
        <Inline text={hint} />
      </p>
    </div>
  );
}
