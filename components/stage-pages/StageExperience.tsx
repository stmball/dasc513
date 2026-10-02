"use client";

import { useMemo } from "react";
import type { Stage, Session } from "@/lib/types";
import { accents } from "@/lib/accents";
import { ALL_STAGES_UNLOCKED } from "@/lib/devFlags";
import { useProgress } from "@/lib/progress";
import { StageLockedPage } from "./StageLockedPage";
import { InboxPage } from "./InboxPage";
import { ChatPage } from "./ChatPage";
import { WikiPage } from "./WikiPage";
import { BlogPage } from "./BlogPage";
import { BrochurePage } from "./BrochurePage";
import { ArchivePage } from "./ArchivePage";
import { TicketsPage } from "./TicketsPage";
import { PapersPage } from "./PapersPage";
import type { FormatPageProps } from "./types";

export function StageExperience({ session, stage }: { session: Session; stage: Stage }) {
  const accent = accents[session.accent];
  const { progress, update } = useProgress(session.slug);
  const stageIndex = session.stages.findIndex((s) => s.id === stage.id);

  const solved = useMemo(() => new Set(progress.solved), [progress.solved]);
  const opened = useMemo(() => new Set(progress.opened), [progress.opened]);

  const unlocked =
    ALL_STAGES_UNLOCKED ||
    stageIndex === 0 ||
    session.stages[stageIndex - 1].questions.every((question) => solved.has(question.id));

  if (!unlocked) {
    return (
      <StageLockedPage
        session={session}
        stage={stage}
        previousStageTitle={stageIndex > 0 ? session.stages[stageIndex - 1].title : undefined}
      />
    );
  }

  function onOpen(id: string) {
    update((p) => (p.opened.includes(id) ? p : { ...p, opened: [...p.opened, id] }));
  }

  const props: FormatPageProps = { session, stage, accent, opened, onOpen };

  switch (stage.format) {
    case "inbox":
      return <InboxPage {...props} />;
    case "chat":
      return <ChatPage {...props} />;
    case "wiki":
      return <WikiPage {...props} />;
    case "blog":
      return <BlogPage {...props} />;
    case "brochure":
      return <BrochurePage {...props} />;
    case "archive":
      return <ArchivePage {...props} />;
    case "tickets":
      return <TicketsPage {...props} />;
    case "papers":
      return <PapersPage {...props} />;
  }
}
