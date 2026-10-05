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
            Four tutorials about one fictional company
          </h1>
          {/* Decorative rule on navy is white — never an accent colour. */}
          <span aria-hidden className="mt-7 block h-px w-24 bg-white" />
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white-70">
            Meridian Health Analytics Ltd supplies statistical and
            machine-learning models to the NHS. These four tutorials use
            fictional products to examine bias, explainability, privacy and
            environmental costs, and uncertainty in clinical AI.
          </p>
        </div>
      </section>

      {/* Content: white ground, navy title over a navy rule. */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="max-w-2xl space-y-4 text-base leading-relaxed text-navy-70">
          <p>
            Each tutorial is a group activity with ten questions in three
            stages. Read the evidence in each stage, then answer the questions
            on the control-room page. Solving a question reveals a debrief and
            one character of the final code. Completing a stage unlocks the
            next one.
          </p>
          <p>
            Work in a group and use the evidence to support each answer.
            Questions may require calculations or comparisons across documents.
            Stage evidence opens in a separate tab; your progress is saved in
            this browser, so you can return to the activity later.
          </p>
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-bold">Choose a tutorial</h2>
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
