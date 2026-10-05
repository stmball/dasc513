import { sessions } from "@/lib/sessions";
import { SessionGrid } from "@/components/SessionGrid";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Cover: full-bleed navy, white type, white rule, accent fills only on
          the decorative circles — exactly the template's title slide. */}
      <section className="relative overflow-hidden bg-navy">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <span className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-coral opacity-20" />
          <span className="absolute -bottom-40 right-40 h-64 w-64 rounded-full bg-teal opacity-20" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Four rooms, one company,
            <br className="hidden sm:block" /> and a great many documents.
          </h1>
          {/* Decorative rule on navy is white — never an accent colour. */}
          <span aria-hidden className="mt-7 block h-px w-24 bg-white" />
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white-70">
            Meridian Health Analytics builds statistical and machine-learning
            models for the NHS. Over four tutorials you will audit four of its
            products, each one already deployed, each one already causing a
            problem that nobody in the company has quite been willing to name.
          </p>
        </div>
      </section>

      {/* Content: white ground, navy title over a navy rule. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="max-w-2xl space-y-4 text-base leading-relaxed text-navy-70">
          <p>
            Every tutorial is an escape room. Five locks stand between you and
            the override code that releases your findings, and each lock asks a
            single question. You cannot answer it until you have opened the
            evidence it depends on — a datasheet, a chat transcript, a
            coroner&rsquo;s letter, a table of numbers somebody hoped you would
            not add up. Solving a lock yields one character of the code and,
            usually, another document.
          </p>
          <p>
            This is independent, self-paced work. Read each document the way
            you would read evidence for your own research — the numbers, the
            caveats, and what has conspicuously been left out all belong to
            the brief. Where a question admits more than one defensible
            answer, work out your reasoning before you commit to one; the
            reasoning is what you should be able to stand behind, not the
            character the lock happens to accept. Your progress is kept in
            this browser, so you can leave and come back.
          </p>
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-bold">Choose a room</h2>
          <span aria-hidden className="mt-3 block h-px w-full bg-navy-15" />
          <div className="mt-6">
            <SessionGrid sessions={sessions} />
          </div>
        </div>
      </section>

      {/* Closing band: navy, like the cover. */}
      <footer className="bg-navy">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6" />
      </footer>
    </main>
  );
}
