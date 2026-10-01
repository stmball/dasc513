import type { EvidenceItem, Session, Stage } from "../types";

export function allStages(session: Session): Stage[] {
  return session.gates.flatMap((gate) => gate.stages);
}

export function allEvidence(session: Session): EvidenceItem[] {
  return session.gates.flatMap((gate) => gate.evidence);
}

/** Index (0, 1, 2) of the gate an evidence id belongs to, or -1 if unknown. */
export function gateIndexOfEvidence(session: Session, evidenceId: string): number {
  return session.gates.findIndex((gate) =>
    gate.evidence.some((item) => item.id === evidenceId),
  );
}
