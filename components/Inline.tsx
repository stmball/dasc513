import { Fragment, type ReactNode } from "react";

const TOKEN = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;

/**
 * Minimal inline formatter for dossier copy: **bold**, *italic* and `code`.
 * Deliberately not a markdown parser — the content is authored in this repo.
 *
 * There is no monospace face in the brand, so `code` is Poppins on a navy
 * tint rather than a different typeface.
 */
export function Inline({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, index) => {
        let node: ReactNode = part;
        if (part.startsWith("**") && part.endsWith("**")) {
          node = <strong className="font-semibold">{part.slice(2, -2)}</strong>;
        } else if (
          part.length > 2 &&
          part.startsWith("*") &&
          part.endsWith("*")
        ) {
          node = <em>{part.slice(1, -1)}</em>;
        } else if (part.startsWith("`") && part.endsWith("`")) {
          node = (
            <code className="rounded bg-navy-08 px-1.5 py-0.5 text-[0.88em] tracking-tight">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={index}>{node}</Fragment>;
      })}
    </>
  );
}
