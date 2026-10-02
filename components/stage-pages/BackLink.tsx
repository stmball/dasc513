import Link from "next/link";

/** A small, deliberately unobtrusive way back to the control room — present
 * on every format page so a group can't get stranded, without punching a
 * hole in the "this is a different app" illusion. Neutral black/white so it
 * reads on top of any of the six format skins. */
export function BackLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/sessions/${slug}`}
      className="fixed bottom-4 left-4 z-40 rounded-full border border-slate-300 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-lg backdrop-blur transition-colors hover:border-slate-500 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
    >
      ← Back to your desk
    </Link>
  );
}
