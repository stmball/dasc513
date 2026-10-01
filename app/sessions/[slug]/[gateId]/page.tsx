import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession, sessions } from "@/lib/sessions";
import { GateExperience } from "@/components/gate-pages/GateExperience";

export function generateStaticParams() {
  return sessions.flatMap((session) =>
    session.gates.map((gate) => ({ slug: session.slug, gateId: gate.id })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/sessions/[slug]/[gateId]">): Promise<Metadata> {
  const { slug, gateId } = await params;
  const session = getSession(slug);
  const gate = session?.gates.find((g) => g.id === gateId);
  if (!session || !gate) return {};
  return {
    title: gate.chrome,
    description: gate.teaser,
  };
}

export default async function GatePage({
  params,
}: PageProps<"/sessions/[slug]/[gateId]">) {
  const { slug, gateId } = await params;
  const session = getSession(slug);
  const gate = session?.gates.find((g) => g.id === gateId);
  if (!session || !gate) notFound();

  return <GateExperience session={session} gate={gate} />;
}
