import { ThemeToggle } from "../../components/ThemeToggle";

export function Settings() {
  return (
    <div className="px-5 py-6">
      <p className="text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Tune Whispr to fit your workflow.
      </p>

      <section className="mt-8">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Appearance
        </h3>
        <div className="rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950/60">
          <ThemeToggle />
        </div>
      </section>

      <section className="mt-8">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Transcription
        </h3>
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950/40">
          <p className="text-[13px] text-zinc-600 dark:text-zinc-400">
            Model paths, export defaults, and more will land here soon.
          </p>
        </div>
      </section>
    </div>
  );
}
