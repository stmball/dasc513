import type { EvidenceItem, Session, Question } from "../types";

export function allQuestions(session: Session): Question[] {
  return session.stages.flatMap((stage) => stage.questions);
}

export function allEvidence(session: Session): EvidenceItem[] {
  return session.stages.flatMap((stage) => stage.evidence);
}

/** Index (0, 1, 2) of the stage an evidence id belongs to, or -1 if unknown. */
export function stageIndexOfEvidence(session: Session, evidenceId: string): number {
  return session.stages.findIndex((stage) =>
    stage.evidence.some((item) => item.id === evidenceId),
  );
}
