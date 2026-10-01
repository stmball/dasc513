import type { Session } from "../types";
import { biasSession } from "./bias";
import { transparencySession } from "./transparency";
import { footprintSession } from "./footprint";
import { uncertaintySession } from "./uncertainty";

export const sessions: Session[] = [
  biasSession,
  transparencySession,
  footprintSession,
  uncertaintySession,
].sort((a, b) => a.number - b.number);

export function getSession(slug: string): Session | undefined {
  return sessions.find((session) => session.slug === slug);
}

export const sessionSlugs = sessions.map((session) => session.slug);
