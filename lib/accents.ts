import type { Session } from "./types";

/**
 * The brand has exactly two accent colours, and one rule about them: they are
 * used as a **background fill on a shape** and nowhere else. Never on text,
 * never on a line, a rule or a border. Anything that needs to read as text or
 * as an edge is navy (on white) or white (on navy).
 *
 * That is why this interface is so short. There is no `text`, no `border` and
 * no `ring` variant, because the brand does not permit one — a component that
 * wants emphasis fills a box and puts white text inside it.
 *
 * Tailwind cannot see class names built by string interpolation, so each
 * accent's utilities are written out in full.
 */
export interface AccentStyle {
  /** Solid fill for a shape: numbered badge, pill, button, callout box. */
  fill: string;
  /** The same fill for interactive shapes, with hover and focus states. */
  fillInteractive: string;
}

export const accents: Record<Session["accent"], AccentStyle> = {
  coral: {
    fill: "bg-coral",
    fillInteractive: "bg-coral hover:brightness-110 active:brightness-95",
  },
  teal: {
    fill: "bg-teal",
    fillInteractive: "bg-teal hover:brightness-110 active:brightness-95",
  },
};
