import type { NewImportStep } from "../../types";

type EmptyStateProps = {
  onPickImport: (step: Exclude<NewImportStep, "choose">) => void;
};

export function EmptyState({ onPickImport }: EmptyStateProps) {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white/80 p-8 text-center shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <span className="text-xl" aria-hidden>
            ⌁
          </span>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          No transcriptions yet
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Import a link or add a local file to get started. Everything runs
          offline—no API keys.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onPickImport("url")}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:border-indigo-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-indigo-400 dark:hover:bg-zinc-900/80"
          >
            Import from URL
          </button>
          <button
            type="button"
            onClick={() => onPickImport("local")}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:border-indigo-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-indigo-400 dark:hover:bg-zinc-900/80"
          >
            Import local file
          </button>
        </div>
      </div>
    </div>
  );
}
