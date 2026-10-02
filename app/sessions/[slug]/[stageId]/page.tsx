import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession, sessions } from "@/lib/sessions";
import { StageExperience } from "@/components/stage-pages/StageExperience";

export function generateStaticParams() {
  return sessions.flatMap((session) =>
    session.stages.map((stage) => ({ slug: session.slug, stageId: stage.id })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/sessions/[slug]/[stageId]">): Promise<Metadata> {
  const { slug, stageId } = await params;
  const session = getSession(slug);
  const stage = session?.stages.find((s) => s.id === stageId);
  if (!session || !stage) return {};
  return {
    title: stage.chrome,
    description: stage.teaser,
  };
}

export default async function StagePage({
  params,
}: PageProps<"/sessions/[slug]/[stageId]">) {
  const { slug, stageId } = await params;
  const session = getSession(slug);
  const stage = session?.stages.find((s) => s.id === stageId);
  if (!session || !stage) notFound();

  return <StageExperience session={session} stage={stage} />;
}
