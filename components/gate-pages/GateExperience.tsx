"use client";

import { useMemo } from "react";
import type { Gate, Session } from "@/lib/types";
import { accents } from "@/lib/accents";
import { ALL_GATES_UNLOCKED } from "@/lib/devFlags";
import { useProgress } from "@/lib/progress";
import { GateLockedPage } from "./GateLockedPage";
import { InboxPage } from "./InboxPage";
import { ChatPage } from "./ChatPage";
import { WikiPage } from "./WikiPage";
import { BlogPage } from "./BlogPage";
import { BrochurePage } from "./BrochurePage";
import { ArchivePage } from "./ArchivePage";
import type { FormatPageProps } from "./types";

export function GateExperience({ session, gate }: { session: Session; gate: Gate }) {
  const accent = accents[session.accent];
  const { progress, update } = useProgress(session.slug);
  const gateIndex = session.gates.findIndex((g) => g.id === gate.id);

  const solved = useMemo(() => new Set(progress.solved), [progress.solved]);
  const opened = useMemo(() => new Set(progress.opened), [progress.opened]);

  const unlocked =
    ALL_GATES_UNLOCKED ||
    gateIndex === 0 ||
    session.gates[gateIndex - 1].stages.every((stage) => solved.has(stage.id));

  if (!unlocked) {
    return (
      <GateLockedPage
        session={session}
        gate={gate}
        previousGateTitle={gateIndex > 0 ? session.gates[gateIndex - 1].title : undefined}
      />
    );
  }

  function onOpen(id: string) {
    update((p) => (p.opened.includes(id) ? p : { ...p, opened: [...p.opened, id] }));
  }

  const props: FormatPageProps = { session, gate, accent, opened, onOpen };

  switch (gate.format) {
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
  }
}
