import type { Stage, Session } from "@/lib/types";
import type { AccentStyle } from "@/lib/accents";

/** Every format page gets the same props — the shared shells and per-format
 * chrome are what make them read as different applications. */
export interface FormatPageProps {
  session: Session;
  stage: Stage;
  accent: AccentStyle;
  opened: Set<string>;
  onOpen: (id: string) => void;
}
