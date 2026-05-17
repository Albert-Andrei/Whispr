export function Record() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-16">
      <div className="max-w-sm rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950/40">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <span className="text-xl" aria-hidden>
            🎙
          </span>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Record
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Live dictation is coming soon.
        </p>
      </div>
    </div>
  );
}
