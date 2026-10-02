import type { Gate } from "@/lib/types";
import { FORMAT_LABEL } from "@/lib/gateFormat";
import { Inline } from "../Inline";

/** A locked gate: title, format and a one-line hook are visible, nothing
 * else — the card that shows what's next without giving it away. */
export function GateTeaser({
  gate,
  previousGateTitle,
}: {
  gate: Gate;
  previousGateTitle: string;
}) {
  return (
    <section className="rounded-xl border border-dashed border-navy-30 bg-white px-5 py-6 text-center">
      <span
        aria-hidden
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-navy-30"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect
            x="3"
            y="7"
            width="10"
            height="7"
            rx="1.5"
            stroke="#242D5C"
            strokeWidth="1.4"
          />
          <path
            d="M5 7V5a3 3 0 0 1 6 0v2"
            stroke="#242D5C"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <p className="mt-3 text-[11px] font-semibold text-navy-55 label">
        Locked · {FORMAT_LABEL[gate.format]}
      </p>
      <h3 className="mt-1.5 text-lg font-bold text-navy-55">{gate.title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm italic leading-relaxed text-navy-55">
        <Inline text={gate.teaser} />
      </p>
      <p className="mt-3 text-xs font-semibold text-navy-30 label">
        Unlocks after {previousGateTitle}
      </p>
    </section>
  );
}
