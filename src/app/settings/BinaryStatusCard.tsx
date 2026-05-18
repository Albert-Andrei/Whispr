import type { BinaryInfo } from "../../types/types";

export function BinaryStatusCard({ binary }: { binary: BinaryInfo }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        binary.ok
          ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/50"
          : "border-red-300 bg-red-50/60 dark:border-red-500/40 dark:bg-red-500/10"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${binary.ok ? "bg-emerald-500" : "bg-red-500"}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {binary.label}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {binary.role}
          </p>
          {binary.version ? (
            <p className="mt-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
              {binary.version}
            </p>
          ) : null}
          {binary.path ? (
            <p
              className="mt-1 break-all font-mono text-[10px] text-zinc-400"
              title={binary.path}
            >
              {binary.path.length > 64
                ? `${binary.path.slice(0, 64)}…`
                : binary.path}
            </p>
          ) : null}
          {binary.sizeBytes != null ? (
            <p className="mt-1 text-[11px] text-zinc-500">
              {(binary.sizeBytes / 1024 / 1024).toFixed(1)} MB
            </p>
          ) : null}
          {!binary.ok ? (
            <p className="mt-3 text-xs font-medium text-red-700 dark:text-red-300">
              Required component. Whispr cannot transcribe without it.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
