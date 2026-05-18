import type { BinaryInfo } from "../../types/types";
import { SettingsRow } from "./SettingsLayout";

type BinaryStatusRowProps = {
  binary: BinaryInfo;
  last?: boolean;
};

export function BinaryStatusRow({ binary, last = false }: BinaryStatusRowProps) {
  const statusLabel = binary.ok ? "Installed" : "Missing";

  return (
    <SettingsRow
      label={binary.label}
      description={binary.role}
      last={last}
    >
      <div className="flex flex-col items-end gap-0.5 text-right">
        <span
          className={
            binary.ok
              ? "text-[13px] font-medium text-zinc-700 dark:text-zinc-200"
              : "text-[13px] font-medium text-red-600 dark:text-red-400"
          }
        >
          {statusLabel}
        </span>
        {binary.ok && binary.sizeBytes != null ? (
          <span className="text-[11px] text-zinc-400">
            {(binary.sizeBytes / 1024 / 1024).toFixed(1)} MB
          </span>
        ) : null}
      </div>
    </SettingsRow>
  );
}

function BinaryStatusRowSkeleton({ last = false }: { last?: boolean }) {
  return (
    <SettingsRow label="Loading…" description="Checking tool status" last={last}>
      <div className="h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
    </SettingsRow>
  );
}

export function BinaryStatusRows({
  health,
  loading,
}: {
  health: BinaryInfo[] | null;
  loading: boolean;
}) {
  if (loading || !health) {
    return (
      <>
        <BinaryStatusRowSkeleton />
        <BinaryStatusRowSkeleton />
        <BinaryStatusRowSkeleton last />
      </>
    );
  }

  return (
    <>
      {health.map((binary, index) => (
        <BinaryStatusRow
          key={binary.id}
          binary={binary}
          last={index === health.length - 1}
        />
      ))}
    </>
  );
}
