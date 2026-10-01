import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession, sessions } from "@/lib/sessions";
import { SessionRunner } from "@/components/SessionRunner";

export function generateStaticParams() {
  return sessions.map((session) => ({ slug: session.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/sessions/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const session = getSession(slug);
  if (!session) return {};
  return {
    title: session.title,
    description: session.tagline,
  };
}

export default async function SessionPage({
  params,
}: PageProps<"/sessions/[slug]">) {
  const { slug } = await params;
  const session = getSession(slug);
  if (!session) notFound();

  return (
    <main className="flex-1">
      <SessionRunner session={session} />
    </main>
  );
}
